// Runs after the CI "Run Cucumber/BDD tests" step (see
// .github/workflows/playwright.yml) and files a GitHub issue for every
// failed scenario in the report, or comments on the matching existing issue
// if the same scenario has already been reported for the same failure.
// Gated by the AUTO_LOG_BUGS repo variable so it can be toggled off without
// a code change.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const AUTO_BUG_LABEL = "auto-bug";
const MARKER_PREFIX = "<!-- ci-bug-id:";
const REPORT_PATH = path.join(__dirname, "..", "cucumber-report", "cucumber-report.json");
const ARTIFACT_NAME = "bdd-failure-screenshots";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;

let owner, repo, runUrl;
if (repository) {
  [owner, repo] = repository.split("/");
  runUrl = `${process.env.GITHUB_SERVER_URL || "https://github.com"}/${owner}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`;
}

function firstLine(message) {
  return (message || "").split("\n")[0].trim();
}

// Scenario name + first line of the error message: two different failures
// on the same scenario (e.g. a broken selector vs. a real API contract
// change) get separate issues instead of piling into one unrelated thread.
function dedupeHash(name, errorMessage) {
  return crypto.createHash("sha256").update(`${name}|${firstLine(errorMessage)}`).digest("hex").slice(0, 12);
}

function extractFailures(reportPath) {
  const features = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const failures = [];
  for (const feature of features) {
    for (const element of feature.elements || []) {
      if (element.type !== "scenario") continue;
      const failedStep = (element.steps || []).find((step) => step.result?.status === "failed");
      if (!failedStep) continue;
      failures.push({
        name: `${feature.name} — ${element.name}`,
        errorMessage: failedStep.result.error_message || "No error message was captured for this failure.",
      });
    }
  }
  return failures;
}

async function githubRequest(pathAndQuery, options = {}) {
  const response = await fetch(`https://api.github.com${pathAndQuery}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${options.method || "GET"} ${pathAndQuery} failed: ${response.status} ${body}`);
  }
  return response.status === 204 ? null : response.json();
}

// Lists (rather than using the /search/issues endpoint) because search is
// eventually-consistent — an issue filed moments ago by this same script
// earlier in the run isn't guaranteed to be indexed yet, which would file a
// duplicate instead of commenting on it.
async function findExistingIssue(hash) {
  for (let page = 1; ; page += 1) {
    const issues = await githubRequest(
      `/repos/${owner}/${repo}/issues?state=all&labels=${AUTO_BUG_LABEL}&per_page=100&page=${page}`
    );
    if (!issues.length) return null;
    const match = issues.find((issue) => issue.body?.includes(`${MARKER_PREFIX} ${hash} -->`));
    if (match) return match;
    if (issues.length < 100) return null;
  }
}

function screenshotNote() {
  return `**Screenshot:** see the \`${ARTIFACT_NAME}\` artifact on [this CI run](${runUrl}).`;
}

function buildIssueBody(failure, hash) {
  return [
    `**Failing scenario:** ${failure.name}`,
    "",
    "**Failure message:**",
    "```",
    failure.errorMessage,
    "```",
    "",
    screenshotNote(),
    "",
    `${MARKER_PREFIX} ${hash} -->`,
  ].join("\n");
}

function buildCommentBody(failure) {
  return [
    `Failure recurred in [this CI run](${runUrl}).`,
    "",
    "**Failure message:**",
    "```",
    failure.errorMessage,
    "```",
    "",
    screenshotNote(),
  ].join("\n");
}

async function fileFailure(failure) {
  const hash = dedupeHash(failure.name, failure.errorMessage);
  const existing = await findExistingIssue(hash);

  if (existing) {
    await githubRequest(`/repos/${owner}/${repo}/issues/${existing.number}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: buildCommentBody(failure) }),
    });
    if (existing.state === "closed") {
      await githubRequest(`/repos/${owner}/${repo}/issues/${existing.number}`, {
        method: "PATCH",
        body: JSON.stringify({ state: "open" }),
      });
      console.log(`Reopened and commented on #${existing.number}: ${failure.name}`);
    } else {
      console.log(`Commented on existing issue #${existing.number}: ${failure.name}`);
    }
    return;
  }

  const created = await githubRequest(`/repos/${owner}/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title: `[CI] Scenario failing: ${failure.name}`,
      body: buildIssueBody(failure, hash),
      labels: [AUTO_BUG_LABEL],
    }),
  });
  console.log(`Filed new issue #${created.number}: ${failure.name}`);
}

async function main() {
  if (!token || !repository) {
    throw new Error("log-ci-bugs: GITHUB_TOKEN and GITHUB_REPOSITORY must be set (this script is meant to run in CI).");
  }

  if (!fs.existsSync(REPORT_PATH)) {
    console.log(`log-ci-bugs: no report found at ${REPORT_PATH}; nothing to log.`);
    return;
  }

  const failures = extractFailures(REPORT_PATH);
  if (!failures.length) {
    console.log("log-ci-bugs: no failed scenarios — nothing to log.");
    return;
  }

  console.log(`log-ci-bugs: found ${failures.length} failed scenario(s). Filing/updating GitHub issues...`);
  for (const failure of failures) {
    await fileFailure(failure);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

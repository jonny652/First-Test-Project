// Shared by both CI jobs (Playwright and Cucumber/BDD, see
// .github/workflows/playwright.yml) to file a GitHub issue for every test
// failure in the run's report, or comment on the matching existing issue if
// the same test has already been reported for the same failure. Gated by the
// AUTO_LOG_BUGS repo variable so it can be toggled off without a code change.
//
// Usage: node scripts/log-ci-bugs.js <cucumber|playwright>
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const AUTO_BUG_LABEL = "auto-bug";
const MARKER_PREFIX = "<!-- ci-bug-id:";

const SOURCES = {
  cucumber: {
    label: "Cucumber",
    reportPath: path.join(__dirname, "..", "cucumber-report", "cucumber-report.json"),
    artifactName: "bdd-failure-screenshots",
    extract: extractCucumberFailures,
  },
  playwright: {
    label: "Playwright",
    reportPath: path.join(__dirname, "..", "test-results", "results.json"),
    artifactName: "playwright-report",
    extract: extractPlaywrightFailures,
  },
};

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;

let owner, repo, runUrl;
if (repository) {
  [owner, repo] = repository.split("/");
  runUrl = `${process.env.GITHUB_SERVER_URL || "https://github.com"}/${owner}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`;
}

// Playwright's JSON reporter embeds ANSI colour codes in error messages —
// harmless in a terminal, unreadable as literal escape codes in a GitHub
// issue.
function stripAnsi(text) {
  return (text || "").replace(/\[[0-9;]*m/g, "");
}

function firstLine(message) {
  return stripAnsi(message).split("\n")[0].trim();
}

// Failure name + first line of the error message: two different failures on
// the same test (e.g. a broken selector vs. a real API contract change) get
// separate issues instead of piling into one unrelated thread.
function dedupeHash(name, errorMessage) {
  return crypto.createHash("sha256").update(`${name}|${firstLine(errorMessage)}`).digest("hex").slice(0, 12);
}

function extractCucumberFailures(reportPath) {
  const features = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const failures = [];
  for (const feature of features) {
    for (const element of feature.elements || []) {
      if (element.type !== "scenario") continue;
      const failedStep = (element.steps || []).find((step) => step.result?.status === "failed");
      if (!failedStep) continue;
      failures.push({
        name: `${feature.name} — ${element.name}`,
        errorMessage: stripAnsi(failedStep.result.error_message) || "No error message was captured for this failure.",
      });
    }
  }
  return failures;
}

function extractPlaywrightFailures(reportPath) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const failures = [];

  function walk(suite, ancestorTitles) {
    const titlePath = suite.title ? [...ancestorTitles, suite.title] : ancestorTitles;
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        // 'flaky' means an earlier attempt failed but a retry passed — not a
        // real failure. Only 'unexpected' is a genuine failure after retries.
        if (test.status !== "unexpected") continue;
        const lastResult = test.results[test.results.length - 1];
        const project = test.projectName ? `[${test.projectName}] ` : "";
        failures.push({
          name: `${project}${[...titlePath, spec.title].join(" › ")}`,
          errorMessage: stripAnsi(lastResult?.error?.message) || "No error message was captured for this failure.",
        });
      }
    }
    for (const child of suite.suites || []) {
      walk(child, titlePath);
    }
  }

  for (const suite of report.suites || []) {
    walk(suite, []);
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

function screenshotNote(artifactName) {
  return `**Screenshot:** see the \`${artifactName}\` artifact on [this CI run](${runUrl}).`;
}

function buildIssueBody(failure, hash, artifactName) {
  return [
    `**Failing test:** ${failure.name}`,
    "",
    "**Failure message:**",
    "```",
    failure.errorMessage,
    "```",
    "",
    screenshotNote(artifactName),
    "",
    `${MARKER_PREFIX} ${hash} -->`,
  ].join("\n");
}

function buildCommentBody(failure, artifactName) {
  return [
    `Failure recurred in [this CI run](${runUrl}).`,
    "",
    "**Failure message:**",
    "```",
    failure.errorMessage,
    "```",
    "",
    screenshotNote(artifactName),
  ].join("\n");
}

async function fileFailure(failure, artifactName) {
  const hash = dedupeHash(failure.name, failure.errorMessage);
  const existing = await findExistingIssue(hash);

  if (existing) {
    await githubRequest(`/repos/${owner}/${repo}/issues/${existing.number}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: buildCommentBody(failure, artifactName) }),
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
      title: `[CI] Test failing: ${failure.name}`,
      body: buildIssueBody(failure, hash, artifactName),
      labels: [AUTO_BUG_LABEL],
    }),
  });
  console.log(`Filed new issue #${created.number}: ${failure.name}`);
}

async function main() {
  const sourceKey = process.argv[2];
  const source = SOURCES[sourceKey];
  if (!source) {
    throw new Error(`log-ci-bugs: usage: node scripts/log-ci-bugs.js <${Object.keys(SOURCES).join("|")}>`);
  }
  if (!token || !repository) {
    throw new Error("log-ci-bugs: GITHUB_TOKEN and GITHUB_REPOSITORY must be set (this script is meant to run in CI).");
  }

  if (!fs.existsSync(source.reportPath)) {
    console.log(`log-ci-bugs: no ${source.label} report found at ${source.reportPath}; nothing to log.`);
    return;
  }

  const failures = source.extract(source.reportPath);
  if (!failures.length) {
    console.log(`log-ci-bugs: no failed ${source.label} tests — nothing to log.`);
    return;
  }

  console.log(`log-ci-bugs: found ${failures.length} failed ${source.label} test(s). Filing/updating GitHub issues...`);
  for (const failure of failures) {
    await fileFailure(failure, source.artifactName);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

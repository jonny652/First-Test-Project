// Runs cucumber-js and then always generates the HTML report, even if
// scenarios fail. Using `cucumber-js && generate-report` would skip the
// report on any test failure, since `&&` short-circuits on a non-zero
// exit code — exactly when you most want the report.
const { spawnSync } = require("child_process");
const path = require("path");

const projectRoot = path.join(__dirname, "..", "..");
const cucumberBin = path.join(
  projectRoot,
  "node_modules",
  "@cucumber",
  "cucumber",
  "bin",
  "cucumber.js"
);

const cucumber = spawnSync(process.execPath, [cucumberBin], {
  stdio: "inherit",
  cwd: projectRoot,
});

require("./generate-report.js");

// Cucumber's pass/fail status takes priority: a failed report generation
// shouldn't mask real scenario failures, but should still fail the build
// when scenarios otherwise passed.
process.exitCode = cucumber.status !== 0 ? cucumber.status ?? 1 : process.exitCode ?? 0;

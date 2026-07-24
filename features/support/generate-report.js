// Builds the Allure HTML report from the raw results the Cucumber run just
// wrote to allure-results/, then forces the report to open in dark mode.
// Called by run-bdd.js after every test run.
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..", "..");
const allureHome = path.join(
  projectRoot,
  "node_modules",
  "allure-commandline",
  "dist"
);

// Invoke the Allure jar directly instead of the allure/allure.bat wrapper
// scripts: spawning a .bat on Windows requires a shell, and shell quoting
// mangles this project's path (it contains spaces). Calling java.exe
// directly needs no shell, so Node quotes each argument correctly itself.
function findJava() {
  const exeName = process.platform === "win32" ? "java.exe" : "java";

  if (process.env.JAVA_HOME) {
    const fromJavaHome = path.join(process.env.JAVA_HOME, "bin", exeName);
    if (fs.existsSync(fromJavaHome)) return fromJavaHome;
  }

  const finder = process.platform === "win32" ? "where" : "which";
  const probe = spawnSync(finder, ["java"], { encoding: "utf8" });
  if (probe.status === 0) {
    const firstMatch = probe.stdout.split(/\r?\n/).find(Boolean);
    if (firstMatch) return firstMatch.trim();
  }

  // Windows doesn't refresh an already-running process's PATH/JAVA_HOME
  // after an installer updates them — a terminal or IDE left open since
  // before a JRE was installed will never see it, even days later. Fall
  // back to scanning the usual install locations so report generation
  // doesn't depend on the calling shell's environment being fresh.
  if (process.platform === "win32") {
    const candidateRoots = [
      process.env["ProgramFiles"] && path.join(process.env["ProgramFiles"], "Eclipse Adoptium"),
      process.env["ProgramFiles"] && path.join(process.env["ProgramFiles"], "Java"),
      process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Java"),
    ].filter(Boolean);

    for (const root of candidateRoots) {
      if (!fs.existsSync(root)) continue;
      for (const entry of fs.readdirSync(root)) {
        const candidate = path.join(root, entry, "bin", "java.exe");
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }

  return null;
}

const javaExe = findJava();

if (!javaExe) {
  console.error(
    "Allure report generation failed: Java not found. Install a JRE and ensure `java` is on PATH (or set JAVA_HOME), then open a new terminal so it picks up the change."
  );
  process.exit(1);
}
const classpath = [
  path.join(allureHome, "lib", "*"),
  path.join(allureHome, "config"),
].join(path.delimiter);

const result = spawnSync(
  javaExe,
  [
    "-classpath",
    classpath,
    "io.qameta.allure.CommandLine",
    "generate",
    "allure-results",
    "--clean",
    "-o",
    "allure-report",
  ],
  { stdio: "inherit", cwd: projectRoot }
);

if (result.error || result.status !== 0) {
  console.error("Allure report generation failed.");
  process.exitCode = 1;
} else {
  // Allure resolves its theme from localStorage (falling back to OS
  // preference, then light) at runtime, so `allure generate` itself has no
  // dark-mode flag. `--clean` rebuilds index.html from scratch every run,
  // so force it here rather than hand-editing the output.
  const indexPath = path.join(projectRoot, "allure-report", "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  const themeScript =
    "<script>try{localStorage.setItem('allure-theme','dark');}catch(e){}</script>\n";
  fs.writeFileSync(indexPath, html.replace("<head>", "<head>\n    " + themeScript));
}

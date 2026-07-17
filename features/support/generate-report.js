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
const javaExe = process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, "bin", "java")
  : "java";
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
  if (result.error?.code === "ENOENT") {
    console.error(
      "Allure report generation failed: Java not found. Install a JRE and ensure `java` is on PATH (or set JAVA_HOME)."
    );
  } else {
    console.error("Allure report generation failed.");
  }
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

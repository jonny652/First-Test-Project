// Simulates what tsserver does: loads the project via tsconfig.json (a "configured project"),
// then resolves a cross-file symbol (nbsHomePage.closePopup(), where nbsHomePage's type comes
// from NbsHomePage.ts and closePopup() is inherited from BasePage.ts) exactly like hover/go-to-def would.
const ts = require("typescript");
const path = require("path");
const fs = require("fs");

const projectRoot = "C:\\Test Automation Projects\\First-Test-Project";
const configPath = path.join(projectRoot, "tsconfig.json");

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
if (configFile.error) {
  console.error("FAIL: could not read tsconfig.json");
  console.error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
  process.exit(1);
}

const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectRoot);
if (parsed.errors.length > 0) {
  console.error("FAIL: tsconfig.json produced config errors (this is exactly what breaks tsserver's configured project):");
  for (const e of parsed.errors) {
    console.error(" -", ts.flattenDiagnosticMessageText(e.messageText, "\n"));
  }
  process.exit(1);
}

console.log("tsconfig.json parsed cleanly, no config errors.\n");

const program = ts.createProgram({ options: parsed.options, rootNames: parsed.fileNames });
const checker = program.getTypeChecker();

const targetFile = path.join(projectRoot, "tests", "first-test.spec.ts");
const sourceFile = program.getSourceFile(targetFile);
if (!sourceFile) {
  console.error("FAIL: tsserver-equivalent program did not include", targetFile);
  process.exit(1);
}

const text = sourceFile.getFullText();
const needle = "nbsHomePage.closePopup";
const idx = text.indexOf(needle);
if (idx === -1) {
  console.error("FAIL: couldn't find test expression in file");
  process.exit(1);
}
const closePopupPos = idx + "nbsHomePage.".length + 1; // land inside the identifier

function findNodeAtPosition(node) {
  if (pos < node.getStart(sourceFile) || pos >= node.getEnd()) return undefined;
  for (const child of node.getChildren(sourceFile)) {
    const found = findNodeAtPosition(child);
    if (found) return found;
  }
  return node;
}
let pos = closePopupPos;
const node = findNodeAtPosition(sourceFile);

if (!node) {
  console.error("FAIL: no AST node found at position (this is what happens when tsserver falls back to per-file inference)");
  process.exit(1);
}

const symbol = checker.getSymbolAtLocation(node);
if (!symbol) {
  console.error("FAIL: no symbol resolved for 'closePopup' — cross-file resolution is broken");
  process.exit(1);
}

const type = checker.getTypeOfSymbolAtLocation(symbol, node);
const typeString = checker.typeToString(type);
const declFile = symbol.declarations?.[0]?.getSourceFile().fileName;

console.log("Resolved symbol:", symbol.getName());
console.log("Declared in:    ", path.relative(projectRoot, declFile || "?"));
console.log("Type:           ", typeString);

const diagnostics = ts.getPreEmitDiagnostics(program).filter(d =>
  d.file && (d.file.fileName.includes("BasePage.ts") || d.file.fileName.includes("first-test.spec.ts") || d.file.fileName.includes("NbsHomePage.ts"))
);
console.log("\nDiagnostics on related files:", diagnostics.length === 0 ? "none" : diagnostics.length);
for (const d of diagnostics) {
  console.log(" -", ts.flattenDiagnosticMessageText(d.messageText, "\n"));
}

if (declFile && declFile.includes("BasePage.ts") && typeString.includes("Promise<void>")) {
  console.log("\nPASS: cross-file IntelliSense resolves correctly (closePopup's declaration and type were pulled from BasePage.ts into first-test.spec.ts).");
} else {
  console.error("\nFAIL: symbol resolved but not to the expected cross-file declaration/type.");
  process.exit(1);
}

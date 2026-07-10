// multiple-cucumber-html-reporter is an ESM-only package; this project is
// CommonJS, so it has to be loaded via a dynamic import() inside an async
// function rather than a plain require().
(async () => {
  const { generate } = await import("multiple-cucumber-html-reporter");

  generate({
    jsonDir: "reports",
    reportPath: "cucumber-report",
    metadata: {
      browser: { name: "chromium", version: "latest" },
      platform: { name: process.platform, version: "" },
    },
  });
})();

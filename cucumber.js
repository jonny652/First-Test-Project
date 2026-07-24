module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'features/support/**/*.ts',
      'features/step-definitions/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      // 'allure-cucumberjs/reporter' never writes to its output stream (it only
      // writes result files), but Cucumber still only lets ONE formatter without
      // an explicit `target:` claim stdout — picking whichever is listed last.
      // Without a target here it would silently steal stdout from 'progress' and
      // swallow all the passed/failed step dots. Redirecting it to a throwaway
      // file (already gitignored) frees stdout for 'progress'.
      'progress',
      'allure-cucumberjs/reporter:allure-results/formatter.log',
      'json:cucumber-report/cucumber-report.json'
    ],
    formatOptions: {
      resultsDir: 'allure-results'
    }
  }
};

module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'features/support/**/*.ts',
      'features/step-definitions/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'allure-cucumberjs/reporter',
      'json:cucumber-report/cucumber-report.json'
    ],
    formatOptions: {
      resultsDir: 'allure-results'
    }
  }
};

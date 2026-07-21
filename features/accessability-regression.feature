Feature: Accessability-regression
    As a visitor to NBS Source i want to ensure that the accessibility of the site is maintained

  Scenario Outline: Accessibility audit of the <page> page
    Given I navigate to the "<page>" page
    Then an accessibility report should be generated for the "<page>" page

    Examples:
      | page                 |
      | NBS Source homepage  |
      | Dyson manufacturer   |

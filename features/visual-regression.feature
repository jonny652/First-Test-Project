Feature: Visual regression
    As a visitor to NBS Source I want to ensure that the visual appearance of the site is maintained

  Scenario Outline: Visual regression of the <page> page
    Given I navigate to the "<page>" page
    Then the "<page>" page should match the saved screenshot

    Examples:
      | page                 |
      | NBS Source homepage  |
      | Dyson manufacturer   |

Feature: Visual regression
    As a visitor to NBS Source I want to ensure that the visual appearance of the site is maintained

  # Screenshots each page listed below and compares it against a saved
  # baseline image, catching unintended visual changes before they ship.
  Scenario Outline: Visual regression of the <page> page
    Given I navigate to the "<page>" page
    Then the "<page>" page should match the saved screenshot

    Examples:
      | page                 |
      | NBS Source homepage  |
      | Dyson manufacturer   |

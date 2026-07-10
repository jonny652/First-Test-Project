Feature: Dyson manufacturer page
  As a visitor to NBS Source
  I want to view the Dyson manufacturer page
  So that I can find information about Dyson

  Background:
    Given I am on the NBS Source homepage
    And I close the popup
    When I search for "dyson"
    And I open the manufacturers tab
    And I open the Dyson manufacturer page
    Then I should be on the Dyson manufacturer page

  Scenario: The page heading is correct
    Then the heading should be visible
    And the heading should contain "Dyson"

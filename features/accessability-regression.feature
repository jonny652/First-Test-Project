Feature: Accessability-regression
    As a visitor to NBS Source i want to ensure that the accessibility of the site is maintained

 Background:
    Given I am on the NBS Source homepage
    And I close the popup
    When I search for "dyson"
    And I open the manufacturers tab
    And I open the Dyson manufacturer page
    Then I should be on the Dyson manufacturer page

 Scenario: Accessibility audit of the Dyson manufacturer page
    Then an accessibility report should be generated for the Dyson manufacturer page
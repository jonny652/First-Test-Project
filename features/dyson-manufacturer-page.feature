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

  Scenario: Check the Source logo links back to the homepage
    When i check the source logo the href is as expected "/en/gb"

  Scenario: Check the "I'm a manufacturer" button is visible with the right text and link
    When i check the "I'm a manufacturer" button its visible
    Then the "I'm a manufacturer" button should contain text "I'm a manufacturer"
    Then the "I'm a manufacturer" button should have the correct href "https://manufacturers.thenbs.com/nbs-source"

  Scenario: Visual regression of the Dyson manufacturer page
    Then the Dyson manufacturer page should match the saved screenshot

  Scenario: Accessibility audit of the Dyson manufacturer page
    Then an accessibility report should be generated for the Dyson manufacturer page

  Scenario: I should see the "Back to top" button appear after scrolling down, successfully scrolls the page back to the top when clicked, and then hides itself again
    When I click the "Back to top" button it behaves as expected
   
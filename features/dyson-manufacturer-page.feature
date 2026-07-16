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
   
  Scenario:  Assert tabs are all visible, in the correct order, and each href is correct.
    Then the tabs should be visible, in the correct order, and each href should be correct

  Scenario: Ensure that the "I'm a manufacturer" button contains the correct URL.
    Then the "I'm a manufacturer" button should have the correct href "https://manufacturers.thenbs.com/nbs-source"

  Scenario: Assert that the dyson telephone number is correct.
    Then Ensure the HREF attribute on the Dyson telephone number is as expected "tel:08003457788"

  Scenario: Assert that the dyson Website link is visible and the href is correct
    Then Ensure the HREF attribute on the Dyson Website link is as expected "https://www.dyson.co.uk"

  Scenario: Assert the LinkedIn icon is visible and has the expected href
    Then Ensure the HREF attribute on the LinkedIn icon is as expected "https://www.linkedin.com/company/dyson/"

  Scenario: Ensure that the Heart icon allows logged in users to add an item to their collection
    When I click the Heart icon on the Dyson manufacturer page then it behaves as expected
   
    
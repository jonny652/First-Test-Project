Feature: NBS Source API regression
# API / network tests for the Dyson manufacturer page.
#
# These scenarios test how the app behaves at the network level rather than the
# normal UI:
#  - A live check against the OneTrust geolocation API, making sure the response
#    and the UI's locale label agree.
#  - A set of Certifications-tab scenarios that intercept the tab's data request
#    (set up by the Before hook in hooks.ts, which calls the dispatcher in
#    utils/network-stubs.ts) to force states the live data won't give us on demand:
#      * a renamed certification (proves the UI shows what the API returns)
#      * no results (the empty state)
#      * a 500 server error
#      * a slow response (proves the tab waits and still renders)
#      * a dropped connection, where no response arrives at all
#      * a malformed payload: 200 OK but with the data the UI needs missing
#  - One scenario that blocks analytics and other third-party requests to prove
#    the page still renders its core content without them.
#
# Only the renamed-certification and no-results behaviours are implemented so
# far (@stub-certifications, @stub-empty-certifications below) — the rest are
# backlog. utils/network-stubs.ts's registry is designed to make adding them
# straightforward.
#
# Each scenario is wired to its behaviour by its tag (e.g. @stub-error-certifications):
# the Before hook reads the tag and sets up the matching network stub before the
# page loads. The step definitions, hooks and page objects are shared with the
# rest of the suite, so these scenarios reuse the same Background and
# smoke/regression tags as the UI tests.
    
    Background:
    Given I am on the NBS Source homepage
    And I close the popup
    When I search for "dyson"
    And I open the manufacturers tab
    And I open the Dyson manufacturer page
    Then I should be on the Dyson manufacturer page

    # The certifications response is faked ("stubbed") in the Before hook (hooks.ts):
  # the real request still goes to the live API, then the first certification in
  # the response is renamed to a fixed value the live data never has,
  # so the check proves our app shows what the API returns — reliably, no matter
  # what Dyson's real certifications are.
  @regression @stub-certifications
  Scenario: A stubbed certification name renders on the Certifications tab
    When I open the Certifications tab
    Then The first certification tile shows "Stubbed Test Certification"

  # Stubs the API to return zero certifications, proving the UI shows a
  # helpful "no results" message instead of an empty or broken-looking page.
  @regression @stub-empty-certifications
  Scenario: No certifications available shows a suitable message
    When I open the Certifications tab
    Then a suitable message is shown indicating there are no certifications available

  # Stubs the certifications API to fail with a 500 error, proving the tab
  # degrades gracefully (no tiles) instead of crashing the page.
  @regression @stub-server500-error
  Scenario: A 500 server error shows no tiles
    When I open the Certifications tab
    Then the certifications tab renders no certifications

  # Stubs a 200 OK response that's missing the data the UI actually needs,
  # proving the app copes with broken/incomplete API data, not just errors.
  @regression @stub-malformed-certifications
  Scenario: The certifications tab renders no tiles when the api returns a malformed payload
    When I open the Certifications tab
    Then the certifications tab renders no certifications

        # Simulates the connection dropping mid-request, proving the tab
        # still renders (just with no tiles) instead of hanging indefinitely.
        @regression @stub-abort-certifications
  Scenario: The certifications tab renders no tiles when the api request is aborted
    When I open the Certifications tab
    Then the certifications tab renders no certifications
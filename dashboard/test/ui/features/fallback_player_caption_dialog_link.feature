@dashboard_db_access
@no_mobile

Feature: Fallback player caption dialog link

  Scenario: Standalone level with fallback video player has captions popup
    Given I am on "http://studio.code.org/s/coursef/stage/5/puzzle/1?force_youtube_fallback=1"
    And I wait to see ".vjs-big-play-button"
    Then element ".ui-test-fallback-player-caption-dialog-link" is visible
    Then I click selector ".ui-test-fallback-player-caption-dialog-link"
    Then I wait to see ".ui-test-fallback-player-caption-dialog"
    Then I click selector ".ui-test-fallback-player-caption-dialog-close"
    And I wait until I don't see selector ".ui-test-fallback-player-caption-dialog"

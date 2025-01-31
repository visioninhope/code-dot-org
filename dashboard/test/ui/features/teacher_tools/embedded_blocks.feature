Feature: Showing embedded blocks in non-blockly levels
  Checks a non-blockly level with blocks embedded in an iframe, and makes sure
  that those blocks are rendered.

  Background:
    Given I am on "http://studio.code.org/s/allthethings/lessons/13/levels/1?noautoplay=true"

  Scenario:
    When I wait until element ".markdown-container" is visible
    And I wait until element "svg.blocklySvg" is visible within element ".markdown-container"
    Then SVG element "g[block-id='1']" within element ".markdown-container" has class "blocklyUndraggable"

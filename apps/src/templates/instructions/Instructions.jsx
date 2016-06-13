var React = require('react');
var MarkdownInstructions = require('./MarkdownInstructions');
var NonMarkdownInstructions = require('./NonMarkdownInstructions');
import InputOutputTable from './InputOutputTable';

const styles = {
  main: {
    overflow: 'auto'
  }
};

var Instructions = React.createClass({

  propTypes: {
    puzzleTitle: React.PropTypes.string,
    instructions: React.PropTypes.string,
    instructions2: React.PropTypes.string,
    renderedMarkdown: React.PropTypes.string,
    markdownClassicMargins: React.PropTypes.bool,
    aniGifURL: React.PropTypes.string,
    authoredHints: React.PropTypes.element,
    inputOutputTable: React.PropTypes.arrayOf(
      React.PropTypes.arrayOf(React.PropTypes.number)
    ),
    onResize: React.PropTypes.func
  },

  render: function () {
    // Body logic is as follows:
    //
    // If we have been given rendered markdown, render a div containing
    // that, optionally with inline-styled margins. We don't need to
    // worry about the title in this case, as it is rendered by the
    // Dialog header
    //
    // Otherwise, render the title and up to two sets of instructions.
    // These instructions may contain spans and images as determined by
    // StudioApp.substituteInstructionImages
    var instructions;
    if (this.props.renderedMarkdown) {
      instructions = (
        <MarkdownInstructions
          ref="instructionsMarkdown"
          renderedMarkdown={this.props.renderedMarkdown}
          markdownClassicMargins={this.props.markdownClassicMargins}
          onResize={this.props.onResize}
          inTopPane={this.props.inTopPane}
        />
      );
    } else {
      instructions = (
        <NonMarkdownInstructions
          puzzleTitle={this.props.puzzleTitle}
          instructions={this.props.instructions}
          instructions2={this.props.instructions2}
        />
      );
    }
    return (
      <div style={styles.main}>
        {instructions}
        {this.props.inputOutputTable && <InputOutputTable data={this.props.inputOutputTable}/>}
        {this.props.aniGifURL &&
          <img className="aniGif example-image" src={ this.props.aniGifURL }/>
        }
        {this.props.authoredHints}
      </div>
    );
  }
});

module.exports = Instructions;

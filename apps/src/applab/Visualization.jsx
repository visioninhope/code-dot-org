var Radium = require('radium');
var applabConstants = require('./constants');
var commonStyles = require('../commonStyles');
var ProtectedStatefulDiv = require('../templates/ProtectedStatefulDiv');
var connect = require('react-redux').connect;
var experiments = require('../experiments');
var classNames = require('classnames');

var styles = {
  nonResponsive: {
    width: applabConstants.APP_WIDTH,
    height: applabConstants.APP_HEIGHT - applabConstants.FOOTER_HEIGHT
  },
  share: {
    // overrides nonReponsive
    height: applabConstants.APP_HEIGHT
  },
  phoneFrame: {
    marginBottom: 0
  }
};


var Visualization = React.createClass({
  propTypes: {
    visualizationHasPadding: React.PropTypes.bool.isRequired,
    hideSource: React.PropTypes.bool.isRequired,
    isEmbedView: React.PropTypes.bool.isRequired,
  },

  render: function () {
    var appWidth = applabConstants.APP_WIDTH;
    var appHeight = applabConstants.APP_HEIGHT - applabConstants.FOOTER_HEIGHT;

    var addPhoneFrame = experiments.isEnabled('phoneFrame') && !this.props.isShareView;

    return (
      <ProtectedStatefulDiv>
        <div id="visualization"
            className={classNames({with_padding: this.props.visualizationHasPadding})}
            style={[
              (this.props.isEmbedView || this.props.hideSource) && styles.nonResponsive,
              this.props.isShareView && styles.share,
              addPhoneFrame && styles.phoneFrame
            ]}
        >
          <div id="divApplab" className="appModern" tabIndex="1"/>
          <div id="designModeViz" className="appModern" style={commonStyles.hidden}/>
          <svg version="1.1"
               baseProfile="full"
               xmlns="http://www.w3.org/2000/svg"
               id="visualizationOverlay"
               width={appWidth}
               height={appHeight}
               viewBox={"0 0 " + appWidth + " " + appHeight}
               pointerEvents="none"/>
        </div>
      </ProtectedStatefulDiv>
    );
  }
});

module.exports = connect(function propsFromStore(state) {
  return {
    visualizationHasPadding: state.pageConstants.visualizationHasPadding,
    hideSource: state.pageConstants.hideSource,
    isEmbedView: state.pageConstants.isEmbedView,
    isShareView: state.pageConstants.isShareView
  };
})(Radium(Visualization));

var utils = require('./utils');
import experiments from './util/experiments';

var PageAction = utils.makeEnum(
  'DropletTransitionError',
  'FirebaseRateLimitExceeded',
  'SanitizedLevelHtml',
  'UserJavaScriptError',
  'RunButtonClick',
  'StartWebRequest',
  'StaticResourceFetchError',
  'PegasusSectionsRedirect',
  'BrambleError'
);

var MAX_FIELD_LENGTH = 4095;
const REPORT_PAGE_SIZE = experiments.isEnabled('logPageSize') ||
  Math.random() < 0.01;

/**
 * Shims window.newrelic, which is only included in production. This causes us
 * to no-op in other environments.
 */
module.exports = {
  PageAction: PageAction,

  /**
   * @param {string} actionName - Must be one of the keys from PageAction
   * @param {object} value - Object literal representing columns we want to
   *   add for this action
   * @param {number} [sampleRate] - Optional sample rate. Default is 1.0
   */
  addPageAction: function (actionName, value, sampleRate) {
    if (sampleRate === undefined) {
      sampleRate = 1.0;
    }

    if (!window.newrelic) {
      return;
    }

    if (!PageAction[actionName]) {
      console.log('Unknown actionName: ' + actionName);
      return;
    }

    if (typeof(value) !== "object") {
      console.log('Expected value to be an object');
      return;
    }

    if (Math.random() > sampleRate) {
      // Ignore this instance
      return;
    }

    for (var prop in value) {
      // New relic doesnt handle booleans. Make them strings.
      if (typeof value[prop] === 'boolean') {
        value[prop] = value[prop].toString();
      }

      if (typeof value[prop] === 'string') {
        value[prop] = value[prop].substring(0, MAX_FIELD_LENGTH);
      }
    }

    window.newrelic.addPageAction(actionName, value);
  },

  /**
   * Sets an attribute that will be included on any subsequent generated events
   */
  setCustomAttribute: function (key, value) {
    if (!window.newrelic) {
      return;
    }

    window.newrelic.setCustomAttribute(key, value);
  },

  loadFinished() {
    if (!window.newrelic) {
      return;
    }

    window.newrelic.finished();
  },

  logError(e) {
    if (!window.newrelic) {
      return;
    }
    window.newrelic.noticeError(e);
  },

  reportPageSize() {
    if (!REPORT_PAGE_SIZE) {
      return;
    }
    try {
      const resources = performance && performance.getEntriesByType('resource');
      let totalDownloadSize = 0;
      let jsDownloadSize = 0;
      const jsFileRegex = /\.js$/;
      for (const resource of resources) {
        if (resource.transferSize === undefined || resource.encodedBodySize === undefined) {
          return;
        }
        totalDownloadSize += resource.transferSize;
        if (jsFileRegex.test(resource.name)) {
          jsDownloadSize += resource.transferSize;
        }
      }
      console.log(`Total Size transferred: ${totalDownloadSize}`);
      console.log(`JS Size transferred: ${jsDownloadSize}`);
      if (!window.newrelic) {
        return;
      }
      window.newrelic.setCustomAttribute('totalDownloadSize', totalDownloadSize);
      window.newrelic.setCustomAttribute('jsDownloadSize', jsDownloadSize);
    } catch (e) {
      this.logError(e);
    }
  },
};

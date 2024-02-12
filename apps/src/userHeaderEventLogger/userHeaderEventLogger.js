console.log('initial load');

import $ from 'jquery';
$(document).ready(function () {
  console.log('document ready');
});

(function () {
  console.log('autoinvocation');
})();

function ready(fn) {
  if (document.readyState !== 'loading') {
    console.log('already ready');
    fn();
  } else {
    console.log('adding event listener');
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function () {
  console.log('manual ready');
});

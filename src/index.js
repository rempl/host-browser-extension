/* eslint-env browser */
/* global chrome */

chrome.devtools.panels.create(
  'Rempl',
  'img/icon32x32.png',
  'src/plugin.html'
);

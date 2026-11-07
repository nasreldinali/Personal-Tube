function run() {
  var chrome = Application('com.google.Chrome');
  var windows = chrome.windows();
  for (var windowIndex = 0; windowIndex < windows.length; windowIndex++) {
    var tabs = windows[windowIndex].tabs();
    for (var tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
      var url = tabs[tabIndex].url();
      if (typeof url === 'string' && /^http:\/\/(?:127\.0\.0\.1|localhost):4173(?:[/?#]|$)/.test(url)) {
        windows[windowIndex].activeTabIndex = tabIndex + 1;
        windows[windowIndex].minimized = false;
        windows[windowIndex].index = 1;
        chrome.activate();
        return 'focused';
      }
    }
  }
  if (windows.length === 0) {
    chrome.windows.push(chrome.Window());
    windows = chrome.windows();
    windows[0].tabs[0].url = 'http://127.0.0.1:4173/';
  } else {
    windows[0].tabs.push(chrome.Tab({ url: 'http://127.0.0.1:4173/' }));
    windows[0].activeTabIndex = windows[0].tabs().length;
  }
  windows[0].minimized = false;
  windows[0].index = 1;
  chrome.activate();
  return 'opened';
}

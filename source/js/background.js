chrome.extension.onConnect.addListener(function(port) {
  var tab = port.sender.tab;
  // This will get called by the content script we execute in the tab as a result of the user pressing the browser action.
  port.onMessage.addListener(function(info) {
    var max_length = 1024;
    if (info.selection.length > max_length)
      info.selection = info.selection.substring(0, max_length);
      open_focus_options();
  });
});

// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function(tab) {
   open_focus_options();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Update Chrome Badge Text.
  if (request.messages > 0) {
    chrome.browserAction.setBadgeBackgroundColor({color:[252, 91, 151, 255]});
    chrome.browserAction.setBadgeText({text: request.messages });
  } else {
    chrome.browserAction.setBadgeText({text: '' });
  }
});

function open_focus_options() {
  var options_url = chrome.extension.getURL('options.html'); 
  chrome.tabs.query({}, function(extensionTabs) {
    var found = false;
    for (var i=0; i < extensionTabs.length; i++) {
      if (options_url == extensionTabs[i].url) {
        found = true;
        chrome.tabs.update(extensionTabs[i].id, {"selected": true});
      }
    }
    if (found === false) {
      chrome.tabs.create({url: "options.html"});
    }
  });
}

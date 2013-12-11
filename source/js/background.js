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

// Get Settings
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var my_settings = localStorage["mode"];

  if (request.retrieve == "settings"){
    sendResponse({settings: my_settings});
  }
});

// Inject CSS file dependent on settings
chrome.tabs.onCreated.addListener(inject_css);
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    if (info.status == 'complete') inject_css();
});


function inject_css() {
  var my_settings = localStorage["mode"];
  var path;

  if (my_settings === "classic") {
  	path = "css/classic.css"
  } else {
  	path = "css/tiles.css"
  }

  chrome.tabs.insertCSS(null, {file: "css/base.css"});
	chrome.tabs.insertCSS(null, {file: path});
}

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

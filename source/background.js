chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  var my_settings = localStorage["mode"];

  if (request.retrieve == "settings"){
    sendResponse({settings: my_settings});
  }
});

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

	chrome.tabs.insertCSS(null, {file: path});
}
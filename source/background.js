chrome.tabs.onCreated.addListener(do_something);
chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
    if (info.status == 'complete') do_something();
});

function do_something() {
  var my_settings = localStorage["mode"];
  var path;

  if (my_settings === "classic") {
  	path = "classic.css"
  } else {
  	path = "tiles.css"
  }

	chrome.tabs.insertCSS(null, {file: path});
}
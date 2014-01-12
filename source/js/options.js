$(document).ready(function() {
  $("#excerpt_priority").sortable();
  $("#excerpt_priority").disableSelection();

  restore_options();

  $('#save').click(function() {
    save_options()
  })
});


// Saves options to Google Storage.
function save_options() {
  var settings = {}

  // Save options for Matches View Mode
  var chosen_mode = $("select#mode").val();
  settings["mode"] = chosen_mode;

  // Store Priority as an Array
  var priority_array = []
  $('#excerpt_priority').find('li').each(function() {
    var id = $(this).attr('id');
    priority_array.push(id);
  });
  settings["priority"] = priority_array;

  // Update status to let user know options were saved.
  var status = $("#status");
  status.html("Options Saved.");
  setTimeout(function() {
    status.empty();
  }, 1000);

  // Store in Chrome Storage.
  chrome.storage.sync.set({"settings": settings});
}

function restore_options() {
  // Restore Matches View Mode Settings.
  chrome.storage.sync.get("settings", function (obj) {
    // Retrieve settings for Matches View Mode.
    var options_mode = obj['settings']['mode'];
    if (options_mode) {
      $('select#mode').val(options_mode)
    }

    // Retrieve settings for Priority and put them into the proper order.
    var priority_settings = obj['settings']['priority'];
    for (var i = 0; i < priority_settings.length; i++) {
      console.log(priority_settings[i])
      var item = $('li#' + priority_settings[i]);
      $('#excerpt_priority').append(item);
    }
  });
}

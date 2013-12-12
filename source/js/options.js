$(document).ready(function() {
  $("#excerpt_priority").sortable();
  $("#excerpt_priority").disableSelection();

  restore_options();

  $('#save').click(function() {
    save_options()
  })
});


// Saves options to localStorage.
function save_options() {
  // Save options for Matches View Mode
  var select = $("select#mode");
  var chosen_mode = select.val();
  localStorage["mode"] = chosen_mode;

  // Store Priority as an Array
  var priority_array = []
  $('#excerpt_priority').find('li').each(function() {
    var id = $(this).attr('id');
    priority_array.push(id);
  });
  localStorage["priority"] = priority_array;

  // Store "Add Notes" Setting
  var add_notes;
  if ($("#add_notes").is(':checked')) {
    add_notes = true;
  } else {
    add_notes = false;
  }
  localStorage["add_notes"] = add_notes;

  // Update status to let user know options were saved.
  var status = $("#status");
  status.html("Options Saved.");
  setTimeout(function() {
    status.empty();
  }, 1000);
}

function restore_options() {
  // Restore Matches View Mode Settings.
  var options_mode = localStorage["mode"];
  if (options_mode) {
    $('select#mode').val(options_mode)
  }

  // Retrieve and split settings for Priority
  var priority_settings = localStorage["priority"];
  priority_settings = priority_settings.split(',')

  // Put Priorities into the proper order.
  for (var i = 0; i < priority_settings.length; i++) {
    console.log(priority_settings[i])
    var item = $('li#' + priority_settings[i]);
    $('#excerpt_priority').append(item);
  }

  // Load Add_Notes Settings
  var add_notes = localStorage["add_notes"];
  if (add_notes === "true") {
    $('#add_notes').attr('checked', true);
  }

}

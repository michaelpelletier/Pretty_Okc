$(document).ready(function() {
  $("#excerpt_priority").sortable();
  $("#excerpt_priority").disableSelection();

  restore_options();
  bind_import_settings();
});


function bind_import_settings() {
  $('#import_field').change(function() {
    var status = $("#status");
    status.empty();

    if (check_valid_type()) {
      read_file();
    } else {
      status.html("<div class='oknotice error'>File must be a txt document.</div>");
    }
  });

  function check_valid_type() {
    var files = document.getElementById('import_field').files;
    var filename = files[0].name;
    var filetype = filename.substring(filename.lastIndexOf("."));

    if (filetype === '.txt') {
      return true;
    } else {
      return false;
    }
  }

  function read_file() {
    var files = document.getElementById('import_field').files;
    if (!files.length) {
      alert('Please select a file');
      return;
    }

    var file = files[0];
    var reader = new FileReader();
    var file_data;

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) { 
        file_data = evt.target.result;
        //$('#file_content').text(file_data);

        if (file_data !== "") {
          file_data = JSON.parse(file_data);
          chrome.storage.sync.set({"settings": file_data['settings']});
          chrome.storage.sync.set({"favorites": file_data['favorites']});

          // Update status to let user know settings were imported.
          var status = $("#status");
          status.html("<div class='oknotice success'>Settings Imported.</div>");
          setTimeout(function() {
            status.empty();
            restore_options();
            $('#import_field').val('');
          }, 1000);
        }
      }
    };

    reader.readAsBinaryString(file);
  }
}

// Saves options to Google Storage.
function save_options(favorites_array, message) {
  var settings = {};
  var hidden_users = {};

  // Save options for Matches View Mode.
  var chosen_mode = $("select#mode").val();
  settings["mode"] = chosen_mode;

  // Store Priority as an Array
  var priority_array = []
  $('#excerpt_priority').find('li').each(function() {
    var id = $(this).attr('id');
    priority_array.push(id);
  });
  settings["priority"] = priority_array;

  // Hidden User Settings
  hidden_users['hidden_users_inactive'] = $('#hidden_users_inactive').is(':checked');
  hidden_users['hidden_users_older'] = $('#hidden_users_older').is(':checked');

  // Update status to let user know options were saved.
  if (message === true) {
    var status = $("#status");
    status.html("<div class='oknotice success'>Options Saved.</div>");
    setTimeout(function() {
      status.empty();
    }, 1000);
  }

  // Store in Chrome Storage.
  chrome.storage.sync.set({"settings": settings});
  chrome.storage.sync.set({"favorites": favorites_array});
  chrome.storage.sync.set({"hidden_users": hidden_users});  
}

function restore_options() {
  // Restore Matches View Mode Settings.
  var all_settings = ["settings", "favorites", "hidden_users"];
  chrome.storage.sync.get(all_settings, function (obj) {

    var options_mode = "tiles";
    var priority_settings = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    var favorites_array = [];
    var hidden_users = {
      "hidden_users_inactive": false,
      "hidden_users_older": false
    };

    if (obj) {
      if (obj['settings'] && obj['settings']['mode']) {
        // Retrieve settings for Matches View Mode.
        options_mode = obj['settings']['mode'];
      }

      if (obj['settings'] && obj['settings']['priority']) {
        priority_settings = obj['settings']['priority'];
      }

      if (obj['favorites']) {
        favorites_array = obj['favorites'];
      }

      if (obj['hidden_users']) {
        hidden_users = obj['hidden_users'];
      }
    }

    // Adjust page settings with values.
    $('select#mode').val(options_mode);

    // Set priority order.
    for (var i = 0; i < priority_settings.length; i++) {
      var item = $('li#' + priority_settings[i]);
      $('#excerpt_priority').append(item);
    }

    // Update hidden users options.
    var display_inactive = hidden_users['hidden_users_inactive'];
    var display_older = hidden_users['hidden_users_older'];

    if (display_inactive) {
      $('#hidden_users_inactive').prop('checked', true);
    } else{
      $('#hidden_users_inactive').removeAttr('checked');
    }

    if (display_older) {
      $('#hidden_users_older').prop('checked', true);
    } else{
      $('#hidden_users_older').removeAttr('checked');
    }   

    generate_export_link();
    save_options(favorites_array, false);

    $('[data-js-link="import_link"]').click(function() {
      $(this).siblings('.file_uploader').removeClass('hidden_helper');
    });

    $('#save').click(function() {
      save_options(favorites_array, true);
    });

    function generate_export_link() {
      $('.export').find('a').remove();
      var link = document.createElement("a");
      link.textContent = "Export settings";
      link.download = "pretty_okc_settings.txt";
      link.href = "data:text," + JSON.stringify(obj) + ""
      $('.export').prepend(link);
    }
  });
}

$(document).ready(function() {
  $("#excerpt_priority").sortable();
  $("#excerpt_priority").disableSelection();

  restore_options();
  bind_import_settings();
});


function bind_import_settings() {
  $('#import_field').change(function() {
    read_file();
  })

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
          status.html("Settings Imported.");
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
function save_options(favorites_array) {
  var settings = {}

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

  // Update status to let user know options were saved.
  var status = $("#status");
  status.html("Options Saved.");
  setTimeout(function() {
    status.empty();
  }, 1000);

  // Store in Chrome Storage.
  chrome.storage.sync.set({"settings": settings});
  chrome.storage.sync.set({"favorites": favorites_array});
}

function restore_options() {
  // Restore Matches View Mode Settings.
  var all_settings = ["settings", "favorites"];
  chrome.storage.sync.get(all_settings, function (obj) {

    var options_mode = "tiles";
    var priority_settings = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    var favorites_array = [];

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
    }

    // Adjust page settings with values.
    $('select#mode').val(options_mode);

    // Set priority order.
    for (var i = 0; i < priority_settings.length; i++) {
      var item = $('li#' + priority_settings[i]);
      $('#excerpt_priority').append(item);
    }

    generate_export_link();
    save_options(favorites_array);

    $('[data-js-link="import_link"]').click(function() {
      $(this).siblings('.file_uploader').removeClass('hidden_helper');
    });



    $('#save').click(function() {
      save_options(favorites_array);
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

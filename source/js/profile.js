PrettyOkc.Profile = (function() {
  function init() {   
    var url = window.location.href;

    expand_favorite_options();
    style_buttons_with_icons();

    // Are we on the Questions page?
    if (url.indexOf("questions") > 0) {
      add_recent_questions_option();
    }

    // Makes the Message Modal draggable.
    $("#message_modal").draggable();
  }

  function style_buttons_with_icons() {
    fix_online_indicator();

    // Other Buttons
    $('.action_options').find('#hide_btn').attr('title', 'Hide this user');
    $('.action_options').find('#unhide_btn').attr('title', 'Unhide this user');
    $('.action_options').find('#flag_btn').attr('title', 'Report');
    $('.action_options').find('#flag_btn').parent('p').addClass('report');

    // Add Note
    var onclick = "Profile.loadWindow('edit_notes', 244); return false;"
    $('.action_options .btn.favorite').after('<p class="btn small white notes"><a onclick="' + onclick + '">Add Note</a></p>');
    var notes_container = $('.action_options').find('.btn.notes');
    var notes_button = notes_container.find('a');

    check_notes_status();
    $('#edit_notes_form').find('#save_a').click(function() {
      check_notes_status();
    });

    function check_notes_status() {
      if ($('#inline_notes').is(':visible')) {
        notes_container.addClass('has_note');
        notes_button.attr('title', 'Edit Note');
      } else {
        notes_container.removeClass('has_note');
        notes_button.attr('title', 'Add Note');
      }
    }

    function fix_online_indicator() {
      $('#action_bar_interior').find('.online_now').text("Online");
    }
  }

  function expand_favorite_options() {
    $('.action_options').find('.btn.small.white:contains("Favorite")').addClass('favorite');
    var favorites_container = $('.action_options').find('.btn.favorite');
    var favorites_button = favorites_container.find('a');
    var profile_name = $('#basic_info_sn').text();
    $('#actions').append('<div class="favorites_list hidden_helper"><span class="title">Add to List</span><ul class="favorites"></ul></div>');
    var favorites_list = $('.favorites_list');

    check_favorite_status_default();
    favorites_button.click(function() {
      check_favorite_status();
    });

    add_favorite_lists();
    bind_list_toggle();

    function add_favorite_lists() {
      $.each(favorites_array, function(index, value) {
        var checked = ($.inArray(profile_name, value.users) > 0);
        var list = JSON.parse(value.list_name);

        if (checked) {
          $('ul.favorites').append('<li><input type="checkbox" name="favorites" value="' + list + '" checked><span>' + list + '</span></li>');
        } else {
          $('ul.favorites').append('<li><input type="checkbox" name="favorites" value="' + list + '"><span>' + list + '</span></li>');
        }
      });

      if ($('ul.favorites').find('li').length === 0) {
        $('ul.favorites').append('<li>You have no custom lists.</li>');
      }
    }

    function check_favorite_status_default() {
      if (favorites_button.text() === "Remove Favorite") {
        favorites_container.addClass("is_favorite");
        favorites_button.attr('title', 'Remove from Favorites');
        bind_favorites_hover();
      } else {
        favorites_container.removeClass("is_favorite");
        favorites_button.attr('title', 'Add to Favorites');
        favorites_list.addClass('hidden_helper');
        favorites_button.unbind('mouseover');
      }
    }

    function check_favorite_status() {
      if (favorites_container.hasClass('is_favorite')) {
        favorites_container.removeClass("is_favorite");
        favorites_button.attr('title', 'Add to Favorites');
        favorites_list.addClass('hidden_helper');
        favorites_button.unbind('mouseover');
      } else {
        favorites_container.addClass("is_favorite");
        favorites_button.attr('title', 'Remove from Favorites');
        favorites_list.removeClass('hidden_helper');
        bind_favorites_hover();
      }
    }

    function bind_favorites_hover() {
      favorites_button.mouseover(function() {
        favorites_list.removeClass('hidden_helper');
      });

      favorites_list.mouseleave(function() {
        favorites_list.addClass('hidden_helper');
      });
    }

    function bind_list_toggle() {
      $('ul.favorites').find('input').change(function() {
        var checked = this.checked;
        var this_list = $(this).val();

        if (checked) {
          add_name_to_list(profile_name, this_list, favorites_array);
        } else {
          remove_name_from_list(profile_name, this_list, favorites_array);
        }
      });
    }
  }

  function add_recent_questions_option() {
    // Add the Recently Answered option.
    var container = $('#question_search_suggestions');
    var link = container.find('.category a').attr('href').replace('/profile/', '');
    var name_array = link.split('/');
    var username = name_array[0];
    container.append('<li class="category" id="category_recently_answered"><a href="/profile/' + username + '/questions?recent=1">Recently Answered</a></li>');
  }

  return {
    init: init
  }
})();
var PrettyOkc = PrettyOkc || {};
var all_settings = ["settings", "favorites"];
var favorites_array, excerpt_priority, message_count;

chrome.storage.sync.get(all_settings, function (obj) {
	// Set defaults in case the user did not visit the options page first.
  var default_tiles = "tiles";
  var default_favorites = [];
  var default_priority = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  var current_page = PrettyOkc.Common.get_location();

  PrettyOkc.Common.set_default_options(obj);
  PrettyOkc.Common.init_body_classes();
	PrettyOkc.Social.init_message_icon();

	switch(current_page) {
		case "profile":
			PrettyOkc.Profile.init();
  		break;
  	case "matches":
  		PrettyOkc.Matches.init();
			break;
		case "favorites":
			PrettyOkc.Favorites.init();
			break;
		case "likes":
  		PrettyOkc.Social.init();
  		break;
  	case "you_like":
  		PrettyOkc.Social.init();
  		PrettyOkc.Social.add_likes_filters();
  		break;
 	}
});

PrettyOkc.Common = (function() {
	function init_body_classes() {
		$('body').addClass('pretty_okc');
	}

	function add_private_notes() {
		// Adds a link for each user to Add or Edit private notes for them.
		$('.user_row_item').each(function() {
			var notes = $(this).find('.note');
			var onclick = notes.find('a').attr('onclick');
			var classes;
			var title;

			if (notes.is(':visible')) {
				classes = "favorites_action action_add_note has_note";
				title = "Edit private note";
			} else {
				classes = "favorites_action action_add_note";
				title = "Add private note";
			}

			$(this).find('.action_rate').before('<span class="' + classes + '" onclick="' + onclick + '" title="' + title + '">private note</span>');
		});
	}

	function array_move(arr, fromIndex, toIndex) {
	  var element = arr[fromIndex]
	  arr.splice(fromIndex, 1);
	  arr.splice(toIndex, 0, element);
	}

	function get_location() {
		var url = window.location.href;
		var page;

		if 			(url.indexOf("profile") > 0) 				{	page = "profile";	} 
		else if (url.indexOf("match") > 0) 					{ page = "matches";	} 
		else if (url.indexOf("favorites") > 0) 			{ page = "favorites";	} 
		else if (url.indexOf("visitors") > 0) 			{	page = "likes";	} 
		else if (url.indexOf("who-you-like") > 0) 	{	page = "you_like";	} 
		else if (url.indexOf("who-likes-you") > 0) 	{ page = "likes"; }

		return page;
	}

  function set_default_options(obj) {
		// Default Favorites
		if (obj && obj['favorites']) {
			favorites_array = obj['favorites'];
		} else {
			favorites_array = default_favorites;
		}

		// Default Priority
		if (obj && obj['settings'] && obj['settings']['priority']) {
			excerpt_priority = obj['settings']['priority'];
		} else {
			excerpt_priority = default_priority;	
		}
  }

	return {
		init_body_classes: init_body_classes,
    add_private_notes: add_private_notes,
    array_move: array_move,
    get_location: get_location,
    set_default_options: set_default_options
  }
})();

PrettyOkc.Social = (function() {
	function init() {
		PrettyOkc.Common.add_private_notes();
  	PrettyOkc.Favorites.create_favorites_hover();
	}

  function add_likes_filters() {
    var HTML = '<div class="your_likes big_dig"><div class="right"><ul><li class="title">Filters</li><li class="default"><a href="/who-you-like?show_min_personality=3&show_max_personality=5">3-5 Star (Default)</a></li><li class="actual_likes"><a href="/who-you-like?show_min_personality=4&show_max_personality=5">4-5 Star (Likes)</a></li><li class="all_rated"><a href="/who-you-like?show_min_personality=1&show_max_personality=5">All Rated Users</a></li><li>&nbsp;</li><li class="only_5"><a href="/who-you-like?show_min_personality=5&show_max_personality=5">5 Star Only</a></li><li class="only_4"><a href="/who-you-like?show_min_personality=4&show_max_personality=4">4 Star Only</a></li><li class="only_3"><a href="/who-you-like?show_min_personality=3&show_max_personality=3">3 Star Only</a></li><li class="only_2"><a href="/who-you-like?show_min_personality=2&show_max_personality=2">2 Star Only</a></li><li class="only_1"><a href="/who-you-like?show_min_personality=1&show_max_personality=1">1 Star Only</a></li><li class="custom"></li></ul></div></div>';

    $('.tab_content_nav').append(HTML);

    var url = window.location.href;
    if (url.indexOf("show_min_personality=3&show_max_personality=5") > 0) {
      $('.default').addClass('active');
    } else if (url.indexOf("show_min_personality=4&show_max_personality=5") > 0) {
      $('.actual_likes').addClass('active');
    } else if (url.indexOf("show_min_personality=5&show_max_personality=5") > 0) {
      $('.only_5').addClass('active');
    } else if (url.indexOf("show_min_personality=4&show_max_personality=4") > 0) {
      $('.only_4').addClass('active');
    } else if (url.indexOf("show_min_personality=3&show_max_personality=3") > 0) {
      $('.only_3').addClass('active');
    } else if (url.indexOf("show_min_personality=2&show_max_personality=2") > 0) {
      $('.only_2').addClass('active');
    } else if (url.indexOf("show_min_personality=1&show_max_personality=1") > 0) {
      $('.only_1').addClass('active');
    } else if (url.indexOf("show_min_personality=1&show_max_personality=5") > 0) {
      $('.all_rated').addClass('active');
    } else if (url.indexOf("show_min_personality=3") > 0) {
      $('.default').addClass('active');
    }
  }

  function init_message_icon() {
		update_message_count();
		var observer = new MutationSummary({
		  callback: update_message_count,
		  queries: [{ element: '#nav_mailbox_badge, span.curr, span.rollingnumber' }]
		});
  }

  function update_message_count() {
		message_count = $('#nav_mailbox_badge').find('span.curr').text();
		if (!message_count) {
			message_count = 0;
		}
		chrome.runtime.sendMessage({ messages: message_count});
  }

  return {
    init: init,
    init_message_icon: init_message_icon,
    add_likes_filters: add_likes_filters
  }
})();
var all_settings = ["settings", "favorites", "min_match"];

chrome.storage.sync.get(all_settings, function (obj) {
	// Set defaults in case the user did not visit the options page first.
	var message_count;
	var matches_mode;
	var excerpt_priority;
	var favorites_array;
	var min_match_percent;
  var default_tiles = "tiles";
  var default_favorites = [];
  var default_priority = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  var default_min_percent = "0";

  set_default_options();
	add_body_class(matches_mode);

	// Message Count for Icon.
	update_count();
	var observer = new MutationSummary({
	  callback: update_count,
	  queries: [{ element: '#nav_mailbox_badge, span.curr, span.rollingnumber' }]
	});

	var current_page = get_location();

	switch(current_page) {
		case "profile":
			expand_favorite_options(favorites_array);
  		style_buttons_with_icons();

  		var url = window.location.href;
  		if (url.indexOf("questions") > 0) {
  			add_recent_questions_option();
  		}  		
  		break;
  	case "matches":
  		update_matches_page();
  		minimum_percentage_option(min_match_percent);

			var observer = new MutationSummary({
			  callback: update_matches_page,
			  queries: [{ element: '.match_card_wrapper' }]
			});

			if (matches_mode === "classic") {
				// I really don't like this, but haven't found a better way to pass these settings yet.
	  		$('body').append('<input type="hidden" id="excerpt_priority" value="' + excerpt_priority + '">')
				
				add_excerpt_div();

				var observer = new MutationSummary({
				  callback: add_excerpt_div,
				  queries: [{ element: '.match_card_wrapper' }]
				});
			} 
			break;
		case "favorites":
			remove_favorite_pagination(favorites_array);
			break;
		case "likes":
			add_private_notes();
  		create_favorites_hover(favorites_array);
  		break;
  	case "you_like":
  		add_private_notes();
  		create_favorites_hover(favorites_array);
  		add_likes_filters();
  		break;
 	}

  function set_default_options() {
 	  // Default Options
	  if (obj && obj['settings'] && obj['settings']['mode']) {
			matches_mode = obj['settings']['mode'];
		} else {
			matches_mode = default_tiles;
		}

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

		// Default Min Priority
		if (obj && obj['min_match']) {
			min_match_percent = obj['min_match'];
		} else {
			min_match_percent = default_min_percent;
		}
  }

	function update_count() {
		message_count = $('#nav_mailbox_badge').find('span.curr').text();
		if (!message_count) {
			message_count = 0;
		}
		chrome.runtime.sendMessage({ messages: message_count});
	}

	// Matches Page Functions
	function update_matches_page() {
		change_tile_text();
		add_star_ratings();
		filter_minimum_percentage();

		function change_tile_text() {
			$('.match_card_wrapper').each(function() {
				var self = $(this);

				// Remove state abbreviation.
				var userinfo = self.find('.userinfo');
				var location = userinfo.text();
				location = location.replace('·', ' · ').split(',');
				userinfo.text(location[0]);	

				// Remove "Match" from Match Percentage.
				var percents = self.find('.percentages');
				var match = $.trim(percents.text());
				match = match.split(' ');
				percents.text(match[0]);
			});
		}

		function add_star_ratings() {
			$('.match_card_wrapper').each(function() {
				var self = $(this);
				var stars = calculate_star_ratings(self);
				apply_star_ratings(self, stars)

				// If the user changes a rating, adjust accordingly
				self.find('#personality-rating').find('li').find('a').click(function() {
					setTimeout(function() {
						var new_stars = calculate_star_ratings(self);
						apply_star_ratings(self, new_stars);
					}, 500);
				});
			});

			function calculate_star_ratings(self) {
				var rating_width = self.find('.current-rating').css('width').replace("px", "");
				rating_width = parseInt(rating_width);

				if (rating_width === 0) {
					return "no_rating";
				} else if (rating_width > 10 && rating_width < 40) {
					return "low_rating";
				} else if (rating_width > 50 && rating_width < 70) {
					return "partial_rating";
				} else if (rating_width > 70) {
					return "full_rating";
				}
			}

			function apply_star_ratings(self, stars) {
				var action_rating = self.find('.star_rating').length === 0;
				if (action_rating) {
					self.find('.match_card_text').append('<div class="star_rating ' + stars + '"></div>');
				} else {
					self.find('.star_rating').removeClass('no_rating').removeClass('partial_rating').removeClass('full_rating').removeClass('low_rating').addClass(stars);
				}
			}
		}

		function filter_minimum_percentage() {
			$('.match_card_wrapper').each(function() {
				var match_percent = $(this).find('.percentages').text();
				match_percent = match_percent.replace('%', '');

				if (match_percent < min_match_percent) {
					$(this).hide();
				}
			});
		}
	}

});

/*** General Functions ***/
function add_body_class(matches_mode) {
	$('body').addClass("pretty_okc").addClass(matches_mode);
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

function arraymove(arr, fromIndex, toIndex) {
  var element = arr[fromIndex]
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}

// Matches View
function minimum_percentage_option(min_match_percent) {
	// Add New Option.
	$('#add_filter').before('<div class="form_element selector min_match_percent"><p class="button"><a id="toggle_matches"><span class="arrow"></span>Matches above <span id="current_match"></span>%</a></p><div class="drop_wrap"><ul><li>Matches above: <input id="min_match" name="matchmin" maxlength="2" value=""></li></ul></div></div>');

	// Set Default Values.
	$('#current_match').text(min_match_percent);
	$('#min_match').val(min_match_percent);

	// Bind open / close of Option Menu.
	$('#toggle_matches').click(function(e) {
		e.preventDefault();
		$(this).parent('.button').toggleClass('active');
		$(this).parents('.min_match_percent').toggleClass('open');
	});

	// Close on Body Click.
	$(document).mouseup(function (event) {
		var container = $(".form_element.min_match_percent");

    if (!container.is(event.target) && container.has(event.target).length === 0) {
    	container.removeClass('open');
    	container.find('.button').removeClass('active');
    }
	});

	// Update Values on Change.
	$('#min_match').change(function() {
		var new_percent = $(this).val();

		$('#current_match').text(new_percent);
		chrome.storage.sync.set({"min_match": new_percent});
	});
}

// Classic View - Profile Excerpt
function add_excerpt_div() {
	$('.match_card_wrapper').each(function() {
		var self = $(this);
		if (self.find('.pretty_okc_profile_excerpt').length < 1) {
			self.find(".match_card_text").after('<div class="pretty_okc_profile_excerpt"></div>');
			var username = self.attr('id').replace('usr-', '').replace('-wrapper', '');
			get_profile_excerpt(username);
		} 
	});

	function get_profile_excerpt(username) {
		var priority = $('#excerpt_priority').val();
		priority = priority.split(',');
		var full_url = 'http://www.okcupid.com/profile/' + username + " #main_column";
		var excerpt = $('#usr-' + username + '-wrapper').find('.pretty_okc_profile_excerpt');
		excerpt.load(full_url, function(response) {
			parse_excerpt(response, excerpt, priority);
		});
	}

	function parse_excerpt(response, excerpt, priority) {
		var available_excerpts = [];
		excerpt.find('.essay').each(function() {
			available_excerpts.push($(this).attr('id'));
		});

		// If their profile is empty
		if (available_excerpts.length === 0) {
			excerpt.html('').text('No profile yet');
		} else {
			for ( var index = 0; index < priority.length; ++index ) {
		    if (check_array(priority[index])) {
		    	excerpt.find('.sr_message').remove();
		    	var container = excerpt.find('#essay_' + priority[index]);
		    	container.siblings().each(function() {
		    		$(this).remove();
		    	});
		    	truncate_excerpt(container);
		    	break;
		    } 
			}
		}

		function check_array(iteration) {
			var content = 'essay_' + iteration;
			if ($.inArray(content, available_excerpts) !== -1) {
				return true;
			} else {
				return false;
			}
		}
	}

	function truncate_excerpt(container) {
		container.dotdotdot({
			ellipsis	: '... ',
	 		wrap		: 'word',
	 		fallbackToLetter: true,
	 		after		: null,
			watch		: false,
			height		: 100,
			tolerance	: 0,
			callback	: function( isTruncated, orgContent ) {},
	 		lastCharacter	: {
	 			remove		: [ ' ', ',', ';', '.', '!', '?' ],
	 			noEllipsis	: []
			}
		});
	}
}

/*** Profile View Specific Functions ***/
function style_buttons_with_icons() {
	fix_online_indicator();

	// A-List Button
	var alist = $('li#user_menu_upgrade').length === 0;
	if (!alist) {
		$('#actions').addClass('no_alist');
	} else {
		$('.action_options').find('#upgrade_form').find('p.btn').addClass('alist').attr('title', 'Buy them A-List');
	}

	// Other Buttons
	$('.action_options').find('#hide_btn').attr('title', 'Hide this user');
	$('.action_options').find('#unhide_btn').attr('title', 'Unhide this user');
	$('.action_options').find('#flag_btn').attr('title', 'Report');

	// Add Note
	var onclick = "Profile.loadWindow('edit_notes', 244); return false;"
	$('.action_options').prepend('<p class="btn small white notes"><a onclick="' + onclick + '">Add Note</a></p>');
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

function expand_favorite_options(favorites_array) {
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

function add_recent_questions_option() {
	// Add the Recently Answered option.
	var container = $('.right ul.bottom_pad');
	var link = container.find('li a').attr('href').replace('/profile/', '');
	var name_array = link.split('/');
	var username = name_array[0];
	$('.right ul.bottom_pad').append('<li class="recently_added"><a href="/profile/' + username + '/questions?recent=1">Recently answered</a></li>')	

	// If we're on that page, highlight it. 
	var url = window.location.href;
	if (url.indexOf("recent") > 0) {
		$('.recently_added').addClass('active');
	}
}

/*** Who You Like ***/
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

/*** Favorites List Functions ***/
function add_name_to_list(name, list, favorites_array) {
	name = name.replace('usr-', '');

	// If the name is unique, add it to the array for this particular list, and then save the list.
	$.each(favorites_array, function(index, value) {
		if (JSON.parse(value.list_name) === list) {
			if ($.inArray(name, value.users) < 0) {
				value.users.push(name);
				save_favorites(favorites_array);
			}
		}
	});
}

function remove_name_from_list(name, list, favorites_array) {
	name = name.replace('usr-', '');

	// Remove the name from this particular list and then save the list.
	$.each(favorites_array, function(index, value) {
		if (JSON.parse(value.list_name) === list) {
			if ($.inArray(name, value.users) > -1) {
				var index_for_removal = value.users.indexOf(name);
				value.users.splice(index_for_removal, 1);
				save_favorites(favorites_array);
			}
		}
	});
}

function remove_favorite_pagination(favorites_array) {
	var last_page = $('.pages.clearfix');
	var pages = last_page.find('a.last').text();
	var pages_array = [];
	var defer_array = [];
	// Put all the pages into an array.
	// Also note that each page will have a defer. More on that later.
	for (var i = 2; i <= pages; i++) {
	  pages_array.push(i);
	 	defer_array.push(new $.Deferred());
	}

	// Append our new container, and remove the pagination.
	last_page.before('<div class="additional_pages"></div>');
	last_page.remove();

	var i = 0;
	$.each(pages_array, function(index, value) {
		// Calculate the lowest numbered favorite.
		var starting_results = ((value - 1) * 25) + 1;
		$('.additional_pages').append('<div class="page_' + value + '"></div>');
		var page_container = $('.page_' + value);
		var url = 'http://www.okcupid.com/favorites?low=' + starting_results + ' #main_column';
		// Load in the content.
		page_container.load(url, function(response) {
			page_container.find('.pages.clearfix').remove();
			// Resolve the defer.
			defer_array[i].resolve();
			i++;
		});
	});

	// When all the defers are resolved, run the functions that affect each 
	// of the individual profile containers. 
	$.when.apply(null, defer_array).done(function() { 
		initialize_favorites_lists(favorites_array);
		add_private_notes();
	});
}

function initialize_favorites_lists(favorites_array) {
	show_all_favorites();
	unbind_list_events();
	create_sidebar_html();

	create_favorites_hover(favorites_array);

	bind_favorite_list_sortable();
	bind_favorite_list_toggle();
	bind_list_actions();

	make_lists_follow();
	$(window).scroll(make_lists_follow);
	$(window).scroll(check_scroll_top);

	create_scroll_top();

	function bind_favorite_list_sortable() {
		$(".favorites.sortable").sortable({
			helper: "clone",
			placeholder: "ui-state-highlight",
			cancel: ".disable-sort",
			update: function(ev, ui) {
				reorder_favorites(ui);
			}
		});
		$(".favorites.sortable").disableSelection();

		function reorder_favorites(ui) {
			var moved_list_name = $(ui.item).find('.list_name').text();
			moved_list_name = JSON.stringify(moved_list_name)
			var list_array = [];

			$('.favorites.sortable .list_name').each(function() {
				list_array.push(JSON.stringify($(this).text()));
			});

			var old_position;
			var new_position = $.inArray(moved_list_name, list_array);

			$.each(favorites_array, function(index, value) {
				if (moved_list_name === value.list_name) {
					old_position = index;
				}
			});

			arraymove(favorites_array, old_position, new_position);
			save_favorites(favorites_array);
			bind_favorite_list_toggle();
			bind_list_actions();
		}
	}

	function create_sidebar_html() {
		// Replace "About Favorites" text
		$('#right_bar').find('.body').html('<h2>About Favorites</h2><p>Use Favorites Lists to save people you like on OkCupid. These lists are private.</p>');

		// Add container for Favorite Lists
		$('#right_bar').find('.side_favorites').remove();
		$('#right_bar').append('<div class="side_favorites"><h2>Favorites Lists</h2><div class="favorites_lists"><ul class="favorites"><li class="favorite_list_all current">All</li><li class="favorite_list_none">Ungrouped</li></ul><ul class="favorites sortable"></ul></div><h2>Add New List</h2><div class="add_list"><input type="text" id="new_favorite_list" name="favorites" size="30"><span class="save_list">Save List</span></div></div>');

		// Add each favorite list
		$.each(favorites_array, function(index, value) {
			var list = JSON.parse(value.list_name);
			$('ul.favorites.sortable').append('<li class="favorite_list"><span class="list_name">' + list + '</span><span class="remove_list" title="Delete list">Delete List</span><span class="edit_list" title="Edit list name">Edit List Name</span></li>');
		});
	}

	function unbind_list_events() {
		$('.save_list').unbind("click");
		$('ul.favorites li').unbind("click");
		$('.remove_list').unbind("click");
		$('#edit_favorite_list').unbind("click");
		$('.update_list').unbind("click");
	}

	function bind_list_actions() {
		bind_new_list_link();
		bind_delete_list_link();
		bind_edit_list_link();

		function bind_new_list_link() {
			$('input#new_favorite_list').keypress(function(e) {
	      if (e.keyCode == 13) {
	      	save_new_list();
	      }
	    });

			$('.save_list').click(function() {
				save_new_list();
			});

			function save_new_list() {
				var new_list_name = $('#new_favorite_list').val();
				var length = 20;

				if (new_list_name.length > length) {
					new_list_name = new_list_name.substring(0, length);
				}

				new_list_name = JSON.stringify(new_list_name);
				var new_list = {list_name: new_list_name, users: []}

				var unique = check_uniqueness(new_list_name);
				if (!unique) {
					display_uniqueness_error();
				} else {
					favorites_array.push(new_list);
					save_favorites(favorites_array);
					initialize_favorites_lists(favorites_array);
				}
			}
		}

		function bind_delete_list_link() {
			$('.remove_list').click(function() {
				var list = $(this).siblings('.list_name').text();
				var index_for_removal;

				$.each(favorites_array, function(index, value) {
					if (JSON.parse(value.list_name) === list) {
						index_for_removal = index;
					}
				});
				favorites_array.splice(index_for_removal, 1);
				save_favorites(favorites_array);
				initialize_favorites_lists(favorites_array);
			});
		}

		function bind_edit_list_link() {
			$('.edit_list').click(function(e) {
				// stopPropagation in here is to stop us from auto-focusing on the list.
				e.stopPropagation();

				// Disable sorting of lists while editing.
				$('.favorite_list').each(function() {
					$(this).addClass("disable-sort");
				});

				// If we are not already editing
				if ($('.edit_list_container').length === 0) {
					// Get the original name, as well as the list we are focused on.
					var original_name = $(this).siblings('.list_name').text();
					var current_focus = $('ul.favorites').find('.current').find('.list_name').text();

				  replace_with_input($(this), original_name);
				  bind_edit_clicks();
				}

				function replace_with_input(self, original_name) {
					self.addClass('hidden_helper');
					self.siblings('.list_name').addClass('hidden_helper');
					self.siblings('.remove_list').addClass('hidden_helper');

					self.parent().prepend('<div class="edit_list_container"><input type="text" id="edit_favorite_list" name="favorites" size="30" value="' + original_name + '"><span class="update_list" title="Update list name">Update</span></div>');
				}

				function bind_edit_clicks() {
					$('#edit_favorite_list').click(function(e) {
						e.stopPropagation();
					})

					$('#edit_favorite_list').keypress(function(e) {
				    if (e.keyCode == 13) {
				    	e.stopPropagation();
				    	update_list();
				    }
				  });

				  $('.update_list').click(function(e) {
				  	e.stopPropagation();
				  	update_list();
				  });
				}

				function update_list() {
					var new_name = $('#edit_favorite_list').val();
					var length = 20;

					if (new_name.length > length) {
						new_name = new_name.substring(0, length);
					}

					// Resume sorting.
					$('.favorite_list').each(function() {
						$(this).removeClass("disable-sort");
					});

					// If there are changes.
					if (original_name !== new_name) {
						var unique = check_uniqueness(new_name);
						
						if (!unique) {
							// Display an error if not unique.
						 	display_uniqueness_error();
						} else {
							// Otherwise, update it in the array.
							$.each(favorites_array, function(index, value) {
								if (JSON.parse(value.list_name) === original_name) {
									value.list_name = JSON.stringify(new_name);
								}
							});
							refresh_list(new_name);
						}
					} else {
						refresh_list(new_name);
					}
				}

				function refresh_list(new_name) {
					save_favorites(favorites_array);
					initialize_favorites_lists(favorites_array);
					// Stay on current list when we reinitialize the lists.
					if (!current_focus) {
						show_all_favorites();
						remove_current();
						$('.favorite_list_all').addClass('current');
					} else if (current_focus) {
						if (current_focus !== new_name) {
							show_selected_list(new_name, favorites_array);
							remove_current();
							$('li.favorite_list:contains(new_name)').addClass('current');
						} else {
							show_selected_list(current_focus, favorites_array);
							remove_current();
							$('li.favorite_list:contains(current_focus)').addClass('current');
						}
					}
				}
			});
		}

		function check_uniqueness(checked_name) {
			var unique = true;

			$.each(favorites_array, function(index, value) {
				if (JSON.parse(value.list_name) === checked_name) {
					unique = false;
				} 
			});

			return unique;
		}

		function display_uniqueness_error() {
			$('.favorites_lists').append('<div class="oknotice_error unique">List name must be unique.</div>');
			setTimeout(function() {
      $('.favorites_lists').find('.oknotice_error.unique').remove();
			}, 5000);
		}
	}

	function bind_favorite_list_toggle() {
		$('ul.favorites li').click(function() {
			// Hide the favorite list hover just in case.
			$('.monolith').find('.favorites_list.favorites_page').addClass('hidden_helper');
			
			// Swap the "current" class.
			remove_current();
			$(this).addClass('current');
			
			if ($(this).hasClass('favorite_list_all')) {
				show_all_favorites();
			} else if ($(this).hasClass('favorite_list_none')) {
				show_ungrouped_favorites(favorites_array);
			} else {
				var list = $(this).find('.list_name').text();
				show_selected_list(list, favorites_array);
			}
		});
	}

	function remove_current() {
		$('li.favorite_list_all').removeClass('current');
		$('li.favorite_list_none').removeClass('current');
		$('li.favorite_list').each(function() {
			$(this).removeClass('current');
		});
	}

	function make_lists_follow() {
		var lists_container = $('.side_favorites'); 
		// Offset between the favorites list and top of the page.
		// Change this to be calculated in a way that the changing offset
		// won't change the variable.
		var offset = 315;		
  	if ($(window).scrollTop() > offset) {
   		lists_container.css({'position': 'fixed', 'top': '10px'}); 
  	} else {
    	lists_container.css({'position': 'relative', 'top': 'auto'});
		}
	}

	function create_scroll_top() {
		$('.monolith').append('<a id="back_to_top" class="opensans fixed show hidden_helper" href="#"><span class="icon">Back to top</span></a>');
	}

	function check_scroll_top() {
		var offset = 200;
		if ($(window).scrollTop() > offset) {
			$('#back_to_top').removeClass('hidden_helper');
		} else {
			$('#back_to_top').addClass('hidden_helper');
		}
	}
}

function create_favorites_hover(favorites_array) {
	// Add one hover container for adding someone to multiple lists.
	$('.monolith').find('.favorites_list.favorites_page').remove();
	$('.monolith').append('<div class="favorites_list favorites_page hidden_helper"><span class="title">Add to List</span><ul class="favorites_hover"></ul></div>');

	var favorites_container = $('.favorites_list.favorites_page');

	// Populate the hover container with the lists.
	$.each(favorites_array, function(index, value) {
		var list = JSON.parse(value.list_name).replace(/"/g, '&quot;');
		$('ul.favorites_hover').append('<li class="list"><input type="checkbox" name="favorites" value="' + list + '"><span>' + list + '</span></li>');
	});

	if ($('ul.favorites_hover').find('li').length === 0) {
		$('ul.favorites_hover').append('<li>You have no custom lists.</li>');
	}

	set_favorite_mouseover();

	$('.action_favorite').click(function() {
		set_favorite_mouseover();
		if ($(this).hasClass('action_favorited')) {
			favorites_container.addClass('hidden_helper');
		}
	});

	function set_favorite_mouseover() {
		$('.action_favorite').unbind('mouseover');
		// Add the mouseover to display the favorite list hover.
		$('.action_favorite').mouseover(function() {
			if ($(this).hasClass('action_favorited')) {
				var username = $(this).attr('id');
				username = username.replace('action-box-', '').replace('-fav', '');
				var padding = 124;
				var offset = $(this).offset().top - padding;
				favorites_container.css('top', offset).removeClass('hidden_helper');
				reset_list_checks(username, favorites_array);
			}
		});

		favorites_container.mouseleave(function() {
			favorites_container.addClass('hidden_helper');
		});
	}

	function reset_list_checks(username, favorites_array) {
		unbind_list_toggle();
		var checked;

		$.each(favorites_array, function(index, value) {
			checked = ($.inArray(username, value.users) > -1);
			var parsed_name = JSON.parse(value.list_name);
			$('.list:contains("' + parsed_name + '")').find('input').prop('checked', checked);
		});

		bind_list_toggle(username)

		function bind_list_toggle(profile_name) {
			$('ul.favorites_hover').find('input').change(function() {
				var checked = this.checked;
				var this_list = $(this).val();

				if (checked) {
					add_name_to_list(profile_name, this_list, favorites_array);
				} else {
					remove_name_from_list(profile_name, this_list, favorites_array);
				}
			});
		}

		function unbind_list_toggle() {
			$('ul.favorites_hover').find('input').unbind('change');
		}
	}
}

function save_favorites(favorites_array) {
  chrome.storage.sync.set({"favorites": favorites_array});
}

// Specific Favorite List Functions
function show_all_favorites() {
	// Show every  user on the favorites list.
	$('.user_row_item').each(function() {
		$(this).removeClass('hidden_helper');
	});

	// Hide the link to remove from this list
	$('.user_row_item').each(function() {
		$(this).find('.action_remove_list').addClass('hidden_helper');
	});
}

function show_ungrouped_favorites(favorites_array) {
	// Get all the names that are on lists
	var listed_names = [];
	$.each(favorites_array, function(index, value) {
		listed_names.push(value.users);
	});

	// Show all the users.
	show_all_favorites();

	// Hide the users that are on lists.
	$.each(listed_names, function(index, value) {
		$.each(value, function(index, value) {
			$('#usr-' + value).addClass('hidden_helper');
		});		
	});	

	// Hide the link to remove from this list
	$('.user_row_item').each(function() {
		$(this).find('.action_remove_list').addClass('hidden_helper');
	});
}

function show_selected_list(searched_list, favorites_array) {
	// Hide all the users.
	$('.user_row_item').each(function() {
		$(this).addClass('hidden_helper');
	});

	// Get all the users on this list	
	var names = [];
	$.each(favorites_array, function(index, value) {
		if (JSON.parse(value.list_name) === searched_list) {
			names = value.users;
		}
	});

	// Unhide these users
	$.each(names, function(index, value) {
		$('#usr-' + value).removeClass('hidden_helper');
	});	

	// Show the "Remove from List" button
	$('.user_row_item').not('.hidden_helper').each(function() {
		$(this).find('.action_remove_list').removeClass('hidden_helper');
	});
}

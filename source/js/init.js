add_body_class();

chrome.runtime.sendMessage({retrieve: "settings"}, function(response) {
	add_body_class();

	// Store our settings in variables.
	var matches_mode = response.mode;
	var excerpt_priority = response.priority;

	// If we're on a user's page.
  if (get_location() === "profile") {
  	var favorites_array = [];
		chrome.storage.local.get(null, function(obj) {
			if (!$.isEmptyObject(obj)) {
				favorites_array = obj.favorites;
				expand_favorite_options(favorites_array);
			}

			style_buttons_with_icons();
		});
  } else if (get_location() === "matches") {
  	// I really don't like this, but haven't found a better way to pass these settings yet.
  	update_tiles();

		// When more users are added to the page, call the function.
		var observer = new MutationSummary({
		  callback: update_tiles,
		  queries: [{ element: '.match_card_wrapper' }]
		});

		if (matches_mode === "classic") {
	  	if (excerpt_priority) {
	  		$('body').append('<input type="hidden" id="excerpt_priority" value="' + excerpt_priority + '">')
	  	}

			add_excerpt_div();

			var observer = new MutationSummary({
			  callback: add_excerpt_div,
			  queries: [{ element: '.match_card_wrapper' }]
			});
		} 
  } else if (get_location() === "favorites") {
  	var favorites_array = [];
		chrome.storage.local.get(null, function(obj) {
			if (!$.isEmptyObject(obj)) {
				favorites_array = obj.favorites;
			}

			get_all_favorites(favorites_array);
		});
  }
});

/*** General Functions ***/
function add_body_class() {
	$('body').addClass("pretty_okc");
}

function get_location() {
	var url = window.location.href;

	if (url.indexOf("profile") > 0) {
		return "profile";
	} else if (url.indexOf("match") > 0) {
		return "matches";
	} else if (url.indexOf("favorites") > 0) {
		return "favorites";
	}
}


/*** Profile View Specific Functions ***/
function style_buttons_with_icons() {
	$('.action_options').find('#upgrade_form').find('p.btn').addClass('alist').attr('title', 'Buy them A-List');
	$('.action_options').find('#hide_btn').attr('title', 'Hide this user');
	$('.action_options').find('#unhide_btn').attr('title', 'Unhide this user');
	$('.action_options').find('.flag').attr('title', 'Report');

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
}

function expand_favorite_options(favorites_array) {
	$('.action_options').find('.btn.small.white').not('.small_white').not('.hideflag').first().addClass("favorite");
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
			var list = value.list_name;

			if (checked) {
				$('ul.favorites').append('<li><input type="checkbox" name="favorites" value="' + list + '" checked><span>' + list + '</span></li>');
			} else {
				$('ul.favorites').append('<li><input type="checkbox" name="favorites" value="' + list + '"><span>' + list + '</span></li>');
			}
		});
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

/*** Tiles View Specific Functions ***/
function update_tiles() {
	change_tile_text();
	add_star_ratings();
}

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
		} else if (rating_width > 70 && rating_width < 100) {
			return "partial_rating";
		} else if (rating_width > 100) {
			return "full_rating";
		}
	}

	function apply_star_ratings(self, stars) {
		var action_rating = self.find('.star_rating').length === 0;
		if (action_rating) {
			self.find('.match_card_text').append('<div class="star_rating ' + stars + '"></div>');
		} else {
			self.find('.star_rating').removeClass('no_rating').removeClass('partial_rating').removeClass('full_rating').addClass(stars);
		}
	}
}

/*** Classic View Specific Functions ***/
function add_excerpt_div() {
	$('.match_card_wrapper').each(function() {
		var self = $(this);
		if (self.find('.pretty_okc_profile_excerpt').length < 1) {
			self.find(".match_card_text").after('<div class="pretty_okc_profile_excerpt"></div>');
			var username = self.attr('id').replace('usr-', '').replace('-wrapper', '');
			get_excerpt_by_priority(username, 'first');
		} 
	});
}

function get_excerpt_by_priority(username, essay_number) {
	var priority = $('#excerpt_priority').val();
	priority = priority.split(',');

	if (essay_number === 'first') {
		get_profile_excerpt(username, priority[0]);
	} else {
		get_profile_excerpt(username, priority[essay_number]);
	}
}

function get_profile_excerpt(username, essay_section) {
	var full_url = 'http://www.okcupid.com/profile/' + username;
	var excerpt = $('#usr-' + username + '-wrapper').find('.pretty_okc_profile_excerpt');
	var essay_container = "#essay_" + essay_section

	excerpt.load(full_url + " " + essay_container, function(response) {
	var check = excerpt.find('.essay.content').attr('id');
		if (check === "essay_" + essay_section) {
			// If we found that the content loaded correctly, truncate what we got.
			truncate_excerpt(excerpt);
		} else {
			// Otherwise, get the next level priority and try again.
			essay_section = parseInt(essay_section)
			get_excerpt_by_priority(username, essay_section+1)
		}
	});
}

function truncate_excerpt(container) {
	container.dotdotdot({
		ellipsis	: '... ',
 		wrap		: 'word',
 		fallbackToLetter: true,
 		after		: null,
		watch		: false,
		height		: null,
		tolerance	: 0,
		callback	: function( isTruncated, orgContent ) {},
 		lastCharacter	: {
 			remove		: [ ' ', ',', ';', '.', '!', '?' ],
 			noEllipsis	: []
		}
	});
}

/*** Favorites List Functions ***/
function add_name_to_list(name, list, favorites_array) {
	name = name.replace('usr-', '');

	// If the name is unique, add it to the array for this particular list, and then save the list.
	$.each(favorites_array, function(index, value) {
		if (value.list_name === list) {
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
		if (value.list_name === list) {
			if ($.inArray(name, value.users) > -1) {
				var index_for_removal = value.users.indexOf(name);
				value.users.splice(index_for_removal, 1);
				save_favorites(favorites_array);
			}
		}
	});
}

function initialize_favorites_lists(favorites_array) {
	show_all_favorites();
	unbind_list_events();
	create_sidebar_html();
	create_favorites_hover();
	bind_favorite_list_toggle();
	bind_list_actions();
	make_lists_follow();
	$(window).scroll(make_lists_follow);
	$(window).scroll(check_scroll_top);

	create_scroll_top();

	function create_sidebar_html() {
		// Replace "About Favorites" text
		$('#right_bar').find('.body').html('<h2>About Favorites</h2><p>Use Favorites Lists to save people you like on OkCupid. These lists are private.</p>');

		// Add container for Favorite Lists
		$('#right_bar').find('.side_favorites').remove();
		$('#right_bar').append('<div class="side_favorites"><h2>Favorites Lists</h2><div class="favorites_lists"><ul class="favorites"><li class="favorite_list_all current">All</li><li class="favorite_list_none">Ungrouped</li></ul></div><h2>Add New List</h2><div class="add_list"><input type="text" id="new_favorite_list" name="favorites" size="30"><span class="save_list">Save List</span></div></div>');

		// Add each favorite list
		$.each(favorites_array, function(index, value) {
			$('ul.favorites').append('<li class="favorite_list ' + value.list_name + '"><span class="list_name">' + value.list_name + '</span><span class="remove_list" title="Delete list">Delete List</span><span class="edit_list" title="Edit list name">Edit List Name</span></li>');
		});
	}

	function create_favorites_hover() {
		// Add one hover container for adding someone to multiple lists.
		$('.monolith').find('.favorites_list.favorites_page').remove();
		$('.monolith').append('<div class="favorites_list favorites_page hidden_helper"><span class="title">Add to List</span><ul class="favorites_hover"></ul></div>');

		var favorites_container = $('.favorites_list.favorites_page');

		// Populate the hover container with the lists.
		$.each(favorites_array, function(index, value) {
			var list = value.list_name;
			$('ul.favorites_hover').append('<li class="list_' + list + '"><input type="checkbox" name="favorites" value="' + list + '"><span>' + list + '</span></li>');
		});

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
					reset_list_checks(username);
				}
			});

			favorites_container.mouseleave(function() {
				favorites_container.addClass('hidden_helper');
			});
		}
	}

	function reset_list_checks(username) {
		unbind_list_toggle();

		$.each(favorites_array, function(index, value) {
			var checked = ($.inArray(username, value.users) > 0);
			var list = value.list_name;

			if (checked) {
				$('.list_' + list).find('input').prop('checked', true);
			} else {
				$('.list_' + list).find('input').prop('checked', false);
			}		
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
					if (value.list_name === list) {
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

					// If there are changes.
					if (original_name !== new_name) {
						var unique = check_uniqueness(new_name);
						
						if (!unique) {
							// Display an error if not unique.
						 	display_uniqueness_error();
						} else {
							// Otherwise, update it in the array.
							$.each(favorites_array, function(index, value) {
								if (value.list_name === original_name) {
									value.list_name = new_name;
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
							$('.favorite_list.' + new_name).addClass('current');
						} else {
							show_selected_list(current_focus, favorites_array);
							remove_current();
							$('.favorite_list.' + current_focus).addClass('current');
						}
					}
				}
			});
		}

		function check_uniqueness(checked_name) {
			var unique = true;

			$.each(favorites_array, function(index, value) {
				if (value.list_name === checked_name) {
					unique = false;
				} 
			});

			return unique;
		}

		function display_uniqueness_error() {
			console.log("List name must be unique");
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
		if (value.list_name === searched_list) {
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

function save_favorites(favorites_array) {
	chrome.storage.local.set({favorites: favorites_array}, function() {
	 	console.log("Storage Succesful");
  });
}

function get_all_favorites(favorites_array) {
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
		add_private_notes_to_favorites();
	});

	function add_private_notes_to_favorites() {
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

}
add_body_class();

chrome.runtime.sendMessage({retrieve: "settings"}, function(response) {
	add_body_class();

	// Store our settings in variables.
	var matches_mode = response.mode;
	var excerpt_priority = response.priority;
	var add_notes = response.notes;

	// If we're on a user's page.
  if (get_location() === "profile") {
  	if (add_notes === 'true') {
  		style_buttons_with_icons();
  	} 
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

			adjust_favorites_list(favorites_array);
			populate_favorites_lists(favorites_array);
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
	$('.action_options').find('.btn.small.white').not('.small_white').not('.hideflag').first().addClass("favorite");

	var favorites_button = $('.action_options').find('.btn.favorite').find('a');

	check_favorite_status_default();
	favorites_button.click(function() {
		check_favorite_status();
	})

	function check_favorite_status_default() {
		if (favorites_button.text() === "Remove Favorite") {
			favorites_button.addClass("is_favorite");
			favorites_button.attr('title', 'Remove from Favorites');
		} else {
			favorites_button.removeClass("is_favorite");
			favorites_button.attr('title', 'Add to Favorites');
		}
	}

	function check_favorite_status() {
		if (favorites_button.hasClass('is_favorite')) {
			favorites_button.removeClass("is_favorite");
			favorites_button.attr('title', 'Add to Favorites');
		} else {
			favorites_button.addClass("is_favorite");
			favorites_button.attr('title', 'Remove from Favorites');
		}
	}

	// Add Note
	var onclick = "Profile.loadWindow('edit_notes', 244); return false;"
	$('.action_options').prepend('<p class="btn small white notes"><a onclick="' + onclick + '">Add Note</a></p>');
	var notes_button = $('.action_options').find('.btn.notes').find('a');

	check_notes_status();
	$('#edit_notes_form').find('#save_a').click(function() {
		check_notes_status();
	});

	function check_notes_status() {
		if ($('#inline_notes').is(':visible')) {
			notes_button.addClass('has_note');
			notes_button.attr('title', 'Add Note');
		} else {
			notes_button.removeClass('has_note');
			notes_button.attr('title', 'Edit Note');
		}
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
		var stars = "";
		var rating_width = self.find('.current-rating').css('width').replace("px", "");
		rating_width = parseInt(rating_width);
		
		if (rating_width === 0) {
			stars = "no_rating";
		} else if (rating_width > 70 && rating_width < 100) {
			stars = "partial_rating";
		} else if (rating_width > 100) {
			stars = "full_rating";
		}

		var action_rating = self.find('.star_rating').length === 0;
		if (action_rating) {
			self.find('.match_card_text').append('<div class="star_rating ' + stars + '"></div>');
		}		
	});
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

function adjust_favorites_list(favorites_array) {
	add_remove_from_list_button();
	add_private_notes_to_favorites();

	function add_remove_from_list_button() {
		// For each user, it adds a link to remove them from this particular list.
		$('.user_row_item').each(function() {
			$(this).find('.action_rate').before('<span class="favorites_action action_remove_list" title="Remove from list">remove from list</span>');
		});

		// Which when clicked, toggles either adding them or removing them from the list.
		$('.action_remove_list').click(function() {
			var name = $(this).parent('.user_row_item').attr('id');
			var list = $('li.favorite_list.current').find('.list_name').text()

			if ($(this).hasClass("removed")) {
				$(this).removeClass("removed");
				$(this).attr('title', "Remove from list");
				add_name_to_list(name, list, favorites_array);
			} else {
				$(this).addClass("removed");
				$(this).attr('title', "Add to list");
				remove_name_from_list(name, list, favorites_array);
			}
		});
	}

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

function populate_favorites_lists(favorites_array) {
	// Replace "About Favorites" text
	$('#right_bar').find('.body').html('<h2>About Favorites</h2><p>Use Favorites Lists to save people you like on OkCupid. These lists are private. You can click and drag people to add them to different lists.</p>');

	// Add container for Favorite Lists
	$('#right_bar').find('.side_favorites').remove();
	$('#right_bar').append('<div class="side_favorites"><h2>Favorites Lists</h2><div class="favorites_lists"><ul class="favorites"><li class="favorite_list_all current">All</li><li class="favorite_list_none">Ungrouped</li></ul></div><h2>Add New List</h2><div class="add_list"><input type="text" id="new_favorite_list" name="favorites" size="34"><span class="save_list">Save List</span></div></div>');

	// Add each favorite list
	$.each(favorites_array, function(index, value) {
		$('ul.favorites').append('<li class="favorite_list"><span class="list_name">' + value.list_name + '</span><span class="remove_list" title="Delete list">Delete List</span><span class="edit_list" title="Edit list">Edit List</span></li>');
	});

	show_all_favorites();
	unbind_list_events();
	bind_favorite_list_toggle();
	bind_delete_list_link();
	bind_edit_list_link();
	bind_new_list_link();
	bind_drag_and_drop();

	function unbind_list_events() {
		$('.save_list').unbind("click");
		$('li.favorite_list').unbind("click");
		$('li.favorite_list_none').unbind("click");
		$('li.favorite_list_all').unbind("click");
		$('.remove_list').unbind("click");
		$('.user_row_item').unbind("draggable");
		$('li.favorite_list').unbind("droppable");
	}

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

			favorites_array.push(new_list);
			save_favorites(favorites_array);
			populate_favorites_lists(favorites_array);
		}
	}

	function bind_favorite_list_toggle() {
		$('li.favorite_list').click(function() {
			remove_current();
			$(this).addClass('current');

			var list = $(this).find('.list_name').text();
			show_selected_list(list, favorites_array);
		});

		$('li.favorite_list_none').click(function() {
			remove_current();
			$(this).addClass('current');

			show_ungrouped_favorites(favorites_array);
		});

		$('li.favorite_list_all').click(function() {
			remove_current();
			$(this).addClass('current');

			show_all_favorites();
		});

		function remove_current() {
			$('li.favorite_list_all').removeClass('current');
			$('li.favorite_list_none').removeClass('current');
			$('li.favorite_list').each(function() {
				$(this).removeClass('current');
			});
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
			populate_favorites_lists(favorites_array);
		});
	}

	function bind_edit_list_link() {
		$('.edit_list').click(function(e) {
			e.stopPropagation();
			$(this).addClass('hidden_helper');
			var original_list = $(this).siblings('.list_name').text();
			var index_to_change;

			$(this).siblings('.list_name').addClass('hidden_helper');
			$(this).parent().prepend('<span class="edit_list_container"><input type="text" id="edit_favorite_list" name="favorites" size="10"><span class="update_list">Save</span><span class="cancel_list">Cancel</span></span>');

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

		  $('.cancel_list').click(function(e) {
		  	e.stopPropagation();
		  	$(this).parent().siblings('.list_name').text(original_list).removeClass('hidden_helper');
		  	$(this).parent().siblings('.list_name').siblings('.edit_list_container').remove();
		  	$('.edit_list').removeClass('hidden_helper');
		  });

		  function update_list() {
				var new_name = $('#edit_favorite_list').val();
				$.each(favorites_array, function(index, value) {
					if (value.list_name === original_list) {
						value.list_name = new_name;
					}
				});
				$(this).parent('.list_name').siblings('.edit_list_container').remove();
				$(this).parent('.list_name').text(new_name).removeClass('hidden_helper');
				save_favorites(favorites_array);
				populate_favorites_lists(favorites_array);
				$('.edit_list').removeClass('hidden_helper');
		  }
		});


	}

	function bind_drag_and_drop() {
		$('.user_row_item').draggable({ 
			revert: 'invalid',
			helper: 'clone',
			drag: function(event, ui) {
				$(ui.helper).css('opacity', '0.5');

			},
			stop: function(event, ui) {
				$(ui.helper).css('opacity', '1.0');
			}
	  });

		$('li.favorite_list').droppable({ 
			hoverClass: "droppable_hover",
			accept: ".user_row_item",
			drop: function(event, ui) {
				var list = $(this).find('.list_name').text();
				var name = $(ui.draggable).attr('id');
				add_name_to_list(name, list, favorites_array);
	    }
		});
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

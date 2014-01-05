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
  		add_private_notes();
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

  	var favorites_array = [{ list_name: "Unordered", users: []}, { list_name: "All", users: []}];

		chrome.storage.local.get(null, function(obj) {
			if (!$.isEmptyObject(obj)) {
				favorites_array = obj.favorites;
			}

			console.log(favorites_array)

			//var character = {game: campaign, charname: character_name, charinfo: div, chartype: link_type};

			populate_favorites_lists(favorites_array);

			$('.save_list').click(function() {
				var new_list_name = $('#new_favorite_list').val();

				var new_list = {list_name: new_list_name, users: []}

				favorites_array.push(new_list);
				save_favorites(favorites_array);
			});

			$('.user_row_item').append('<div class="add_to_list">Add to Test</div>');

			$('.add_to_list').click(function() {
				
			});


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
					var list = $(this).text()
					var name = $(ui.draggable).attr('id')
					add_to_list(name, list, favorites_array)
        }
			});


			$('.update_favorites').click(function() {
				save_favorites(favorites_array);
			});

			$('.clear_lists').click(function() {
				chrome.storage.local.clear();
			})

		});
  }
});

function add_to_list(name, list, favorites_array) {
	name = name.replace('usr-', '');

	$.each(favorites_array, function(index, value) {
		if (value.list_name === list) {
			value.users.push(name);
			save_favorites(favorites_array)
		}
		console.log(value.list_name)
	})

	console.log(favorites_array)

}

function save_favorites(favorites_array) {
	chrome.storage.local.set({favorites: favorites_array}, function() {
	 	console.log("Storage Succesful");
  });
}

function populate_favorites_lists(favorites_array) {
	$('#right_bar').find('.body').html('<h2>About Favorites</h2><p>Use Favorites Lists to save people you like on OkCupid. These lists are private.</p>');

	$('#right_bar').append('<div class="side_favorites"><h2>Favorites Lists</h2><div class="favorites_lists"><ul class="favorites"></ul></div><div class="add_list">New List: <input type="text" id="new_favorite_list" name="favorites"><span class="save_list">Save List</span></div><div class="clear_lists">Clear lists</div></div>')

	$.each(favorites_array, function(index, value) {
		if (value.list_name === "All") {
			$('ul.favorites').append('<li class="favorite_list_all current">' + value.list_name + '</li>');
		} else {
			$('ul.favorites').append('<li class="favorite_list">' + value.list_name + '</li>');
		}		
	});

	$('li.favorite_list').click(function() {
		remove_current();
		$(this).addClass('current');

		var list = $(this).text();
		show_list(list, favorites_array);
	});

	$('li.favorite_list_all').click(function() {
		remove_current();
		$(this).addClass('current');

		show_all_favorites();
	});


}

function show_all_favorites() {
	$('.user_row_item').each(function() {
		$(this).removeClass('hidden_helper');
	});
}

function remove_current() {
	$('li.favorite_list_all').removeClass('current');
	$('li.favorite_list').each(function() {
		$(this).removeClass('current');
	});
}

function show_list(searched_list, favorites_array) {
	var names = []
	
	$.each(favorites_array, function(index, value) {
		if (value.list_name === searched_list) {
			names = value.users;
		}
	});

	$('.user_row_item').each(function() {
		$(this).addClass('hidden_helper');
	});

	$.each(names, function(index, value) {
		$('#usr-' + value).removeClass('hidden_helper');
	});	
}







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

function add_body_class() {
	$('body').addClass("pretty_okc");
}

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

function add_private_notes() {
	var onclick = "Profile.loadWindow('edit_notes', 244); return false;"
	$('.action_options').prepend('<p class="btn small white"><a onclick="' + onclick + '">Add Note</a></p>');
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
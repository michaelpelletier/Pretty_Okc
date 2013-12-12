$('body').addClass("pretty_okc");

chrome.runtime.sendMessage({retrieve: "settings"}, function(response) {
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
  	if (excerpt_priority) {
  		$('body').append('<input type="hidden" id="excerpt_priority" value="' + excerpt_priority + '">')
  	}

  	change_tile_text();

		// When more users are added to the page, call the function.
		var observer = new MutationSummary({
		  callback: change_tile_text,
		  queries: [{ element: '.match_card_wrapper' }]
		});

		if (matches_mode === "classic") {
			add_excerpt_div();

			var observer = new MutationSummary({
			  callback: add_excerpt_div,
			  queries: [{ element: '.match_card_wrapper' }]
			});
		} 
  }

});

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

function add_excerpt_div() {
	$('.match_card_wrapper').each(function() {
		var self = $(this);
		if (self.find('.pretty_okc_profile_excerpt').length < 1) {
			self.find(".match_card_text").after('<div class="pretty_okc_profile_excerpt"></div>');
			var username = self.attr('id').replace('usr-', '').replace('-wrapper', '');
			get_excerpt_by_priority(username);
		} 
	});
}

function get_excerpt_by_priority(username) {
	var excerpt = $('#usr-' + username + '-wrapper').find('.pretty_okc_profile_excerpt');

	var priority = $('#excerpt_priority').val();
	priority = priority.split(',');
	get_profile_excerpt(username, priority[0]);
}

function get_profile_excerpt(username, essay_section) {
	var full_url = 'http://www.okcupid.com/profile/' + username;
	var excerpt = $('#usr-' + username + '-wrapper').find('.pretty_okc_profile_excerpt');

	excerpt.load(full_url + " #" + essay_section, function() {
		console.log("Excerpt Loaded");
		// Truncate the ending with ... just to make it pretty.
		excerpt.dotdotdot({
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
	});
}

function add_private_notes() {
	var onclick = "Profile.loadWindow('edit_notes', 244); return false;"
	$('.action_options').prepend('<p class="btn small white"><a onclick="' + onclick + '">Add Note</a></p>');
}

function get_location() {
	var url = window.location.href;

	if (url.indexOf("profile") > 0) {
		return "profile"
	} else if (url.indexOf("match") > 0) {
		return "matches"
	}
}
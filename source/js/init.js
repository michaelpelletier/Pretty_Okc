$('body').addClass("pretty_okc");

chrome.runtime.sendMessage({retrieve: "settings"}, function(response) {
	var settings = response.settings;

	change_tile_text();

	// When more users are added to the page, call the function.
	var observer = new MutationSummary({
	  callback: change_tile_text,
	  queries: [{ element: '.match_card_wrapper' }]
	});

	if (settings === "classic") {
		add_excerpt_div();

		var observer = new MutationSummary({
		  callback: add_excerpt_div,
		  queries: [{ element: '.match_card_wrapper' }]
		});
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
			get_profile_excerpt(username);
		} 
	});
}

function get_profile_excerpt(username) {
	var full_url = 'http://www.okcupid.com/profile/' + username;
	var excerpt = $('#usr-' + username + '-wrapper').find('.pretty_okc_profile_excerpt');

	excerpt.load(full_url + " #essay_0", function() {
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

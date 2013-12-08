$('body').addClass("pretty_okc");

chrome.runtime.sendMessage({retrieve: "settings"}, function(response) {
	var settings = response.settings;
	console.log(settings)

	if (settings === "tiles") {
		change_tile_text();

		// When more users are added to the page, call the function.
		var observer = new MutationSummary({
		  callback: change_tile_text,
		  queries: [{ element: '.match_card_wrapper' }]
		});
	}

});




change_tile_text = function() {
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

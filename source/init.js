$('body').addClass("pretty_okc");

handleChanges = function() {
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

handleChanges();

// When more users are added to the page, call the function.
var observer = new MutationSummary({
  callback: handleChanges,
  queries: [{ element: '.match_card_wrapper' }]
});

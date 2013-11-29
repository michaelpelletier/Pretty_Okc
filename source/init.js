$('body').addClass("pretty_okc");

handleChanges = function() {
	$('.match_card_wrapper').each(function() {
		// Remove "Match" from Match Percentage.
		var match = $(this).find('.percentages').text();
		match = match.split(' ');
		$(this).find('.percentages').text(match[0]);

		// Remove state abbreviation.
		var town = $(this).find('.userinfo').text();
		town = town.replace('·', ' · ').split(',');
		$(this).find('.userinfo').text(town[0]);	
	});
}

handleChanges();

// When more users are added to the page, call the function.
var observer = new MutationSummary({
  callback: handleChanges,
  queries: [{ element: '.match_card_wrapper' }]
});

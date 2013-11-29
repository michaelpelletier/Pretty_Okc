document.getElementsByTagName('body')[0].className += " pretty_okc";

handleChanges = function() {
	$('.match_card_wrapper').each(function() {
		var match = $(this).find('.percentages').text();
		match = match.split('%');
		$(this).find('.percentages').text(match[0]);

		var town = $(this).find('.userinfo').text();
		town = town.replace('·', ' · ').split(',');
		$(this).find('.userinfo').text(town[0]);

	});
}

handleChanges();

var observer = new MutationSummary({
  callback: handleChanges,
  queries: [{ element: '.match_card_wrapper' }]
});

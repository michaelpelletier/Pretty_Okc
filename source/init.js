$('body').addClass("pretty_okc");


fix_private_notes = function() {
	var onclick = "Profile.loadWindow('edit_notes', 244); return false;"
	$('.action_options').append('<p class="btn small white"><a onclick="' + onclick + '">Add Note</a></p>');
}

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
fix_private_notes();

// When more users are added to the page, call the function.
var observer = new MutationSummary({
  callback: handleChanges,
  queries: [{ element: '.match_card_wrapper' }]
});

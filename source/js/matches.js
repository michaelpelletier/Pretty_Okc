PrettyOkc.Matches = (function() {
  function init() {
    update_matches_page();
    minimum_percentage_option();

    var observer = new MutationSummary({
      callback: update_matches_page,
      queries: [{ element: '.match_card_wrapper' }]
    });
  }

  function update_matches_page() {
    change_tile_text();
    add_star_ratings();
    filter_minimum_percentage();
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
      } else if (rating_width > 10 && rating_width < 40) {
        return "low_rating";
      } else if (rating_width > 50 && rating_width < 70) {
        return "partial_rating";
      } else if (rating_width > 70) {
        return "full_rating";
      }
    }

    function apply_star_ratings(self, stars) {
      var action_rating = self.find('.star_rating').length === 0;
      if (action_rating) {
        self.find('.match_card_text').append('<div class="star_rating ' + stars + '"></div>');
      } else {
        self.find('.star_rating').removeClass('no_rating').removeClass('partial_rating').removeClass('full_rating').removeClass('low_rating').addClass(stars);
      }
    }
  }

  function minimum_percentage_option() {
    // Add New Option.
    $('#add_filter').before('<div class="form_element selector min_match_percent"><p class="button"><a id="toggle_matches"><span class="arrow"></span>Matches above <span id="current_match"></span>%</a></p><div class="drop_wrap"><ul><li>Matches above: <input id="min_match" name="matchmin" maxlength="2" value=""></li></ul></div></div>');

    // Set Default Values.
    $('#current_match').text(min_match_percent);
    $('#min_match').val(min_match_percent);

    // Bind open / close of Option Menu.
    $('#toggle_matches').click(function(e) {
      e.preventDefault();
      $(this).parent('.button').toggleClass('active');
      $(this).parents('.min_match_percent').toggleClass('open');
    });

    // Close on Body Click.
    $(document).mouseup(function (event) {
      var container = $(".form_element.min_match_percent");

      if (!container.is(event.target) && container.has(event.target).length === 0) {
        container.removeClass('open');
        container.find('.button').removeClass('active');
      }
    });

    // Only allow numbers in the input.
    $("#min_match").keydown(function (e) {
      // Allow: backspace, delete, tab, escape, enter and period.
      // Allow: Ctrl+A
      // Allow: home, end, left, right.
      if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 190]) !== -1 || (e.keyCode == 65 && e.ctrlKey === true) || (e.keyCode >= 35 && e.keyCode <= 39)) {
        return;
      }

      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
         e.preventDefault();
      }
    });

    // Update Values on Change.
    $('#min_match').change(function() {
      var new_percent = $(this).val();
      if (new_percent === "") {
        $(this).val(0);
        new_percent = 0;
      }

      $('#current_match').text(new_percent);
      chrome.storage.sync.set({"min_match": new_percent});
    });
  }

  function filter_minimum_percentage() {
    $('.match_card_wrapper').each(function() {
      var match_percent = $(this).find('.percentages').text();
      match_percent = match_percent.replace('%', '');

      if (min_match_percent !== 0) {
        if (match_percent < min_match_percent) {
          $(this).hide();
        }
      }

    });
  }



  return {
    init: init
  }
})();

PrettyOkc.ClassicMatches = (function() {
  function init() {   
    add_excerpt_div();

    var observer = new MutationSummary({
      callback: add_excerpt_div,
      queries: [{ element: '.match_card_wrapper' }]
    });
  }

  function add_excerpt_div() {
    $('.match_card_wrapper').each(function() {
      var self = $(this);
      if (self.find('.pretty_okc_profile_excerpt').length === 0) {
        self.find(".match_card_text").after('<div class="pretty_okc_profile_excerpt"></div>');
        var username = self.attr('id').replace('usr-', '').replace('-wrapper', '');
        get_profile_excerpt(username);
      } 
    });

    function get_profile_excerpt(username) {
      var full_url = 'http://www.okcupid.com/profile/' + username + " #main_column";
      var excerpt = $('#usr-' + username + '-wrapper').find('.pretty_okc_profile_excerpt');
      excerpt.load(full_url, function(response) {
        parse_excerpt(response, excerpt);
      });
    }

    function parse_excerpt(response, excerpt) {
      var available_excerpts = [];
      var priority = excerpt_priority;
      
      excerpt.find('.essay').each(function() {
        available_excerpts.push($(this).attr('id'));
      });

      // If their profile is empty
      if (available_excerpts.length === 0) {
        excerpt.html('').text('No profile yet');
      } else {
        for ( var index = 0; index < priority.length; ++index ) {
          if (check_array(priority[index])) {
            excerpt.find('.sr_message').remove();
            var container = excerpt.find('#essay_' + priority[index]);
            container.siblings().each(function() {
              $(this).remove();
            });
            truncate_excerpt(container);
            break;
          } 
        }
      }

      function check_array(iteration) {
        var content = 'essay_' + iteration;
        if ($.inArray(content, available_excerpts) !== -1) {
          return true;
        } else {
          return false;
        }
      }
    }

    function truncate_excerpt(container) {
      container.dotdotdot({
        ellipsis  : '... ',
        wrap    : 'word',
        fallbackToLetter: true,
        after   : null,
        watch   : false,
        height    : 100,
        tolerance : 0,
        callback  : function( isTruncated, orgContent ) {},
        lastCharacter : {
          remove    : [ ' ', ',', ';', '.', '!', '?' ],
          noEllipsis  : []
        }
      });
    }
  }

  return {
    init: init
  }
})();
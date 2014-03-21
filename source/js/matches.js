PrettyOkc.Matches = (function() {
  function init() {
    rebuild_match_tiles();

    var observer = new MutationSummary({
      callback: rebuild_match_tiles,
      queries: [{ element: '.match_card_wrapper' }]
    });
  }

  function rebuild_match_tiles() {
    $('.match_card_wrapper').each(function() {
      var self = $(this);
      bind_tile_functions(self);
      change_tile_text(self);
      add_star_ratings(self);
    });

    function bind_tile_functions(self) {
      var username = self.attr('id').replace('usr-', '').replace('-wrapper', '');
      var left_offset = $('#match_results').offset().left - self.offset().left + 7;
      var link = self.find('.image_wrapper').attr('href'); 

      if (self.find('.content_wrap').length === 0) {
        self.children().wrapAll('<a class="content_wrap" href="' + link + '" />');
        self.prepend('<a class="base_link" href="' + link + '" />')
        self.find('.match_card_text').after('<div class="pretty_okc_profile_excerpt"></div>');
      }

      self.mouseover(function() {
        self.find('.content_wrap').css({
          left: left_offset
        });
        get_profile_excerpt(username, self)
      }).mouseout(function() {
        self.find('.content_wrap').css({
          left: '0'
        });
      });      
    }

    function get_profile_excerpt(username, self) {
      var full_url = 'http://www.okcupid.com/profile/' + username + " #main_column";
      var excerpt = self.find('.pretty_okc_profile_excerpt')

      if (excerpt.is(':empty')) {
        excerpt.load(full_url, function(response) {
          parse_excerpt(response, excerpt);
        });
      }
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
        height    : 75,
        tolerance : 0,
        callback  : function( isTruncated, orgContent ) {},
        lastCharacter : {
          remove    : [ ' ', ',', ';', '.', '!', '?' ],
          noEllipsis  : []
        }
      });
    }

    function change_tile_text(self) {
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
    }

    function add_star_ratings(self) {
      var stars = calculate_star_ratings(self);
      apply_star_ratings(self, stars)

      // If the user changes a rating, adjust accordingly
      self.find('#personality-rating').find('li').find('a').click(function() {
        setTimeout(function() {
          var new_stars = calculate_star_ratings(self);
          apply_star_ratings(self, new_stars);
        }, 500);
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
  }

  return {
    init: init
  }
})();
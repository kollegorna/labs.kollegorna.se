//= require "jquery"
//= require "fitvids"
//= require "gsap"

/*!
 * kollegorna.se js
 */
(function() {

    'use strict';

    TweenMax.set($('.home__language'), { opacity: 0, rotationX: -60, marginTop: '-50px', transformOrigin: 'center 0', transformPerspective: 800 });

    var Kollegorna = {

      init: function() {
        // get labs RSS feed
        this.labsRssFeed();

        this.fitvids();
      },

      labsRssFeed: function () {
        if($('.home__labs').length) {
          $.ajax({
            url      : document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=' + encodeURIComponent('https://labs.kollegorna.se/feed.xml'),
            dataType : 'json',
            success  : function (data) {
              if (data.responseData.feed && data.responseData.feed.entries) {
                $('.home__labs p').after('<ul></ul>');

                $.each(data.responseData.feed.entries, function (i, e) {
                  if (i < 5) {
                    var press_date = new Date(e.publishedDate);
                    $('.home__labs ul').append('<li><a href="' + e.link + '">' + e.title + '</a><time class="t-meta t-meta--small">' + Kollegorna.formatRssDate(press_date) + '</time></li>');
                  }
                });
              }
            }
          });
        }
      },

      formatRssDate: function (d) {
        var curr_date = d.getDate();
        var curr_month = d.getMonth();
        var curr_year = d.getFullYear();

        if ($('html').attr('lang') == 'sv') {
          var month_names = new Array("januari", "februari", "mars",
          "april", "maj", "juni", "juli", "augusti", "september",
          "oktober", "november", "december");

          return curr_date + ' ' + month_names[curr_month] + ' ' + curr_year;
        } else {
          return d.toISOString().substring(0, 10);
        }
      },

      fitvids: function () {
        $('.article__body').fitVids();
      }
    };

    document.addEventListener("DOMContentLoaded", function(event) {
        Kollegorna.init();
    });

  var DEFAULT_VALUE = 'en';
  var PREFERRED_LANGUAGE = navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage || DEFAULT_VALUE;
  console.log(PREFERRED_LANGUAGE);
  if (PREFERRED_LANGUAGE != 'sv' || PREFERRED_LANGUAGE != 'sv-fi') {
    console.log('Language Not Swedish');
  }

  TweenMax.to($('.home__language'), .25, { opacity: 1, marginTop: 0, rotationX: 30, delay: .5, ease:Power1.easeInOut });
  TweenMax.to($('.home__language'), .25, { opacity: 1, marginTop: 0, rotationX: -15, delay: .75, ease:Power1.easeInOut });
  TweenMax.to($('.home__language'), .25, { opacity: 1, marginTop: 0, rotationX: 7, delay: 1, ease:Power1.easeInOut });
  TweenMax.to($('.home__language'), .25, { opacity: 1, marginTop: 0, rotationX: -3, delay: 1.25, ease:Power1.easeInOut });
  TweenMax.to($('.home__language'), .25, { opacity: 1, marginTop: 0, rotationX: 0, delay: 1.5, ease:Power1.easeInOut });
}());

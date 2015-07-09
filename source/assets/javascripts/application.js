//= require "jquery"
//= require "fitvids"
$(function() {
  $( ".index__about-toggle" ).click(function(e) {
    e.preventDefault();

    if (Modernizr.mq('(min-width: 1024px)')) {
      $( ".index__about, .index__blog, .index__projects" ).fadeToggle( "fast" );
    } else {
      $('html, body').animate({
        scrollTop: $("#about").offset().top+1
      }, 2000);
    }
  });
});

$(function() {
  // Set body min height to window height to make footer border looks nice.
  if (Modernizr.mq('(min-width: 1024px)')) {
    $('body').css('min-height', $(window).height());
  }

  $( ".index__about-toggle" ).click(function(e) {
    e.preventDefault();
    $( ".index__about, .index__blog, .index__projects" ).fadeToggle( "fast" );
  });
});

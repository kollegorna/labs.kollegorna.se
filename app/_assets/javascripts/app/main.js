$(function() {
  $( ".index__about-toggle" ).click(function(e) {
    if (Modernizr.mq('(min-width: 1024px)')) {
      e.preventDefault();
      $( ".index__about, .index__blog, .index__projects" ).fadeToggle( "fast" );
    }
  });
});

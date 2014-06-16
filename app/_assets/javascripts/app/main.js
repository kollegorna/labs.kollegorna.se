$(function() {
  // Set body min height to window height to make footer border looks nice.
  if (Modernizr.mq('(min-width: 1024px)')) {
    $('body').css('min-height', $(window).height());
  }
});

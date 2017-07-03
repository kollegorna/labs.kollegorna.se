//= require "jquery"
//= require "gist-embed"
//= require "disqusLoader.js/jquery.disqusloader.js"


// lazy load disqus comments

;( function() {

  var url = window.location.origin + window.location.pathname;

  $.disqusLoader( '.disqus', {
    scriptUrl: '//kollegornalabs.disqus.com/embed.js',
    disqusConfig: function() {
      this.page.url         = url;
      this.page.identifier  = url;
    }
  });

})();

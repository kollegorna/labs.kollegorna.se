module.exports = function(grunt) {

grunt.initConfig({
  exec: {
    build: {
      cmd: 'bundle exec jekyll build'
    },
    serve: {
      cmd: 'bundle exec jekyll serve --watch'
    },
    deploy: {
      cmd: "rsync -avz --delete --exclude '.git*' --exclude '.DS_Store' --exclude '.sass-cache*' dist/ root@178.62.13.136:/var/www/labs.kollegorna.se"
    }
  }
});

grunt.loadNpmTasks('grunt-exec');

grunt.registerTask('default', [ 'exec:build' ]);
grunt.registerTask('serve', [ 'exec:serve' ]);
grunt.registerTask('deploy', [ 'exec:build', 'exec:deploy' ]);

};

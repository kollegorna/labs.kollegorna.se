---
layout: post
type: post
title: "Jekyll for Company Websites"
created: 1428577944
author: urban
comments: true
---

Recently we made two small company websites for Blendow Group – [blendow.se](http://www.blendow.se/) and [bgpublishing.se](http://www.bgpublishing.se). We decided to build them using [Jekyll](http://jekyllrb.com/) and host them on [GitHub Pages](https://pages.github.com/). Since our client is pretty tech-savvy and knows their way around Markdown and HTML we could choose this solution knowing they could update and edit their sites easily themselves. Both sites also require very little change as they're basically just promoting the digital products that Blendow offers (like [BG Play](https://www.bgplay.se) and [Legal Career](https://www.legalcareer.se) that we've previously built for them).

## GitHub pages
GitHub Pages are public web pages hosted for free through [GitHub](https://github.com/). In add-on to supporting regular HTML pages, GitHub pages also supports Jekyll - the simple static site generator.

### The good stuff
+ Free - Hosting a website on GitHub Pages costs nothing.
+ Uptime - GitHub is very seldom down
+ Speed - fast response time
+ Backup - source code always safe in git
+ Private repos - private repos is now supported.

### Any downsides?
+ [Not all Jekyll plugins are supported](https://pages.github.com/versions/). Such as our favorite plugin [Jekyll Assets](https://github.com/ixti/jekyll-assets). 
+ SSL is not supported (yet).

## gh-pages branch

For serving content via GitHub Pages you need to create a branch called ``gh-pages`` and set this as default.

![Screenshot](/images/2015/2015-04-28-jekyll-for-company-sites-branch.png)

This branch will hold all of your website files.

## Gulp

Of course you can just use the built-in Sass-compiler in Jekyll, but [Gulp](http://gulpjs.com/) is our weapon of choice when it comes to compiling assets (using for example [gulp-sass](https://www.npmjs.com/package/gulp-sass), running tasks and make builds so we decided to run Jekyll as a child process in Gulp, together with [BrowserSync](http://www.browsersync.io/). Which will give us file watching, CSS injecting, browser synchronization, and auto-rebuild the Jekyll site.

There are two ways of running child processes in Node, [spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) and [exec](http://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback). Here we are using spawn.

This is the Gulp task that builds the site using the config.yml file given. (We can use separate config.yml here for dealing with dev/staging/production builds, or other things we want to be different specified as YAML front matter.

```javascript
gulp.task("jekyll-build", function (done) {
	gulp.task("jekyll- browserSync.notify(messages.jekyllBuild);
		return cp.spawn("jekyll", ["build", "--config", "_config.yml"], {stdio: "inherit"})
	.on("close", done);
});
```

This is what the rebuild, watch and default tasks look like:

```javascript

gulp.task("jekyll-rebuild", ["jekyll-build"], function () {
    browserSync.reload();
});

gulp.task("watch", function () {
    gulp.watch("_sass/**/*.scss", ["sass"]);
    gulp.watch(["js/app.js"], ["js"], ["bs-reload"]);
    gulp.watch(["index.html", "_layouts/*.html", "_includes/*.html", "_posts/*"], ["jekyll-rebuild"]);
});

gulp.task("default", ["browser-sync", "watch"]);
```

This workflow is inspired from [shakyShane](https://github.com/shakyShane/jekyll-gulp-sass-browser-sync).

### Development mode

We just run ``$ gulp`` and fire up a browser at http://localhost:3000 and/or the external ip address provided by BrowserSync (if using the [xip.io](http://www.browsersync.io/docs/options/#option-xip) setting that is).

## Using a custom domain

First you will need to create a new file in your GitHub repo called ``CNAME`` that contains the domain name (or subdomain) that you wish to use. This file should be placed in the gh-pages branch, which we created earlier.

If you want to use a root domain (such as mywebsite.se) for your website you will need to setup a new A record that points to the IP address ``192.30.252.153``. 

[Read more](https://help.github.com/articles/tips-for-configuring-an-a-record-with-your-dns-provider/).


## Deploy to GitHub pages
	
	git push origin gh-pages

Easy as pie!

## Edit content on GitHub or Prose

For editing content Markdown and HTML files, we just edit the files in our text editor and push to GitHub. But what about our client?

GitHub has a good editor for this, making this easy. Clicking the pencil icon takes us to the editor. 

![Screenshot](/images/2015/2015-04-28-jekyll-for-company-sites-icon-edit.png)

When finished, clicking the "commit changes" will commit directly to the ``gh-pages`` branch. 

[Prose](http://prose.io/) is another alternative – a content editor for GitHub. Prose provides a beatifully simple content authoring environment for CMS-free websites Prose has advanced support for Jekyll sites and Markdown content. Prose detects Markdown posts in Jekyll sites and provides syntax highlighting, a formatting toolbar, and draft previews in the site's full layout.

![Prose](/images/2015/2015-04-28-jekyll-for-company-sites-prose.png)

Overall we're very happy with what we get by using Jekyll directly on GitHub Pages. This is not the last time we'll be using it as we're big fans of static site generators like Jekyll and Middleman.

Last but not least: check out our [Jekyll boilerplate](https://github.com/kollegorna/jekyll-boilerplate) and [Middleman boilerplate](https://github.com/kollegorna/middleman-boilerplate) on GitHub.

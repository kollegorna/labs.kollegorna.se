---
layout: post
type: post
title: "Parsely - request a recrawl"
created: 1433329500
author: ivan
comments: true
---

*[Parse.ly](http://www.parsely.com/) is an analytics platform designed specifically for online publishers. Parse.ly provides digital publishers with clear audience insights to answer questions about how readers are responding to content.*

Once you [set it up](http://www.parsely.com/docs/integration/tracking/basic.html) for your website, Parse.ly Crawler will perform a crawl of the pages as the pageviews stream in from those URLs. 

The crawl is performed only once for a unique URL - when the article is published and traffic starts coming in.

When the article changes a recrawl would be nice. To do that, you need API key and API secret, that you can access via [API Settings page](http://www.parsely.com/docs/integration/metadata/dash.parsely.com/to/settings/api).

In order to request a recrawl, you have to submit a POST request to the following address, appending the <URL> to request a recrawl for:
	
	http://dash.parsely.com/<API_KEY>/ping_crawl?secret=<API_SECRET>&url=<URL>
	

## This is how to do it in a Rails app.


Add a ruby http client [http.rb](https://github.com/httprb/http.rb) to your Gemfile:

	gem 'http'
	

Add your Parse.ly API credentials to secrets.yml:

	parsely_api_key: <%= ENV['PARSELY_API_KEY'] %>
	parsely_api_secret: <%= ENV['PARSELY_API_SECRET'] %>


Set environment variables (or put those environment variables to .envrc if you're using [direnv](http://direnv.net/)), so that you don't push them to a remote repository:

	export PARSELY_API_KEY=__our_api_key__
	export PARSELY_API_SECRET=__secret__


And this is what a crawler might look:
{% gist ivannovosad/0270af6eea1bee499414 %}


We'll need a worker, that requests the recrawl:
{% gist ivannovosad/1a56636b11de9c7c696c %}


And finally tell the worker to perform the job when a blog post changes, in active admin's resource:
{% gist ivannovosad/d77a0e8e2953eea5eeac %}


That's it! Now our blog posts are recrawled on every update!

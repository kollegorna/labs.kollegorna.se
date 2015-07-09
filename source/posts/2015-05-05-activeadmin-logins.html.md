---
title: "Tracking user logins and displaying results in Active Admin"
date: 2015-05-05 00:00 UTC
author: ivan
disable_comments: false
---

In one of our web applications we needed to track user logins (when and from where a user logs in), and display them to the website admin.

We're using [Active Admin](https://github.com/activeadmin/activeadmin) in most of our apps, so we created a gem called [activeadmin-logins](https://rubygems.org/gems/activeadmin-logins) which does exactly that.

When a user logs in, it stores the IP address, user agent and it tries to determine the location using [GeoIP](https://github.com/cjheath/geoip).

## Installation
Add this line to your application's Gemfile:
	
	gem 'activeadmin-logins'
	
And then run:

	$ bundle
	
Or install it yourself as:

	$ gem install activeadmin-logins
	
## Usage

	$ rails generate active_admin:logins:install
	$ rake db:migrate

## In case you haven't generated activeadmin user resource:

	$ rails g active_admin:resource user
	
## Screenshot
	
![Logins screenshot](https://cloud.githubusercontent.com/assets/295572/7472876/22414c76-f337-11e4-91e7-ae74b9f5bccc.png)


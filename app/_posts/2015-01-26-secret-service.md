---
layout: post
type: post
title: "Ensure your secrets are set with secretservice"
created: 1422263764
author:
  - filippos
  - henrik
comments: true
---

Rails 4.1 introduced secrets.yml, a file in which you can add your secret configuration variables per environment. This is typically API keys and similar things that you don't want to commit to your repository and potentially expose to the world. To avoid this, the file should not contain the actual values, but instead you should export the values in your ENV and just point to them in your secrets.yml, e.g.

```ruby
production:
  secret_key_base: <%= ENV["SECRET_KEY_BASE"] %>
  mailchimp_api_key: <%= ENV["MAILCHIMP_API_KEY"] %>
```


The secrets file is quite helpful when joining an existing project, where your colleagues have already built a number of features. Before secrets.yml there was no standardized location for these variables and they could often be scattered in many places. You would have to know in advance which ENV variables you should export (variable name + value) for each environment or eventually run into errors. With secret.yml, you know what you need with just one look.

In order to enforce this secrets.yml, we developed a super tiny gem that checks if any secrets in the current environment are blank, which usually means that you've forgotten to set your ENV variables. If so, it will throw you an exception, reminding you. We think it's vital since, without proper configuration, an app could behave substantially different leading to unexpected behavior.

In order to use it, all you need to do is to add it in your Gemfile:

```ruby
gem 'secretservice'
```

If you wish to use it only on a specific environment you can specify that in the Gemfile when including the gem.

That's all you need to do and secretservice will keep you notified in case you forget to initialize an ENV var.

You can find it on [GitHub](https://github.com/kollegorna/secretservice) and [RubyGems.org](https://rubygems.org/gems/secretservice).

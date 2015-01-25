---
layout: post
type: post
title: "SecretService"
created: 1422263764
author: filippos, henrik
comments: true
---

Rails 4.1 introduced secrets.yml, a file in which you can add configuration variables
per environment. The file should not have the actualy values, but instead you should
export the values in the ENV and point from secret.yml to ENV variable.

Secrets file is quite helpful when picking up a project on the way, where your
colleagues have already built a number of features. Before secrets.yml, you would
have to know in advance which ENV variables you should export (variable name + value)
for each environment. With secret.yml, you know what you need with just one look.

In order to enforce this secrets.yml, we developed a super tiny gem that checks
if env variables defined in the file have been actually exported with a value in
your environment. If not, it will throw you an exception, reminding you to set
up your env vars. We think it's vital since, without proper configuration, an app
could behave substantially different leading to unexpected behavior.

In order to use it, all you need to do is to add it in your gemfile:

```ruby
gem 'secretservice'
```

If you to use it only on a specific env, specify the env in the gemfile when
including the gem.

That's all you need to do and secretservice will keep you notified in case you
forget to initialize an env var.

You can find it [here](https://github.com/kollegorna/secretservice).

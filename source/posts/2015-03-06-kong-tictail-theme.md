---
layout: post
type: post
title: "Building Tictail themes with Grunt, Bower and other modern development tools and techniques"
created: 1425632525
author: per
comments: true
---

Are you building a theme for a Tictail store? In this blog post we'll share how with we did when building our online snowboard store [The Kong Initiative](http://www.konginitiative.com) ([more info](http://blog.konginitiative.com/post/112780967221/no-business-like-snow-business)).

When choosing ecommerce platform we early realised that Tictail by far was the best way to go for us. It's a no brainer to setup an account, very affordable and has a plethora of apps that solves the most basic problems.

The big issue I had with them though was their theme editor. It's just like on Tumblr where you have one big text field where all your code is stored. Being stuck inside that is not the most enjoyable thing as developer in 2015. That's not how we do things these days.

I did some googling and found out that [@javve](https://twitter.com/javve) had created a simple Sinatra app called [Tictail theme builder](https://github.com/javve/tictail-theme-builder). A pretty clever thing that downloads your store data, spins up a local environment and lets you build your theme. When you're feeling done it lets you export the theme which you then paste into Tictails theme editor.

In the README [@javve](https://twitter.com/javve) raises a [warning](https://github.com/javve/tictail-theme-builder/blob/master/README.md#warning) of the backend not being the best. It also lacked of stuff like Grunt and Bower. So me and [Ivan](https://twitter.com/ivannovosad) sat down and improved it by making a lot of changes of the Ruby code and some other stuff to make it fit how we do things here at Kollegorna.

The result is a completely revamped version. Some highlights:

- Refactored Ruby code, specs…
- Front end package management with [Bower](http://www.bower.io)
- Automation with [Grunt](http://gruntjs.com/)
- Simple deployment of assets with rsync

We've published everything on our Github account. For more in depth information and how to use it see the [README](https://github.com/kollegorna/kong-tictail-theme/blob/master/README.md). Feel free to fork and/or improve it!

[kollegorna/kong-tictail-theme](https://github.com/kollegorna/kong-tictail-theme)

_Since we started building this Tictail has released [gulp-tictail](https://github.com/tictail/gulp-tictail) and a [theme example](https://github.com/tictail/theme-example) that also simplifies things when building Tictail themes._

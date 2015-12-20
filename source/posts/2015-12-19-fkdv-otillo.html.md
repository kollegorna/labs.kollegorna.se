---
title: Ö till Ö livestream overlay
date: 2015-12-19 10:40:31 UTC
author: dennis
disable_comments: false
---

We got an unusual request from [FKDV](http://fkdv.se/). They wanted to have a overlay to use on their livestream of [Ö till Ö](http://www.otilloswimrun.se/) 2015.

The idea was to have a webpage running in full screen with a green background to be able to key it out and insert it into the video stream.
We would fetch data from an API to put up information about race. Such as the different leader boards and information about the team the presenter currently talked about.

To consume the API we used [Socket.io](http://socket.io/) to create a Server with a controlpanel.
Thec controlpanel was build as a really simple Node.js/Express application that had an input for a team number and a few buttons for the different leader boards.

![controlpanel](/posts/fkdv-otillo-controlpanel.png)

For the client  we used our handy [Middleman Boilerplate](https://github.com/kollegorna/middleman-boilerplate). We built up the overlay design that we got using [Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Using_CSS_flexible_boxes). It was really freeing to be able to use Flexbox to create the layout since we knew that they would use Chrome as their browser.

![live-overlay](/posts/fkdv-otillo-overlay.jpeg)

I find this really cool and hope to do similar unusual projects in the future. Who says that web technologies must be used for web? Just look at what people have done with the [Electron](https://electron.atom.io/) project.


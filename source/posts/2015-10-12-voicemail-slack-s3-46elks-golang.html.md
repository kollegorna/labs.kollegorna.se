---
title: Voicemail using Slack, S3, 46elks and a dash of Go
date: 2015-10-12 00:00:00 UTC
author: henrik
disable_comments: false
---

Telemarketers love to harvest phone numbers from the Swedish company
registry. Our contact details there used to include Per's mobile phone
number, which over time became a threat to his sanity. When he wanted a
break from this and threatened to give them my number instead, I took
this as an excuse to hack together a simple voicemail service using the
[46elks telephony API](http://www.46elks.com). 
It plays a pre-recorded message, records whatever the caller says,
uploads the resulting file to S3 and posts a comment in our #phone
channel on [Slack](https://slack.com).

![Telefonista](/posts/telefonista-slack.png)

Since telemarketers never leave a message, it's a pretty effective
filter. 

Call us today: [+46 (0) 766 862 134](tel:+46766862134)

Source code on GitHub:
[https://github.com/kollegorna/telefonista](https://github.com/kollegorna/telefonista)

---
title: "How to track clicks on external links and count file downloads in Google Analytics"
date: 2015-04-30 00:00 UTC
author: per
disable_comments: false
---

To follow up on what I wrote yesterday ([Tracking external links in Google Analytics and browser behaviour](/blog/2015/04/google-analytics-external-links/)) about how event.Preventdefault can break things I thought I'd share what I was working on when discovering that. 

The code below makes Google Analytics track the following events:

- Clicks on external links
- Clicks on internal files
- Clicks on external files

To be clear this code is based on [the work of Ralph Slooten](http://www.axllent.org/docs/view/track-outbound-links-with-analytics-js/). Hats off to him! I'd also like to thank [Joakim Stai](https://github.com/joakim) for providing some code review.

<script src="https://gist.github.com/persand/017445ef39975f1d75e1.js"></script>

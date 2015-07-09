---
title: "Tracking external links in Google Analytics and browser behaviour"
date: 2015-04-29 00:00 UTC
author: per
disable_comments: false
---

Here are some thoughts on tracking clicks on external links in Google Analytics (and specifically Universal Analytics).

[Ralph Slooten](http://www.axllent.org/about) has written a great article on this:
[Track outbound links with Google Universal Analytics.js](http://www.axllent.org/docs/view/track-outbound-links-with-analytics-js/).
To understand what I'm talking about here go ahead and read it.

There's one problem with event.preventDefault though…

If I press a key when clicking the link or press the middle button on my mouse (if I have one) then the browser won't behave as I expect.

## Example 1

I CMD + click the link on my Mac (or CTRL + click on Windows). I now expect it to open in a new tab/window. But event.preventDefault breaks that and it's opened in my current tab/window.

## Example 2

I see that the link goes to a PDF file and I want to download it straight away. So I ALT + click the link but that's also ignored and the file is opened in my browser.

Jack Moore has a more [in depth article](http://www.jacklmoore.com/notes/click-events/) on this as well as [Bodhi](http://techscursion.com/2011/12/dont-tab-me-bro.html).

## My personal opinion on this

Preventing users from opening outbound links in new tabs is more annoying than forcing them to open the same links in new tabs. 

If you agree with me then the simple way to go is to just replace:

<code>document.location.href = el.href;</code>

With:

<code>window.open(el.href, '_blank');</code>

Now all outbound links will be opened in a new tab/window.
It might not be a dream scenario but it's the lesser of two evils.

---
layout: post
type: post
title: "My first Personal Development Days"
created: 1424101296
author: ivan
comments: true
---

Every six weeks we're having Personal Development Days a.k.a. PDD. It's usually 3 days - Thursday, Friday and Monday when we don't work on clients' projects but we can work on our own stuff - learning news skills, working on our personal projects, etc. 

I decided to learn something new that I can potentially use at work but also deploy to the Raspberry Pi 2 Model B, I accidentally received a day before my first PDD (Thanks Kollegorna!).

I wanted to learn some Node.js for a while, but didn't have time to do so.
Until now.

There's a great course at codeschool - [Real-time Web with Node.js](https://www.codeschool.com/courses/real-time-web-with-node-js), so I decided to give it a try.
It took me a day to complete the course, and I was thinking about a microproject that could be based on it.
After I while I knew exactly what to build. Since we're a distributed team working from 5 different locations, we use Slack for internal communication.

So I built [weatherbot](https://github.com/kollegorna/weatherbot). It's a very simple node.js app that fetches weather data from our team members' work locations and posts it to our Slack channel.
It uses an excellent [forecast.io API](http://forecast.io/) and [slack-node](https://www.npmjs.com/package/slack-node) for posting the data to Slack using [Slack API](https://api.slack.com/web).

It's deployed to Raspberry Pi and scheduled to run daily at 9.
An article on how you [set up Node.js on Raspbian](http://weworkweplay.com/play/raspberry-pi-nodejs/).

And this is what awaits us every morning in #kollegorna channel:

![screenshot](https://cdn.rawgit.com/kollegorna/weatherbot/master/assets/slack-screenshot.png)

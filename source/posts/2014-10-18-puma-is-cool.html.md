---
title: "Puma is cool! (and Ruby 2.1.3)"
date: 2014-10-18 00:00 UTC
author:
  - filippos
  - henrik
disable_comments: false
---

A lot of stuff is going on lately at Kollegorna. One of them is a change in our default application server in our Rails projects. Until now we had tried both [Unicorn](http://unicorn.bogomips.org/) and [Thin](http://code.macournoyer.com/thin/) servers and we were mostly satisfied. Only when we started hitting the dyno's memory "wall" in Heroku (error [R14](https://devcenter.heroku.com/articles/error-codes#r14-memory-quota-exceeded)) we started looking for optimizations (remember "premature optimization is the root of all evil"!).

We first changed our default Unicorn server to the [Puma](http://puma.io/). Unicorn Server uses the process-based model which was perfect back in those days when Rails internals were not thread safe. However, process spawning is expensive in memory since the new process must hold all the data of the parent process (heap + stack + IO/network descriptors etc). Puma on the other hand uses a thread for each incoming connection which is much cheaper. Both use the preforking model anyway but still, threads are expected to be lighter than processes, with even faster context switching.

We also deployed using the Ruby 2.1.3 since 2.1.2 had some [memory issues](https://bugs.ruby-lang.org/issues/9607) with it's garbage collection.

Enough with theory! Let's see that in practice with screenshots from our monitoring tools:

![Paradox Accounts](/images/2014/paradox-accounts.png)

The first drop in the graph shows the Puma installation whereas the second one is by using Ruby 2.1.3

![wizard wars 1](/images/2014/wizardwars1.png)

Here the first one is by using Ruby 2.1.3 and the second one (which happened almost immediately) by using Puma server. Overall results after 1 day:

![wizard wars 2](/images/2014/wizardwars2.png)

In one word: Success :-D

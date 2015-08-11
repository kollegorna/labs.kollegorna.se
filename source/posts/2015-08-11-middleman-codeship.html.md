---
title: Middleman+Codeship
date: 2015-08-11 00:00:00 UTC
author: dennis
disable_comments: false
---

We are currently using [Middleman](https://middlemanapp.com) to generate our websites: [Kollegona.se](https://kollegorna.se), [Labs](https://labs.kollegorna.se) and [RTFM](https://rtfm.kollegorna.se).
We also use Middleman to make websites for clients and to quickly prototype ideas.

For Testing and Deployment we use [Codeship](https://codeship.com). Codeship is a Continuous Delivery service that will run automated tests and deploy for you. Our Middleman websites don't really need "Tests". We use it to try build our website instead.

Lets go through our setup for a Middleman+Codeship project.

###New Project
First we need to have a repository with Middleman. This could be on [Github](https://github.com) or [Bitbucket](https://bitbucket.org).

We use our [Middleman boilerplate](https://github.com/kollegorna/middleman-boilerplate) to quickly get started and then We create a new project in Codeship and link it to the repository on Github or Bitbucket.

###Setup testing
The "Test" that Codeship will run for us is really simple. We use *custom commands*:

```
rvm use 2.2.2
nvm install 0.10.25
nvm use 0.10.25
npm install
gulp install
gulp build
```

This will setup the test instance to use the right version of Ruby and Node. Then we use our gulp tasks to run ```bundle install```, ```bower install``` and then try to build Middleman.

###Deployment
We use a *custom script* for the Deployment. We set this only to deploy if a commit is on the master-branch:

```
gulp deploy
```

This gulp task uses **[rsync](https://en.wikipedia.org/wiki/Rsync)** to push the build up to the server specified in the gulpfile. For **rsync** to be able to connect to the server it needs to be authorized. You can find the Codeship project ssh-key in *Project settings* under *General*.

When all these things are done we just have to test it. Push to the master branch on the repository and watch Codeship do its magic.


For more information you can check out our Github repos:

- [Kollegorna.se](https://github.com/kollegorna/kollegorna.se)
- [Labs](https://github.com/kollegorna/labs.kollegorna.se)
- [RTFM](https://github.com/kollegorna/rtfm.kollegorna.se)

---
title: Middleman+Codeship
date: 2015-08-11 00:00:00 UTC
author: dennis
disable_comments: false
---

We are currently using [Middleman](https://middlemanapp.com) to generate our websites: [Kollegona.se](https://kollegorna.se), [Labs](https://labs.kollegorna.se) and [RTFM](https://rtfm.kollegorna.se).
And also we use Middleman to make sites to clients and to quickly prototype ideas.

This makes it really easy for us to deploy our static sites to our server without it breaking.

Lets go through our setup.

###New Project
First we need to have a repository with Middleman.This could be on [Github](https://github.com) or [Bitbucket](https://bitbucket.org).
Then We create a new project in [Codeship](https://codeship.com) and linked it to the repository.

###Test
We use custom commands to run our "Test".

```
rvm use 2.2.2
nvm install 0.10.25
nvm use 0.10.25
npm install
gulp install
gulp build
```

This setup the instance to use the right version of Ruby and Node. Then we use gulp tasks to run ```bundle install```, ```bower install``` and then it tries to build Middleman.

###Deployment
We have a custom Deployment script on the master branch. So if the "Test" runs without issues the script runs:

```
gulp deploy
```

This gulp task uses **[rsync](https://en.wikipedia.org/wiki/Rsync)** to push the build up to the server specified in the gulpfile. For **rsync** to be able to connect to the server it needs to be autherized. You can find the Codeship project ssh-key in *Project settings* under *General*.

When all these things are done we just have to test it. Push to the master branch on the repository and watch Codeship do its magic.


For more information you can check out our Github repos:

- [Kollegorna.se](https://github.com/kollegorna/kollegorna.se)
- [Labs](https://github.com/kollegorna/labs.kollegorna.se)
- [RTFM](https://github.com/kollegorna/rtfm.kollegorna.se)

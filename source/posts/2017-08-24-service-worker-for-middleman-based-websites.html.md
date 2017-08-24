---
title: "Service Worker for Middleman based websites"
date: 2017-08-24 18:00:00 EET
author: osvaldas
meta_description: "Middleman is a Ruby based static site generator which we use heavily both for prototyping (checkout our Middleman boilerplate) and production sites..."
share_image: /posts/images/service-worker-for-middleman-based-websites/middleman.jpg
disable_comments: false
---

[Middleman](https://middlemanapp.com/) is a Ruby based static site generator which we use heavily both for prototyping (checkout our [Middleman boilerplate](https://github.com/kollegorna/middleman-boilerplate)) and production sites. In my previous article on [Service Worker](/blog/2017/06/service-worker-gotchas/), I overviewed the most common challenges you may face when implementing the technology. This time I’d like to dive into a single specific topic of enabling a worker on Middleman based website as there are a few things to deal with&hellip;

![Middleman + Service Worker](/posts/images/service-worker-for-middleman-based-websites/middleman.jpg)

## Versioning

Service Worker is all about [caching resources](/blog/2017/06/service-worker-gotchas/#garbage-in-cache-is-your-problem). In order to invalidate cache with a worker, you have to assign a version number to each resource cached. You could do that manually each time you make a change on a website, but that’s probably not a thing you want to keep in mind and spend the time on. So how can we automate the process on the Middleman setup?

Since Middleman is a static site generator, one of the final phases of serving a website is making a build which, simply put, is converting source files into static ones. Adding `.erb` extension to a static file enables us to execute Ruby commands in it. This basically means that we can insert a dynamic content areas in the file and so make them differ on each build. Which is exactly what we need for implementing versioning for our Service Worker and thus instantly serve the fresh content for users.

The worker file ought to be placed here:

```
/source/serviceworker.js.erb
```

I found Unix timestamp to be a perfect method for naming the resource versions as in principle they are always unique on each build. Now we can put this in `serviceworker.js.erb`:

```javascript
const version = '<%= Time.now.to_i %>';
```

&hellip;and take the advantage of `version` further in the code.

## Digested assets

Digesting the assets is good for cache busting. This makes the change of your border radius  instantly visible for users. Therefore, I wouldn’t be surprised if you have `:asset_hash` activated. However, that leads to a problem: hardcoding paths of the assets won’t work because they differ on each build (the files get renamed to be more precise). But because of `.erb`, we can insert dynamic paths in Ruby way:

```javascript
const criticalResources = [
  '<%= asset_path :css, "/#{app.config[:css_dir]}/application" %>',
  '<%= asset_path :js, "/#{app.config[:js_dir]}/application" %>',
  '<%= asset_path :images, "logo.svg" %>'
];
```

As you might have noticed, CSS and JS implementations differ from images. I did run into a weird issue where `asset_path` were producing wrong paths to CSS and JS files. This tiny workaround solved this.

## Multiple languages

The number of languages on a website is a thing that you do not alter very often. But if you decide to hardcode the list in worker’s file, there is a big chance you’ll forget to update it when the time comes. Again, that’s probably not the thing you want to keep in mind, so it’s best to automate stuff when possible. Luckily, there is a way to get a list of languages available in Middleman and they can be inserted like this:

```javascript
const appLangs = ['<%= app.extensions[:i18n].options.langs.join("','") %>'];
```

Using `appLangs` you can automatically [cache these front pages and serve the appropriate "offline" page/image](/blog/2017/06/service-worker-gotchas/#service-worker-for-multilingual-website).

## Debugging

Service Worker is a test demanding technology and console logging is probably the most important factor in testing. But the thing is that you likely don’t want to log these messages into user’s browser and only want to do that in development mode. Middleman provides means to detect the environment type for an app:

```javascript
const logMsg = (msg) => {
  if('<%= app.config[:environment] %>' == 'development') {
    console.log(msg);
  }
};
// ...
logMsg('Install event');
// ...
logMsg('Activate event');
// etc.
```
By the way, there is more to debugging [Service Worker](/blog/2017/06/service-worker-gotchas/#debugging-service-worker).

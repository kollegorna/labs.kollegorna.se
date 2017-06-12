---
title: "Service Worker gotchas"
date: 2017-06-12 16:00:00 EET
author: osvaldas
meta_description: "We’ve learned there quite a few gotchas to grasp in order to get Service Worker working correctly…"
meta_image: /posts/images/service-worker-gotchas/kollegorna-offline-page.jpg
disable_comments: false
---

[Service Worker](https://developers.google.com/web/fundamentals/getting-started/primers/service-workers) has already been here for a while: since 2015-09 it has been fully supported in Chrome/Opera and if compared to what we have today it has gone a promising way of improvements, bug fixes, became more easily debuggable and is supported much widely (hello Firefox). That led us into using the technology in production and implementing it in our [kollegorna.se](https://kollegorna.se) website, as well as some client projects. We’ve learned there quite a few gotchas to grasp in order to get Service Worker working _correctly_…

Here is the list of what I’ll be overviewing in the article:

* [Service Worker is a part of Progressive Web Apps](#service-worker-is-a-part-of-progressive-web-apps)
* [What Service Worker is for](#what-service-worker-is-for)
* [Registering a Service Worker](#registering-a-service-worker)
* [HTTPS and localhost](#https-and-localhost)
* [Service Worker working scope](#service-worker-working-scope)
* [ES6: to be or not to be?](#es6:-to-be-or-not-to-be?)
* [“Offline” page](#“offline”-page)
* [Service Worker lifecycle and events hierarchy](#service-worker-lifecycle-and-events-hierarchy)
* [Critical and non-critical resources](#critical-and-non-critical-resources)
* [Service Worker strategies](#service-worker-strategies)
* [Serving “offline” image](#serving-“offline”-image)
* [Garbage in cache is your problem](#garbage-in-cache-is-your-problem)
* [Service Worker and DOM](#service-worker-and-dom)
* [Service Worker for multilingual website](#service-worker-for-multilingual-website)
* [Service Worker is backend-dependent](#service-worker-is-backend-dependent)
* [Debugging Service Worker](#debugging-service-worker)

## Service Worker is a part of Progressive Web Apps

Service Worker is a part of [Progressive Web Apps](https://developers.google.com/web/fundamentals/getting-started/codelabs/your-first-pwapp/) – a set of means for making websites accessible, functional… and annoying when not used properly (I’m talking to you, Web Push Notifications). The term of Progressive Web Apps was born at Google and is defined by several conceptual terms that you probably already know, but the latest and most exotic ones are: [Web App Manifest](https://developers.google.com/web/fundamentals/engage-and-retain/web-app-manifest/), [Web Push Notifications](https://developers.google.com/web/fundamentals/engage-and-retain/push-notifications/), [Web App Install Banners](https://developers.google.com/web/fundamentals/engage-and-retain/app-install-banners/).

## What Service Worker is for

The best thing about Service Worker is that it enables you to cache static HTML documents, assets and be completely in control of what you are serving to the user. It means that if cached previously your website can be available to the user who has no Internet connection or if your server went down. You can also serve the cached documents and/or assets even if there are no technical issues and that results in much faster website load times. Sounds like fun? With the great power comes responsibility – you’ll have to take care of cache size, make sure it’s not exceeded and consists of the latest version of assets.

## Registering a Service Worker

Think of Service Worker as a JavaScript file – `serviceworker.js`. The very first step in this journey is to tell the browser your website has a Service Worker that you want to register:

```javascript
// a check if the technology is supported by browser
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceworker.js');
}
```

It is that simple but here’s the first _gotcha_ discovered and documented by [Jeff](https://developers.google.com/web/fundamentals/instant-and-offline/service-worker/registration) from Google:

> For example, the Google I/O 2016 web app features a short animation before transitioning to the main screen. Our team found that kicking off the service worker registration during the animation could lead to jankiness on low-end mobile devices. Rather than giving users a poor experience, we delayed service worker registration until after the animation, when the browser was most likely to have a few idle seconds.
>
> Similarly, if your web app uses a framework that performs additional setup after the page has loaded, look for a framework-specific event that signals when that work is done.

Because you can choose when to install Service Worker you should pick the _idle_ moment for it. Here’s the rough hypothetical code visualisation of the quote above:

```javascript
if('serviceWorker' in navigator) {
  document.querySelector('.hero').addEventListener('animationend', function () {
    // service worker is registered only when the animation ends
    navigator.serviceWorker.register('/serviceworker.js');
  });
}

// ---

App.init({
  // config
  complete: function() {
    // service worker is registered only when the app is initiated
    if('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/serviceworker.js');
    }
  }
});
```

Anyway, if your website is simplier than that, still the minimum recommendation is registering the worker only when the page has been fully downloaded so that it doesn’t slow down the other probably more important processes on your website:

```javascript
if('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/serviceworker.js');
  });
}
```

## HTTPS and _localhost_

Another _gotcha_ is that in order to get the Service Worker going your website must be accessible via HTTPS protocol or _localhost_ due to security reasons. The later only serves for development purpose. Despite the fact that Service Worker is operative through _localhost_ it won’t work through the IP of your internal network, like 192.160.0.100 or similar.

## Service Worker working scope

The location of `serviceworker.js` file on the server is a _gotcha_ as well: the worker will only operate on its current and child paths. In other words if the location of Service Worker file is `kollegorna.se/serviceworker.js`, it will work on the entire site (origin), even if I am browsing here `kollegorna.se/` or there `kollegorna.se/i/am/here`.

As you might have realized having the file on `kollegorna.se/about/serviceworker.js` won’t invoke the worker when browsing on `kollegorna.se/` nor `kollegorna.se/contact`.

Note that domains and subdomains all are different origins, so for example the worker on `kollegorna.se/serviceworker.js` will _not_ operate when browsing on `labs.kollegorna.se`. Placing multiple worker files will get you going.

## ES6: to be or not to be?

It is completely safe to use the _renewed_ JavaScript syntax in your `serviceworker.js` file, because browsers which support ES6 syntax also support Service Workers. However, I wouldn’t recommend using the new syntax for code that registers Service Worker, unless you use a transpiler. Otherwise JavaScript errors will be thrown for users whose browser won’t be able to interpret the new syntax.

I will be using ES6 syntax and functions for Service Worker file related code examples here in the article. I encourage you too as it’s not the future anymore, it is the present.

## “Offline” page

Berry on the cake: besides coding a Service Worker, you should also make a custom “offline” page with its own URL (e.g. `/offline/`) which is a part of Service Worker experience. It will be displayed when a requested page is inaccessible due to internet connection problems or server failure. The _how to_ – later in the article. Our “offline” page at Kollegorna is pretty simple:

![“Offline” page](/posts/images/service-worker-gotchas/kollegorna-offline-page.jpg)

## Service Worker lifecycle and events hierarchy

Each time the user visits your website, the browser downloads the worker’s file. If it is a repetitive visit and the file has been downloaded before, the browser compares them both. If there’s at least a byte’s difference, it’s considered there’s a new Service Worker available, so it get’s registered and the old one is deleted. That is called worker’s _lifecycle_. Le roi est mort! Vive le roi!

Once the worker file has been registered, the browser then acts by the _instructions_ defined in that file. Actually the browser triggers few events on different occasions. All we need to do is to _catch_ them and act accordingly, be it to cache a file or respond with a resource. Some events are triggered only once in worker’s lifecycle and some – multiple of times. Take a look at the scheme to see who is who:

![Service Worker lifecycle and events hierarchy](/posts/images/service-worker-gotchas/lifecycle-events-hierarchy.jpg)

As you see, it all starts with `install` event which is fired only _once_ in worker’s lifecycle. It is responsible for installing the service worker and initially caching the most important pages and assets of a website:

```javascript
self.addEventListener('install', event => {
  // ...
});
```

Then there’s `activate` event which is also fired only once in a lifecycle after the `install` event and we will use it for deleting the old documents and files from cache:

```javascript
self.addEventListener('activate', event => {
  // ...
});
```

Finally – `fetch`. It’s so powerful that it lets you kinda intercept HTTP requests and return relatively anything you want. It is fired on each HTTP request and for each request separately, for example: say you have a tiny website which consists only of `index.html`, `app.css`, `app.js`. files. When the user navigates to the website, the fetch event is triggered for each resource (three times in total) where you can choose what to return, be it a fresh page/asset or a copy from the cache.

```javascript
self.addEventListener('fetch', event => {
  // ...
});
```

## Critical and non-critical resources

You can choose to cache the initial resources along with the worker’s installation. It’s up to you picking a few most important ones, but usually they are a homepage, a pair of main CSS, JS files and of course “offline” page – this is enough for a basic _offline_ experience.

The _gotcha_ here is that Service Worker is installed only when the initial resources are downloaded by a browser, consequently it is very important not to overload the process with too many files. Otherwise if the user spends a very small amount of time on the website and/or also has a slow internet connection the worker might not get installed at all.

Now let’s make a use of `install` event:

```javascript
const criticalResources = [
        '/',
        '/offline/',
        '/assets/css/main.css',
        '/assets/js/main.js'
      ],

      cacheCriticals = () => {
        return caches.open(version).then( cache => {
          return cache.addAll(criticalResources);
        });
      };

self.addEventListener('install', event => {
  event.waitUntil(cacheCriticals().then( () => self.skipWaiting() ));
});
```

Here we have `criticalResources` array of the stuff we want to always be available for our worker (and thus users). Then there is a function `cacheCriticals` which is executed in an asynchronous manner. The function kinda opens a cache room for the resources and puts them in there. The sign text on the door is a value of a custom variable `version` which I elaborate on later in the article.

Since it is recommended to have a very limited amount of critical resources, we can have an additional array of files that does _not_ block an installation of our worker. Therefore we can enrich our strategy for `install` event with _“critical”_ and _“important, but not critical”_ lists. Benefits are we get the worker installed as soon as possible along with the _criticals_ cached whereas the resources from the new array will be cached asynchronously and only if/when possible. In order to achieve this, let’s create an additional array and modify the function:

```javascript
const otherResources = [
        '/about/',
        '/contact/',
        '/services/'
      ],

      cacheCriticals = () => {
        return caches.open(version).then( cache => {
          cache.addAll(otherResources); // important, but not critical resources
          return cache.addAll(criticalResources); // critical resources
        });
      };
```

The `return` statment is important here as it labels a prerequisite for the worker to be installed.

## Service Worker strategies

Let’s move over to `fetch` event which is a cornerstone. As I mentioned, there are two ways to operate when the request for a resource knocks on – it’s **online**-first and **offline**-first. The _gotcha_ here is that you can choose different _give-it-to-me_ strategies for each type of resource. I’d exclude three common Service Worker strategies:

### Online-first everything

This means serving resources from the network first and falling back to the cache storage for the failed network requests. This is probably the safest strategy as it eliminates the chance of serving an outdated content for Internet-connected users and provides a fallback for disconnected ones. However, the strategy provides no gains in page download performance for the online users.

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    // try fetching a resource from the network
    fetch(event.request).then(response => {
      // cache the resource and serve it
      let responseCopy = response.clone();
      addToCache(event.request, responseCopy); // this is a custom function, I'll elaborate on it later
      return response;
    })
    .catch(() => {
      // the resource could not be fetched from network
      // so let's pull it out from cache, otherwise serve the "offline" page
      return caches.match(event.request).then(response => response || caches.match('/offline/'));
    });
  );
});
```

### Offline-first everything

It’s serving resources from cache first but falling back to network request if the resource hasn’t been cached previously. The advantage here is that your website loads faster if cached: there will be no need for some network requests as things are pulled out right from the user’s device.

```javascript
self.addEventListener('fetch', event => {
  event.respondWith(
    // check if the resource was cached before
    caches.match(event.request).then(response => {
      // serve the resource if cached, otherwise fetch it through the network
      return response || fetch(event.request).then(response => {
        // cache the newly fetched resource and serve it
        let responseCopy = response.clone();
        addToCache(event.request, responseCopy); // this is a custom function, I'll elaborate on it later
        return response;
      })
      .catch(() => {
        // serve "offline" page if it couldn't be fetched from network
        return caches.match('/offline/');
      });
    });
  );
});
```

Performance gains are visible to the naked eye, but every bean has its black: a chance exists your users may be served with an outdated content. When the user comes to your website for the first time our Service Worker is installed and the critical resources along with a version number are stashed into the browser’s cache. After a while the user returns to your homepage which, let’s say, displays a list of your latest blog posts. The worker then immediately checks if the requested HTML document had been cached previously and serves it from there if the answer is true. So in that case if you published a new blog post before the user returned to your website they would **not** be able to see the post in the list because the homepage was served from the cache. After rendering the homepage our worker then detects that there is a change in the resource’s version number and deletes the HTML document from cache. Therefore in order to see the updated page the user should _refresh_ it. This may not be a huge problem for representative websites, but vise-versa for frequently updates ones.

### Offline-first assets and online-first HTML documents

It’s a combination of the first two strategies, but differentiated per resource types: offline-first assets and online-first HTML documents. The strategy partly solves the offline-first’s _refresh_ problem and so makes sure the users are always entertained with the latest content. The good thing is that you can check the request headers and so determine a type of the resource:

```javascript
self.addEventListener('fetch', event => {
  var type = event.request.headers.get('Accept');
  // network-first for HTML documents
  if(type.includes('text/html')) {
    event.respondWith(
      // respondWith code from network-first section
    );
  }
  // cache-first for assets
  else {
    event.respondWith(
      // respondWith code from cache-first section
    );
  }
});
```

This could be very suitable for CMS-based websites as you don’t need to manage cache on every database update (content insertion). That’s exactly what we adopted to our client’s WordPress based site.

## Serving “offline” image

We have already learned how to cache and serve the “offline” page and turns out we can do the same with images: cache and serve a custom image for the image-type requests that failed. Another one nifty UX improvement, design is in details:

![Serving “offline” image](/posts/images/service-worker-gotchas/kollegorna-offline-image.jpg)

Actually there are at least two ways of implementing the “offline” image:

### 1\. Inlined in worker’s file

If the image is technically simple you can Base64 it or ideally have it in SVG format which is a complete win: the image is resolution-independent, style-able, easily maintainable.

```javascript
event.respondWith(caches.match(request).then(response => {
  return response // cache-first
  || fetch(request).then(response => { // network
    // ...
  })
  .catch(() => { // offline
    if(type.startsWith('image')) {
      return new Response('<svg...', {headers: {'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store'}});
    }
    else {
      // ...
    }
  });
}));
```

### 2\. Standalone file

If the image is more like a photo and Base64 or SVG conversion would not be rational, you ought to have it as a separate file placed on a server. Of course you should cache it as a critical resource when `install` event occurs and then it can be served like a typical resource:

```javascript
event.respondWith(caches.match(request).then(response => {
  return response // cache-first
  || fetch(request).then(response => { // network
    // ...
  })
  .catch(() => { // offline
    if(type.startsWith('image')) {
      return caches.match('/offline.jpg');
    }
    else {
      // ...
    }
  });
}));
```

## Garbage in cache is your problem

It’s a sign of a really bad UX if your users are disturbed with error messages about exceeded [memory quota](http://stackoverflow.com/questions/35242869/what-is-the-storage-limit-for-a-service-worker). Therefore it’s us who have to take care of the contents of cache, because browsers have no mechanisms for deciding whether the particular resources should be deleted or not.

### Versioning

And so here the resource versioning kicks in. It begins by defining a version number or a key that will be used for caching new and deleting the old stuff. Instead of putting everything into a single place we will distribute different resource types across their own cache “rooms”:

```javascript
const version            = '1-',
      criticalsCacheName = `${version}critical`,
      otherCacheName     = `${version}other`,
      imagesCacheName    = `${version}images`;
```

Remember the `addToCache` function we used under the `fetch` event? Let’s improve it by making it to accept an additional parameter – cache room name:

```javascript
const addToCache = (cacheName, request, response) => {
  caches.open(cacheName).then(cache => cache.put(request, response));
};
```

The version number should be incremented along with every website update. Well, maybe not always “with every” – this depends on your Service Worker strategy. So with every increment pushed a new cache party is created in the browser. Resources are grouped by version numbers like this:

```javascript
'1-critical': [
  '/',
  '/about/',
  '/offline/',
  // ...
],
'2-critical': [
  '/',
  '/about/',
  '/offline/',
  // ...
],
//...
```

In order to keep the cache lean, we should aways delete groups from previous lifecycles of the worker. Let’s take an advantage of the `activate` event and clean up the old stuff:

```javascript
const clearOldCaches = () => {
  return caches.keys().then(keys => {
    return Promise.all(keys.filter(key => !key.startsWith(version)).map(key => caches.delete(key)));
  });
};

self.addEventListener('activate', event => {
  event.waitUntil(clearOldCaches().then(() => self.clients.claim()));
});
```

In our case, having the current version key equal to `2-critical` will delete the `1-critical` as the condition `!key.startsWith(version)` is fulfilled: `!'1-critical'.startsWith('2-')`.

### Additional cache control

As I mentioned previously, this event is fired only once in a worker’s lifecycle. The worker can live a long life therefore there is an increased chance the cache size may get exceed. A really good mechanism for wiping the dust was suggested by [Jeremy Keith](https://adactio.com/journal/9888). We can kinda create a custom event and send a trigger-like signal from the website to our Service Worker. An additional code next to worker’s file registration:

```javascript
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceworker.js');
  if(navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({'command': 'trimCache'});
  }
}
```

The _message_ will be posted on every page visit – we can _catch_ it and react accordingly, i.e. leave only a particular amount of resources by deleting the rest of them.

```javascript
const trimCache = (cacheName, maxItems) => {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if(keys.length > maxItems)
          cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
    });
  });
};

self.addEventListener('message', event => {
  if(event.data.command == 'trimCache') {
    trimCache(otherCacheName, 50);
    trimCache(imagesCacheName, 25);
  }
});
```

We’re not just keeping the cache size sane, but also ensuring we have the critical resources available since we do not apply trimming for `criticalResources` room.

Since we’re separating our cache into several rooms, it’s important to make sure the resources go where they are supposed to. Here’s an improvement on how we cache things under `fetch` event:

```javascript
if(criticalResources.includes(url.pathname))
  addToCache(criticalsCacheName, request, responseCopy);
else if(type.startsWith('image'))
  addToCache(imagesCacheName, request, responseCopy);
else
  addToCache(otherCacheName, request, responseCopy);
```

### Omitting thrid-party resources

Websites usually contain various thrid-party resources like JS, CSS, image files, etc. Combine those kilobytes throughout the entire site and you may find yourself trying put an elephant into a canary’s cage. Therefore omitting those resources by default and having a list of exceptions if needed is a good practice:

```javascript
var thirdPartyExceptions = [
      'https://code.jquery.com/jquery.min.js'
    ];

// ...

event.respondWith(fetch(request).then(response => { // network
  // cache only resources from this domain as well as the exceptions
  if(location.origin === url.origin || thirdPartyExceptions.includes(url.href)) {
    // addToCache use
  }
  return response;
}))

// ...
```

`location` is a global variable associated with the worker. With the code above we only allow resources from the server the website is hosted at as well as the exceptions.

### Forcing serviceworker.js file renewal

Remember when I mentioned that the browser tries to redownload serviceworker.js file on every page request made by the user? Well, that’s the theory. But in practice serviceworker.js file updates does not necessarily always have an instant reflection in the browser. Consequently, a chance exists that some of your users will see the outdated content even if there’s fresh stuff available. In order to overcome this and have a new Service Worker lifecycle started as soon as the file is updated, I added a server-level configuration targeted to `serviceworker.js` file which tells the browser and the computer do not ever cache this file.

Apache way:

```bash
<Files serviceworker.js>
  FileETag None
  Header unset ETag
  Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires "Wed, 11 Jan 1984 05:00:00 GMT"
</Files>
```

Nginx way:

```bash
server {
  location ~* (serviceworker\.js)$ {
    add_header 'Cache-Control' 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
    expires off;
    proxy_no_cache 1;
  }
}
```

## Service Worker and DOM

Service Worker does not have a direct access to DOM at all, which means manipulating it is not possible. No `window` nor `document` variables are present, meanwhile globally available `self` variable points to `WorkerGlobalScope`, not `Window` like we are used to.

Anyway, just like we have proved before, we can still make a website and a Service Worker to communicate directly. `postMessage` does this in _“to Service Worker”_ direction and looks like it is also [possible](http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.WRnuDFKB2Rs) to do it in _“to website”_ direction as well.

## Service Worker for multilingual website

Obviously, you may want to enrich the initial cache with more than just one language:

```javascript
const criticalResources = [
        '/sv/',
        '/en/',
        '/sv/offline/',
        '/en/offline/',
      ],
      otherResources = [
        '/sv/projekt/',
        '/sv/om/',
        '/sv/kollegor/',
        '/sv/blogg/',
        '/en/work/',
        '/en/about/',
        '/en/colleagues/',
        '/en/blog/',
      ];
```

But the _gotcha_ lies behind the “offline” page: wouldn’t it be nice to have an “offline” page enabled for each language?

```javascript
const appLangs = ['en', 'sv'],
      url      = new URL(event.request.url);

event.respondWith(
  fetch(event.request).then(response => {
    // ...
    return response;
  })
  .catch(function() {
    let lang = url.pathname.substr(1, 2);
    lang = appLangs.includes(lang) ? lang : appLangs[0];
    return caches.match(`/${lang}/offline/`);
  })
);
```

Before serving the “offline” page the code above checks the first two characters of URL of the requested resource for a language code. It also verifies if this code is available in the languages list otherwise it picks the first entry from the list which is treated as a default.

You may adapt this accordingly to your multilingual URL strategy. My example relies on what we have here at Kollegorna: all of the page addresses start with language code.

## Service Worker is backend-dependent

In one of the previous sections of the article we realized the importance of versioning. The method of updating a value for `version` variable depends on your backend system and Service Worker strategy. If you are not looking to automate everything or got a simple static website that does not rely on a CMS, you may just edit Service Worker file manually and increment the variable’s value or enter something random when updating the site.

The real fun begins if you prefer to have everything fully automated. For example, you’ve got a Wordpress based website and gone the offline-first approach way. In order to get the version number incremented on content updates you can write a custom hook function called when inserting or updating a post:

```javascript
function update_sw_version() {
  // writes serviceworker.js file with a new value for "version" variable
}
add_action('save_post', 'update_sw_version');
```

We have enabled automated Service Workers on Trellis (Wordpress LEMP stack) and Middleman (static site generator) based sites, but I will elaborate on this in my future articles.

## Debugging Service Worker

I found Chrome DevTools to be a very handy tool for debugging Service Workers. It has this nice _Network Throttling_ feature which makes it easy to simulate offline experience:

![Chrome DevTools: Network Throttling](/posts/images/service-worker-gotchas/devtools-network-throttling.jpg)

Debugging worker might be tricky sometimes, because you first have to unregister the current worker before testing the updated code, otherwise you’ll find yourself doing a Sisyphus work – investigating the old code. In Chrome you can unregister the worker manually via `DevTools → Application → Service Workers`:

![Chrome DevTools: Service Workers](/posts/images/service-worker-gotchas/devtools-service-workers.jpg)

In some cases I find `Clear Storage` to work better for me as it completely wipes out all the cached stuff and I am always served with the latest one when debugging:

![Chrome DevTools: Clear Storage](/posts/images/service-worker-gotchas/devtools-clear-storage.jpg)

Since Service Worker is a relatively new technology it could not do without alteration on interpreting various rules and directives. Therefore always be sure to test your worker on the future browser releases like [Chrome Canary](https://www.google.com/chrome/browser/canary.html) or [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/).

Once you have your worker up and running, you can reasonably hope for 100/100 score on Chrome’s website performance evaluation tool – [Lighthouse](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&cad=rja&uact=8&ved=0ahUKEwit69ai4orUAhXC2CwKHXVXBMgQFggvMAA&url=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Flighthouse%2Fblipmdconlkpinefehnmjammfjpmpbjk%3Fhl%3Den&usg=AFQjCNFvomjeSTNsyil51bzJfvzQWOp_lA&sig2=Zo4u5jzNkdhXR0pkoXNiHg):

![Chrome Lighthouse Score](/posts/images/service-worker-gotchas/chrome-lighthouse-score.jpg)

* * *

Let me end up the article with an advice: don’t ever take Service Worker code advices for granted. Always test them, because adaptations are very individual and what worked for one doesn’t automatically mean it will work for you.

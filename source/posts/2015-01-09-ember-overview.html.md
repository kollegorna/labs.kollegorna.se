---
title: "Our experience with Ember"
date: 2015-01-09 00:00 UTC
author: filippos
disable_comments: false
---

Our last project was built in Rails and Ember. Rails was acting mostly as an API while Ember was taking care of the whole user experience and some data manipulation. All in all it was a great experience. We summarize some of the stuff we crossed while building a whole web app in Ember.

Ember limitations that we wish were fixed:

* Handlebars expressions are way too simple. But again maybe it's a reason for that given that controllers in Ember can be model decorators. Also, in handlebars you can't have a controller method which, for instance, returns a text to be rendered given some input. For that you have to create a helper which is well.. not very helpful.
* Some [simple stuff is way too difficult](http://stackoverflow.com/questions/9405449/style-attribute-with-emberjs) in Ember using Handlebars. **Fortunately HtmlBars will [solve](http://colintoh.com/blog/htmlbars) many of those issues yay!**
* Components don't have access to store. Again, there might be a good reason for that, although it's more complicated to setup a component if you don't pass in (or inject through an initializer) the store. Actually at first I was like "WTF ember community we obviously need store inside components"  but as time passed I also started believing that components shouldn't include a store and should't even get the store by injection. A truly isolated component let's the parent controller take care of the bubbled actions. Hmm I am not sure if that applies in nested components too, hopefully we haven't experienced such a complex case, yet ;P
* Ember documentation could be better, especially on best practices and advanced tricks (although it gets better and better). Also, I feel that the app that documentation builds ([todoMVC](http://emberjs.com/guides/getting-started/planning-the-application/)) is not a good case to show the power and development ease of Ember. **Ember thrives in large scale apps**.
* Ember forces you to access object attributes only by ember getters ( `object.get('attribute')` ) and set object attributes using the equivalent `.set` method. The reason for that is twofold: first, setters notifies any computed properties or observers on the object, secondly both methods act on the proxy object and not on the immediate object (although some attributes could be found on the immediate object and thus object.attribute could work). This leads to more verbosity to an already verbosed language.
* We had some problems when using tokens as ids in a resource. Eventually it was solved, but I guarantee you it wasn't easy.
* Ember doesn't officially have Handlebars helpers for radio buttons. Gah! We had to create our own radio buttons (which unsurprisingly are almost the [same](https://gist.github.com/vasilakisfil/d055d9d2d9b56f684b42) as the currently [most popular radio-buttons ember-cli plugin](https://www.npmjs.com/package/ember-radio-button))
* There is one thing that really annoyed me in Ember. The each helper. But sometimes I loved it too (actually I was forced to, mostly because it was my last/only option). It's like you have love and hate relationship with this thing. In the good times it will save you with all the mess to setup a new template/controller/route etc but in it's bad times it will frustrate you the least. For instance, one thing that comes to my mind now is that at some point I desperately wanted to access the siblings of a controller rendered through each loop. That's impossible, the only way to do this is to access the parent controller, and through that, access all the child controllers generated in the each loop. It's like going to New York from London through Stockholm. Helpful article on some hidden features of each helper: [http://ember.guru/2014/hidden-features-of-the-each-aka-loopedy-loop-helper](http://ember.guru/2014/hidden-features-of-the-each-aka-loopedy-loop-helper)
* Ember-data has some limitations. For instance, you have to explicitly define in the application adapter if a resource found in a relationship will be accessed, application-wide, as embedded or using a separate request (previously, you defined that in the model). Ideally this should't be defined anywhere. Ideally, everything should be possible to be accessed either embedded or separately. Ideally I would like to override the default access method (separately) in a Route if I want to (for performance or any other reason). Unfortunately we are far from the ideal both in front-end (Ember) and back-end (in our case Rails).
* Controllers are singletons. **Controllers are singletons**.  It can lead to funny but also frustrating bugs if you miss that in Ember. There is some discussion to shift this limitation in Ember community.
* In combination with the previous point, I was feeling like an idiot every time I had to explicitly reset the controller after a form submission or something relevant.
* Ember adds some latency in the UI. To understand what kind of latency I am talking about take a look on the official [ember addons website](http://www.emberaddons.com/). That makes sense if you think that Ember talks to an API for every resource it needs though the chatty HTTP(S) instead of having a (possibly Rails) controller render all data needed straight to the body of the user's initial HTTP request. Also, probably you should expect more load in the backend using Ember since it sends a ton of requests. Embedded associations could mitigate this problem.
* It's not easy to run common JS code after a nested template is rendered or when everything is rendered. Our solution was to use an ember view for that and add the code in the didInsertElement hook. However, it's definitely not the optimal solution, especially if you want to run something in many templates. Adding the code in the top level template (using a view as described above) wouldn't work in the child templates if you switch a child route, while adding the code in a child template wouldn't work in the rest application (especially if this child template appears only after a user event). Still looking for a better solution.
* Ember forces you to use a flat API. For instance, if you have users and each user has assets, meaning that each asset belongs to a user, you could structure your assets API like `/users/{user_id}/assets/` and `/users/{user_id}/assets/{asset_id}`. Instead, in Ember, you will have to retrieve the assets of each user in the `/assets/` endpoint by specifying the `user_id` as a param.

And some tips:

* EmberJS and jQuery events is a big **NO NO**. Everytime I saw or heard that such jQuery code was added in the project by our front-end developers (not yet accustomed to [Ember Views events](http://emberjs.com/api/classes/Ember.View.html#toc_event-names)) I would quietly transform it to Ember code using [Ember Views events](http://emberjs.com/api/classes/Ember.View.html#toc_event-names). Same goes for Ember components, which include by default Ember View events. Using jQuery for DOM manipulation is OK though.
* There is some confusion on ember-cli plugins and bower plugins. What goes where. But I think, as ember and ember-cli matures, ember-cli plugins is the way to go for ember specific plugins.
* Try to use Ember objects, when possible, for objects that will be used in the templates. You get for free many stuff like computed properties, observers etc.
* If things get wild in ember-side, shift some work load from the front-end to the backend and do the hard work there, just before serving your data to Ember.
* Using `needs` attribute in an ember controller you can access another controller. How can you take advantage of it? You can create controllers that act as service objects or helpers and call them from any controller you `need` them. There is some discussion in Ember community to generalize this idea.
* Always transition inside the promise. For instance (taken from a previous project):

```javascript
    this.get('model').save().then(function() {
      _this.transitionToRoute('someModel.index');
    });
```
This lets Ember to push the actual changes of the object in the store _before_ you transition to the index route of your model. If you transition immediately, the model won't have the updated attributes (returned from the backend) in the index route.

* When talking to ember-data, consider everything as a promise
* Minimize code in `beforeModel`, `afterModel`, `model` hooks.. not only everything stalls inside there if an error occurs but you also don't get ANY error messages in the console from ember :(
* RESTAdapter expects a body in any request, even on DELETE. It makes sense, you return the deleted resource.
* **be patient**, Ember has a steep learning curve

Don't take us wrong. Ember is a _great_ platform, if not the best, to build sophisticated web apps. It allows you to scale your app development to many pages and views in zero time compared to other platforms like Rails. It forces convention over configuration paradigm which greatly boosts development in a team. It completely separates front-end development and back-end development. It also lets you have an API out of the box which could be useful if you are thinking extending your market on mobile platforms too. Also, from our experience, once you create a good backend API you will rarely have to write any more code in it (unless, of course, if you need to extend your API, add more features etc). Another element that we liked in Ember is that it has model decorators (ember controllers) _by design_. I wish Rails had the same for the views _by design_ and not using external gems.

We feel Ember separates the front-end development from the backend in a very
smooth way. Soon, it will become (if it's not already!) our next development
platform for high quality apps.


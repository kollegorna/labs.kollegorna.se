---
title: Rendering Ember components from Rails
date: 2017-01-23 00:00:00 UTC
author: filippos
disable_comments: false
---

In kollegorna we have been working with Ember _a lot_. Usually we have Rails as a backend serving APIs and treat Ember as a separate project, in its own repo. When deploying Ember, we usually deploy Ember in a separate heroku instance as well although leting Rails do the deployement of Ember app through redis is also possible.

However, what other options do we have with Ember? Can we have Ember only in a part of our app? Or even is it possible to let Rails **render only specific Ember components** ?

As we will see both are possible and easy using [ember-cli-rails](https://github.com/thoughtbot/ember-cli-rails) and [ember-islands](https://github.com/mitchlloyd/ember-islands).

### Option 1: Ember being the sole frontend of your Rails app

This option is when you want to go all-Ember in your front-end. To achieve that you need to install [ember-cli-rails](https://github.com/thoughtbot/ember-cli-rails) and follow the installation in the Readme. Basically you need to do the following:

* create an ember app inside rails app: `ember new frontend --skip-git`
*  Make Ember app to use pods by adding in `config/environment.js`:
`podModulePrefix: 'frontend/pods'`. Actually this is optional but pods offer greater flexibility.
* Add a hello world inside `frontend/app/pods/application/template.hbs`. We use the pods structure so parent dirs need to be created if not there.

Now if you go inside the `frontend` directory and start ember app you should see the hello world text (run `node_modles/ember-cli/bin/ember s` or just `ember s` if you have it globally installed). If this doesn't work it means you have something wrong on the ember side.

Note that you can now start working on Ember like you would in any other Ember project. If Rails API endpoints are need it to run while working on Ember, instead of having 2 separate processes (`bundle exec rails s` and `node_modles/ember-cli/bin/ember s`) and specify on the ember app the server API url/host/namespace, you can pack your ember app in your rails app (hot reloading is supported!):

* Run: `rails generate ember:init`
* Install ember addon: `ember install ember-cli-rails-addon` (inside the `frontend/` dir)
* Mount Ember app to a route in rails: `mount_ember_app :frontend, to: "/"`
* Install ember dependencies on Rails: `bundle exec rake ember:install`

Tada! Now you should be able to run just rails server (`bundle exec rails s`) and see your ember app live.

### Option 2: Use Ember app(s) in some part(s) of your Rails app
If you already have your Rails views but you want a part of it (say that you develop a `/dashboard`) to be in Ember then you can follow the same steps as in option 1, only that we need to tell Rails to mount Ember in a different location:

* `mount_ember_app :frontend, to: "/dashboard"`

However there are 2 things that you need to configure in the Ember side:
* set `rootURL: '/dashboard'` in ember config file
* set `locationType: 'none'` also in ember config file


I like the approach of [ember-cli-rails](https://github.com/thoughtbot/ember-cli-rails) as it allows the front-end team to work independently from the backend team. **Front-end team can design and implement the app routes, the flow, the html/css/js code independently from the backend team and vice versa.** When it makes sense both work usind the Rails server which using [ember-cli-rails](https://github.com/thoughtbot/ember-cli-rails) packs and serves both codebases in a single one. Note that **you can mount as many ember apps as you want in the same way**.

### Option 3: Rendering Ember components from the Rails views
[Ember-islands](https://github.com/mitchlloyd/ember-islands) takes it on step further by allowing you to render specific components only. For instance we might don't want to render the whole dashboard page in ember but instead only a couple components that are very dynamic in nature (and using jquery would result in spaggetti code). To achieve that we need to do a couple more things.

First we can now remove the ember mounted app from routes since we will render server-side code which will start ember manually. We need to tell Rails to include all the ember js files in views:

* Add `mount_ember_assets :frontend, to: "/"` inside routes. Note that we now mount only assets.
* Add `<%= include_ember_script_tags :frontend, prepend: "/" %>` and `<%= include_ember_stylesheet_tags :frontend, prepend: "/" %>` in the head section of application layout (or anywhere else you want to have Ember components)

Then we can continue:

* In Ember config set `locationType` to `none` and set `rootUrl` to root again (`'/'`)
* Install ember-islands in frontend ember app:  `ember install ember-islands`
* Add `{{ember-islands}}` in application template. This handles the manual ember initialization.
* Install new ember dependencies on Rails: `bundle exec rake ember:install` (you should run this everytime you change an Ember dependency)

Go and create the template of a single component that we will use, named `user-profile` under `frontend/app/pods/components/user-profile/template.hbs`. The component is supposed to get `name` and `id` of the user and display them. Here is an example template:

```handlebars
<h3> User Profile </h3>

{{name}} ({{id}})
```

Now in any view we can render it:

```html
<h1> Dashboard </h1>
<div
  data-component='user-profile'
  data-attrs='{"name": "Sally User", "id": "4"}'>
</div>
```

Fire up rails server and check your `/dashboard` url. You should see the html generated by the ember component. If you render such components quite oftenly, you can use a Rails helper for that:

```ruby
  def ember_component(tag, name, attrs = {})
    content_tag(tag, '', data: {component: name, attrs: attrs.to_json})
  end
```

So our view becomes more beautiful:

```erb
<h1> Dashboard </h1>
<%= ember_component(:div, 'user-profile', {name: 'Sally User', id: 4}) %>
```

We have to watch out what you pass in Ember through the `data-attrs` and authorize only the allowed attributes (like we would in a regular API). Personally, on models (or any Ruby object) I use an `.as_ember_json` method which I filter *a lot* before passing the model to a component.

I have created an [example app](https://github.com/kollegorna/rails-ember-islands) (forked from [rails tutorial app](https://bitbucket.org/railstutorial/sample_app_4th_ed)) in which I added a new route for users index, only this time I render the users using Ember components.

Can you spot the difference?

* [https://rails-ember-islands.herokuapp.com/users](https://rails-ember-islands.herokuapp.com/users)
* [https://rails-ember-islands.herokuapp.com/ember_users](https://rails-ember-islands.herokuapp.com/ember_users)

**Note that [Ember-islands](https://github.com/mitchlloyd/ember-islands) is backend-agnostic and you can use it with any backend framework (Phoenix, Spring Boot, Laravel etc).**

Have fun!




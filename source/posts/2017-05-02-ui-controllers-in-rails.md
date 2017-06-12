---
title: "UI controllers in Rails"
date: 2017-05-02 00:00 UTC
author: filippos
disable_comments: false
---

In Rails there have been many times that in your template you might have multiple separate forms and action buttons, usually using remote forms
to avoid full-page reload.

For instance think about a User profile that has remote forms for editing the user basic details (like first name etc),
a buttons to subscribe to newsletter, a button that requests password change (it uses an email flow instead of allowing you to set them instantly),
a Facebook connect button and many more, and many more, all under the `profile/show.erb` template.

Given that that there are so many actions in the same template, you have 2 options to handle them in the backend:

## Options 1: Create new methods on the same controller
The first option is something that I always felt it's a quick dirty hack.
Basically you add custom routes on your `profile` and map them to meaningful actions.
So for instance, to subscribe to a newsletter you would have:

```ruby
class ProfilesController < ApplicationController
  def newsletter_subscribe
    #update user's newsletter and return js that updates checkbox
  end

  def newsletter_unsubscribe
    #update user's newsletter and return js that updates checkbox
  end
end
```

## Options 2: Create new separate controllers
The second option is to basically create a new controller for each "component" of your UI.
Although profile update action could go straight to the `ProfilesController`, for the rest you will create a separate controller.
So for instance, to subscribe to a newsletter you would have a remote form talking to `NewslettersController`:

```ruby
class NewslettersController < ApplicationController
  def create
    #update user's newsletter and return js that updates checkbox
  end

  def destroy
    #update user's newsletter and return js that updates checkbox
  end
end
```

But to be honest this is something that I never liked either: create a brand new controller (+ controller file, template etc)
just for toggling a checkbox button ? Too much hassle.
What happens in the case when by clicking a master subscription checkbox you get 3 nested checkbox buttons for specific subscriptions?
That would mean creating manually 3 new controllers...


## Nested UI controllers (Rails' missing option 3)
The idea is that we use a tiny DSL inside our controller to create and nest UI-related controller, using a more resty approach:

```ruby
class ProfilesController < ApplicationController
  controller(:password) {
    def reset
      #fire an email and add a new flash to inform user
    end
  }

  controller(:subscriptions) {
    def create
      #update user's master newsletter and return js that updates checkbox
    end

    def destroy
      #update user's master newsletter and return js that updates checkbox
    end

    controller(:interests) {
      def create
        #update user's newsletter segments and return js that updates checkbox
      end

      def destroy
        #update user's newsletter segments and return js that updates checkbox
      end
    }
  }

  controller(:facebook_connect) {
    def callback
      #handle fb connect
    end

    def redirect
      #redirect to fb login
    end

    def destroy
      #remove fb connect
    end
  }
end
```

We would also want:

1. have the views of the nested controllers again nested under the parent (in our case under `app/views/profiles/`)
2. be able to reference a partial or a nested controlers' view using `nester_controller/partial` instead of `profiles/nested_controllers/partial`
3. have the paths of locales of the nested controllers again nested under the parent.
For instance when we write the code `<%= t('.subscription_description') %>` in `app/views/profiles/subscriptions/_partial` template,
rails should search under `en.profiles.subscriptions.partial` for locales.
4. Inherit the callbacks of the parent controller _by default_. I know that this sounds weird but remember that these controllers are
under the same UI of the parent controller so for the usual use case we don't need to repeat ourselves.


Well after some research and metaprogramming magic this is possible.
I have added some comments in order to help you figure out what is going on.

``` ruby
module NestedControllers
  CALLBACKS_OPTS = [:filter, :if, :unless, :kind].freeze

  #adds the relative paths to controller so you can do `render 'subcontroller/something'`
  #instead of `render 'parent_controller/subcontroller/something'`
  #(solves 2)
  def self.extended(base)
    base.prepend_view_path("app/views/#{base.controller_path}/")
  end

  #creates a nested controller `{self}::{Name}Controller` that inherits from
  #the controller that `self` inherits
  def controller(name, options = {}, &block)
    #save the code to an anonymized module
    extended_m = Module.new

    #create a new class that inherits parent and extends current module to support recursiveness
    extended_superklass = Class.new(self.superclass).send(:extend, NestedControllers)

    #create a new class that inherits the previously created class and sets that as a constant under parent controller
    #ONLY THEN do we apply the developer's code in order to give
    #the option to the developer to override any method defined by us or the parent controller
    klass = self.const_set(
      "#{name.to_s.camelize}Controller",
      Class.new(extended_superklass, &block).send(:extend, extended_m)
    )

    #figure out the controller path
    begin
      name_path = self.controller_name
    rescue NoMethodError
      #if we get NoMethodError, this  means that Rails hasn't set the class constant yet (like `ProfilesController::SubscriptionsController`)
      #it happens when we have > 2 leves of nesting and we need to help Rails by passing a `controller_path` in options
      name_path = nil
      if options[:controller_path].nil?
        raise 'You need to set a `controller_path` option in when nesting more than once'
      end
    end

    #set the controller path (makes it easier to work with forms)
    klass.send(:define_singleton_method, :controller_path) do
      "#{(name_path || options[:controller_path])}/#{name.to_s}"
    end

    #set the views path (solves 1)
    klass.prepend_view_path("app/views/#{(name_path || options[:controller_path])}/")

    #add the parent's filters (solves 4)
    unless options[:exclude_filters]
      _inject_callbacks(klass)
    end
  end

  #adds the {before|after}_filters defined in `self`, in `klass`
  #(but not the filters from `self`'s ancestors since these run anyway because
  #`klass` also inherits the same ancestors
  #internally all callbacks in Rails are saved as `before` of `after`
  def _inject_callbacks(klass)
    callbacks_array = _process_action_callbacks.to_a.map{|c|
      if superclass._process_action_callbacks.to_a.map{|s_c|
          s_c.send(:instance_variable_get, "@filter")
      }.include?(c.send(:instance_variable_get, "@filter"))
        next
      end

      CALLBACKS_OPTS.inject({}){|memo, k|
        memo[k] = c.send(:instance_variable_get, "@#{k}")
        memo
      }
    }.compact

    callbacks_array.each do |callback|
      if callback[:filter].is_a? Symbol
        klass.send("#{callback[:kind]}_action", callback[:filter], {
          if: callback[:if], unless: callback[:unless]
        })
      else
        klass.send("#{callback[:kind]}_action", callback[:filter], {
          if: callback[:if], unless: callback[:unless]
        }) do
          klass.instance_exec(&callback[:filter])
        end
      end
    end
  end

end
```

The code _should be_ self explained due to comments. If not let me know I would happy to help out :)

Probably (if you read the code!) you will have noticed that we solved (1) (2) and (4) but not (3).
Unfortunately I didn't find any easy way to fix (3). The truth is that it _should_ be possible using custom Resolvers but
didn't invest much time to it because it seemed way to complex to configure this little thingie.
Instead, I found out that you can manually set the virtual path of a template by editing the instance variable `@instance_path`.

```erb
<%= @vritual_path = 'profiles/subcription/something %>
```

You can also use a helper method in `ApplicationHelpers`:
```ruby
 def set_virtual_path
   proc{|path|
     @virtual_path = path.split('/views/').last.split('.').first
   }
 end
```

```erb
<%= set_virtual_path(__FILE__) %>
```

However I am suspecting that this needs to be cached otherwise it will always touch the filesystem.


BUT we haven't quite finished yet: Although we have controllers like `ProfilesController::SubscriptionsController` etc we need to fix the routes as well:

```ruby
  resource :profile, only: [:show] do
    resource :subscriptions, only: [:update, :destroy], controller: 'profiles_controller/subscriptions'
    resource :password, only: [], controller: 'settings_controller/username' do
      post :reset
    end
    resource :facebook_connect, only: [:create, :destroy], controller: 'settings_controller/facebook_connect' do
      get :callback
      get :redirect
      delete :destroy
    end
    resource :subscriptions, only: [:create, :destroy], controller: 'settings_controller/subscriptions' do
      resource :interests, only: [:create, :destroy], controller: 'settings_controller/subscriptions_controller/interests'
    end
  end
```

While this works, what I would like to remove the need of specifying the (ugly to be honest) controller because the
controller name can obviously figured out by the resource name and the parent resource name.

An API we can use is the following:

```ruby
  resource :profile, only: [:show] do
    resource :subscriptions, only: [:update, :destroy], nested: true
    resource :password, only: [], nested: true do
      post :reset
    end
    resource :facebook_connect, only: [:create, :destroy], nested: true do
      get :callback
      get :redirect
      delete :destroy
    end
    resource :subscriptions, only: [:create, :destroy], nested: true do
      resource :interests, only: [:create, :destroy], nested: true
    end
  end
```

but that would mean that we need to touch the default `resource` and `resources` method of `ActionDispatch::Routing::Mapper::Resources` which is a bad practice.

Instead we should create a new method that modified the params to be passed down to the `resource` and `resources`:

```ruby
  resource :profile, only: [:show] do
    #prepend module to use `nested: true` dsl
    nested_resource :subscriptions, only: [:update, :destroy]
    nested_resource :password, only: [] do
      post :reset
    end
    nested_resource :facebook_connect, only: [:create, :destroy] do
      get :callback
      get :redirect
      delete :destroy
    end
    nested_resource :subscriptions, only: [:create, :destroy] do
      nested_resource :interests, only: [:create, :destroy]
    end
  end
```

The implementation is quite simple, if you know what to look for :P

```ruby
module ActionDispatch::Routing::Mapper::Resources
  def _parent_resource
    self.send(
      :instance_variable_get, '@scope'
    ).send(
      :instance_variable_get, '@parent'
    ).send(
      :instance_variable_get, '@hash'
    )[:scope_level_resource].controller
  end

  def nested_resource(*resource, &block)
    if resource.last[:controller].nil?
      resource.last[:controller] = _parent_resource
    end

    resource(*resource, &block)
  end

  def nested_resources(*resource, &block)
    if resource.last[:controller].nil?
      resource.last[:controller] = _parent_resource
    end

    resources(*resource, &block)
  end
end
```

And we are done!

(now wait for the infamous WTFs from your colleagues)

![WTF funny](https://c1.staticflickr.com/3/2203/2245445147_ff54c5997d.jpg)

---
title: Things I learned developing Ruby and Rails apps over the past 3+ years
date: 2017-01-30 00:00:00 UTC
author: filippos
disable_comments: false
---

In random order:

### Use `rescue_from` in top level controller
Using `rescue_from` in the root controller is very helpful for catching any exception happening
below.
Given that in web apps, most code runs in a request/response cycle this becomes even more helpful
Let's say that you build a simple API. By using `rescue_from` you can explicitly
specify what the app should do when a record is not found (AR throws `ActiveRecord::RecordNotFound`)

```ruby
  rescue_from ActiveRecord::RecordNotFound do
    api_error(status: 404, errors: 'Resource not found!')
  end
```

### Use load\_resource on controllers
Another pattern I have adopted after seeing a former colleague using it:
instead of fetching the necessary resource inside the controller method, use a
common controller filter and fetch it there depending on the action.

```ruby
class UsersController
  before_action :load_resource

  def index
    # do something with @users
  end

  def show
    # do something with @user
  end

  def create
    # do something with @user
  end

  def update
    # do something with @user
  end

  def destroy
    # do something with @user
  end

  private
    def load_resource
      case params[:action].to_sym
      when :index
        @users = paginate(apply_filters(User.all, params))
      when :create
        @user = User.new(create_params)
      when :show, :update, :destroy
        @user = User.find(params[:id])
      end
    end
end
```

Also related and more advanced is [decent_exposure](https://github.com/hashrocket/decent_exposure) although
I haven't had the chance to use it myself yet.

### Use comments when applicable
I kind of disagree with the saying that the "good quality code is always self-explained"
for 2 main reasons:

* Good quality code for one developer could be bad quality for another developer
(and this is not necessarily bad, everyone has their own style)
* We have all in situations where, due to time and/or budget constraints, you end up making a quick fix just to close an issue
because the best (and most self-explanatory) solution would have required 10 times the effort.

For those reasons, comment your code smells and don't be ashamed :)

### Use decorators and presenters
There was a saying in Rails community awhile ago: keep your controllers skinny by making your models fat.
While I agree with the first part, I disagree with the second :)
I think that models should be as skinny as possible, that is, don't add computed
properties to a model that are used only in a special cases.
Use a wrapper class for that case (hey! it's called Decorator!) and expose only the methods that are needed.

A presenter is like a decorator, only that it takes multiple models.

### Namespace your workers under your model, call them on after_commit
Let's say that we have a model, `User`.
90% of the background jobs related to a model are taking place when the model is created, updated or deleted,
because this is when data change.
This leads to 3 generic workers: `User::CreateWorker`, `User::UpdateWorker`, `User::DestroyWorker`.
Try to use those workers, if applicable, in combination with AR callbacks and `previous_changes`.
Call a worker on `after_commit`. See [here](http://rails-bestpractices.com/posts/2012/05/02/use-after_commit/) an explanation of why.

### Don't use Postgres array unless it's something very simple
Another thing that although cool, my experience has shown me that it will generate more problems than save you time. Every time that I have tried to use Postgres array, for instance to hold some ids, I have banged my head against the table later. After all, tables are not expensive in databases, JOINs are.

I would use Postgres array for very small things:

* When I know that the table will hold a small number of elements and won't get large enough on average (with a small variance on that if possible)
* When the table data doesn't have anything to do with ids and associations

### Postgres JSONB is the cool kid in town
In contrast to my feelings on Postgres arrays, I love Postgres' JSONB. We all love a database
that has schema and we understand their advantages over schemaless databases, but
sometimes you desperately need the simpleness of a schemaless database because you
don't know your schema beforehand. I usually use JSONB in the following cases:

* When I have plenty of small attributes, possibly namespaced by a parent attribute. Using a regular table for this would require a lot of columns.
* When I don't know what exactly I will save or when building a quick prototype
* When I do object hydration: saving the JSON representation of an object in the DB and being able to rebuild it from the same JSON

### aasm is cool until you want to initialize in a specific state
I love aasm gem. I mean, this thing forces you to have a state machine and it
has a very simple DSL for that. Until you want to create an object on a specific
state, other than the initial. Then you get issues: hooks don't run.
Either you do some crazy stuff taking into account the internals of aasm or you just accept
the fact that you will manually traverse to the specified state of the object (you can
create a service for that!)

### Validating email addresses is hard, just use the gem
It's so funny: everytime I search for an email validation regex on the
internet I endup with a different regex. Well, let's just accept that there isn't any
perfect regex and the best thing you can do is to use the gem.

### Try to pass only a single instance variable to the view by employing decorators or presenters
Yes, something that I am not proud of in Rails: it kind of forces you to use instance variables
in order to pass the context from a controller to the view.
I think this is a bad practice. We should always instantiate and pass a single object
to the view. Sandi Metz says so!

### Use an exclamation mark when a model instance method saves the model!
If your model method modifies the object and saves the
changes to the database your method should always end with a bang to denote that.
As simple as that.

### Use strict class APIs: if a method is not supposed to be called from the outside, mark it as private
People tend to forget (including me!). Stricter APIs in the class level
leads to better code quality.

### Don't use devise if you just want a simple authentication
Too much magic, bro.

### Use Virtus for defining attributes in a non-AR model to add strictness
I used (and I still use) Virtus gem a lot.
It allows me to make a simple PORO to look like a _model_ and have some strictness for its
attributes. When the attributes become too many, I tend to use my own DSL for Virtus
so that I can manipulate them, as you can see below:

```ruby
# simple module that allows us to reuse defined attributes in serializers
# plus some other goodies
module VirtusModel
  extend ActiveSupport::Concern

  included do
    include Virtus.model

    if defined?(self::ATTRIBUTES)
      self::ATTRIBUTES.each do |group|
        group[:attrs].each do |attr|
          attribute(attr, group[:type])
        end
      end
    end
  end

  class_methods do
    def all_attributes
      self::ATTRIBUTES.map{|i| i[:attrs]}.flatten
    end
  end
end

# an example model
class Model < ActiveModelSerializers::Model
  ATTRIBUTES = [
    {
      attrs: [
        :id, :name, :header_text, :is_visible, :filtering_control,
        :data_type, :description, :caregory, :calculation
      ],
      type: String
    },
    {
      attrs: [
        :display_index, :min_value, :max_value, :value_type,
        :number_of_forcast_years
    ],
      type: Integer
    },
    {
      attrs: [:category], type: Array
    },
    {
      attrs: [:is_multi_select],
      type: Virtus::Attribute::Boolean
    }
  ].freeze

  include VirtusModel
end
```
Being able to iterate over different attribute types or adding kind of _tags_ in a group
of attributes makes my life easier :)

Now that [attributes API](http://api.rubyonrails.org/classes/ActiveRecord/Attributes/ClassMethods.html) has landed I guess I will do the same, or something similar
with it :)

### Use memoization when something takes time to be computed (like talking to external API)
Goes without saying :)

### Postgres full text search is good enough for simple things
[pg_search](https://github.com/Casecommons/pg_search) is super easy to set up.
However, if you have to optimize Postgres full text search using tvectors, etc,
just go with ElasticSearch. It's not worth it to more time on Postgres.


### It's 2017 and we still can't define what a Service Object is :)
Still looking for a clear definition that most people agree on what a service object is and how they should be implemented :)

In a recent project we followed a pattern that I'd be happy to use again. First
we defined a module which once included creates a _class_ method named `perform`.

Then on any service we create, we mark the constructor (`initialize`) as private,
which means we can ony call the public class method `perform` (of course in
dynamic languages like Ruby we can always call private methods but we just make
it much more difficult).

```ruby
module PerformerService
  def self.included(base)
    base.send(:define_singleton_method, :perform) do |url|
      begin
        return self.send(:new, url).send(:perform)
      rescue Exception => e
        Rails.logger.error("#{self.class}: Exception raised: #{e}")
      end

      return nil
    end
  end
end
```

```ruby
class UrlParser
  include PerformerService
  private
    def initialize(url)
      @url = url
    end
    def perform
      #do all the hard work
    end
end

UrlParser.perform('https://kollegorna.se')
```

### Transform AR error messages the way you want
When building an API in Rails usually the errors will follow the JSONAPI style,
that is, you will get a message (`can't be blank`) and the attribute (`user_id`) that the message fails.

We don't use JSON pointers in this example, but the same idea could apply to that case as well.

On the client side you handle those two the way you want: you could go to your form
and find the `user_id` input to make it red, or you could just concatenate them
and make it one sentence, after some human-friendly transformations, like `User id can't be blank`.

What happens though when the attribute related to the message makes no sense to the user?

Let's say that in our app, each user can create a new post. However it's only possible to
create a new post once a day. So in your model you will enforce uniqueness:

```ruby
validates :user_id, {
  uniqueness: {
    scope: :post_id,
    conditions: -> { where('created_at >= ?', 1.days.ago) },
  }
}
```
(yes, yes, you should enforce the same uniqueness on the DB level as well, but we don't
handle the errors in this case because the user must be super (un)lucky to manage to get
two requests of his own landing on two different servers (of
the same app talking to the same DB) at the exact same time..)

So the message will look like:

```
{
  "title": "Could not process request",
  "message": "Something more descriptive here",
  "errors": [
    {
      "attribute": "user_id",
      "message": "has already been taken"
    }
  ]
}
```


which is not usefull at all to the user. One idea is to use the `message` option:

```ruby
validates :user_id, {
  uniqueness: {
    scope: :post_id,
    conditions: -> { where('created_at >= ?', 1.days.ago) },
  },
  message: 'can only post once a day'
}
```

Now the message will look look like: `['user_id', 'can post only once a day']` which is
better but still not very useful if you use both attributes.

```
{
  "title": "Could not process request",
  "message": "Something more descriptive here",
  "errors": [
    {
      "attribute": "user_id",
      "message": "can only post once a day"
    }
  ]
}
```

Ideally we would like to move the message to the `base` because it's not dependant
on a specific model attribute but instead it's a custom, more general, restriction.
We can do that by adding a custom DSL in the message:

```ruby
validates :user_id, {
  uniqueness: {
    scope: :post_id,
    conditions: -> { where('created_at >= ?', 1.days.ago) },
  },
  message: {
    replace: "user_id",
    with: {
      attribute: "base",
      message: "You can only post once a day"
    }
  }
}
```


```ruby
def replace_errors(errors)
  errors_array = []
  errors.messages.each do |attribute, error|
    error.each do |e|
      if e.is_a?(Hash) && e[:replace]
        errors_array << {
          attribute: e[:with][:attribute],
          message: e[:with][:message]
        }
      else
        array_hash << {attribute: attribute, message: e}
      end
    end
  end

  return errors_array
end
```

So now you get the error you need exactly under the attribute you want:

```
{
  "title": "Could not process request",
  "message": "Something more descriptive here",
  "errors": [
    {
      "attribute": "base",
      "message": "You can only post once a day"
    }
  ]
}
```

### Explicitly use `return` for methods that are executed for their return value, even one-liners
I think the Ruby community has embraced not using return statements but I feel there is
no reason for that. Actually I like to add a `return` statement even in one-liners,
when they should be used for their return values and not for their side effects.

Arguments like about Ruby coolness and expressiveness fall short when it comes to productivity and (kind of) safety.


### Try to use parentheses unless you write some kind of DSL
Same goes here. Adding parentheses doesn't hurt. Instead, they make your collegue (who happens to work with
other languages as well) happier.

### Add strict boolean types in env variables:
I like to use the following snippet in `config/sercrets.yml`:

```ruby
<%
booly_env = ->(value) {
  return false if value.blank?

  return false if (['0', 'f', 'false'].include?(value.to_s.downcase))
  return true if (['0', 't', 'true'].include?(value.to_s.downcase))
  return true
}
%>
```

This will make it easier to deal with boolean env variables in the code since it makes sure that it will either be `true` or `false`.

```yaml
development:
  enable_http_caching:  <%= booly_env[ENV["ENABLE_HTTP_CACHING"] || false] %>
```

### Have a very good reason if using any other DB than Postgres as the primary DB
MongoDB used to be the cool kid in town. People took a while to learn Mongo's shortcomings:

* It's schemaless. You could say it's a feature, but in fact it's a huge drawback.
Databases with a schema, allow you to gradually change
your schema they way you want, providing you the tools and guarantees. For instance,
if I have a column in SQL that is of type Integer, I can transform it in String or Text,
add a default or make it non nullable. This is impossible in schemaless databases. You
need to do this work on your own, in a higher level (using a programming language). Also,
adding an attribute or dropping an attribute is also impossible. Basically you are stuck
with the schema you begun with and you either create a new one from the beginning and you make
sure that you migrate correctly, or you handle these in the application level.
* They don't provide transactions.
* No ACID
* I don't think it's fast enough for less trivial queries

Are you sure that you would like to have those issues in your primary DB? I would not.
Personally, I feel the only killer MongoDB feature is that of embedding many documents
in a parent document. The rest I can probably find them in Postgres (and hey! I will have to
care for security updates for only one DB system)


### Dynamic scope is a cool pattern when nothing else works
When we define a closure in Ruby (a proc or a lambda), it encapsulates its lexical scope/environment.

This means that even if you define a proc at point A in code, if you pass it around and
call it at point B, it will still be able to reference variables and anything that is defined inside
the lexical scope of point A (where it was defined). To put it in another way, it has "closed its environment".

What if we would like to do the opposite? Say we define a proc at point A, that if we call there it makes no sense,
but we want to run it at point B and change the lexical scope of the closure so that what we run is reflected at
point B.

To give you an example:

```ruby
CLOSURE = proc{puts internal_name}
def outside_closure
  proc{puts internal_name}
end

class Foo
  def internal_name
    'foo'
  end

  def closure
    proc{puts internal_name}
  end

  def name1
    closure.call
  end

  def name2
    outside_closure.call
  end

  def name3
    CLOSURE.call
  end

end

puts Foo.new.name1 #=> foo
puts Foo.new.name2 #=> undefined local variable or method `internal_name' for main:Object (NameError)
puts Foo.new.name3 #=> undefined local variable or method `internal_name' for main:Object (NameError)
```

Makes sense that `name2` method failed because `internal_name` had not been defined when we defined the closure.


However, it is possible to redefine the proc's binding (lexical scope) using `instance_exec`:

```ruby
CLOSURE = proc{puts internal_name}
def outside_closure
  proc{puts internal_name}
end

class Foo
  def internal_name
    'foo'
  end

  def closure
    proc{puts internal_name}
  end

  def name1
    closure.call
  end

  def name2
    outside_closure.call
  end

  def name3
    instance_exec(&(CLOSURE))
  end

end

puts Foo.new.name1 #=> foo
puts Foo.new.name2 #=> foo
puts Foo.new.name3 #=> foo
```

Success! This means that we can write code in one part of our app and run it under totally different context. But where could this be useful?
I have been using it in various hacks but one of most useful ones are in Rails routes. This little trick has helped me to
re-map nested routes for free.

Let's say that we have the following route:
```ruby
  namespace :api do
    namespace :v1 do
      resources :company_users, only: [:show] do
        resources :posts, only: [:index] do
          resource :stats, only: [:show]
        end
      end
    end
  end
```

This leads to the following routes:

```
/api/v1/company_users/:id
/api/v1/company_users/:company_user_id/posts
/api/v1/company_users/:company_user_id/posts/:post_id/stats
```

Turns out that `:company_user_id` is kind of useless and we would like to give more flexibility to the client by having the following:

```
/api/v1/stats?user_id=:company_user_id&post_id=:post_id
```

However, the API is already out in production and changes are difficult.


```ruby
  namespace :api do
    namespace :v1 do
      resources :company_users, only: [:show] do
        resources :posts, only: [:index] do
          resource :stats, only: [:show]
        end
      end

      resource :stats, only: [:show], defaults: {company_user_id: proc{params[:company_id]}}
    end
  end
```

Params inside routes?! Yes! Because we will rebind the context of that proc in the context of a controller with the following snippet:
```ruby
  def reshape_hash!
    self.params = HashWithIndifferentAccess.new(params.to_unsafe_h.reshape(self))
  end
```

Now if you send `user_id` to this route, it will be added as `company_user_id`  by adding this method as a `before_filter`

```ruby
class Api::V1::StatsController < ApplicationController
  before_action :authenticate_user!
  before_action :reshape_hash!

  def index
    stats = Stats.new(current_user).all(
      user_id: params[:company_user_id], post_id: params[:post_id]
    )

    render json: stats, serializer: StatsSerializer
  end
```

I have used it in other places too but mostly as a last resort. Use with care!

---
title: "Build an API in your Rails app now!"
date: 2015-04-09 00:00 UTC
author: filippos
disable_comments: false
---

Over the past months we have been building various APIs here in Kollegorna using Rails. Although there has been a lot of fuzz about API frameworks in Ruby community like the sinatra-way and Grape the truth is that I never felt that Rails limits you when building APIs, especially if you have a large one.

Today I will show how you can extend your Rails app and build an API without changing a single line of code from your existing app. We will be using [Michael Hartl's Rails tutorial](https://www.railstutorial.org/) (I actually started learning Rails and subsequently Ruby from that tutorial, I really owe a beer to that guy) which is a classical [Rails app](https://github.com/mhartl/sample_app_3rd_edition) and extend it by building an API for the app.

_Spoiler alert: with the API I built, I went on and created the [same app](https://github.com/vasilakisfil/rails_tutorial_ember) in Ember._

## Adding our first API resource

The first thing we need to do is to separate our API from the rest of the app. In order to do that we will create a new Controller under a different namespace. Given that it's good to have versioned API let's go and create our first controller under `app/controllers/api/v1/`

``` ruby
class Api::V1::BaseController < ApplicationController
end
```

Embracing inheritance, remember that this controller inherits everything that is defined in `ApplicationController`. We can define more stuff here and of course if something we don't like in `ApplicationController`, we can always override it.

We must disable the CSRF token and disable cookies (no set-cookies header in response). Remember that APIs on HTTP are stateless and a session is exactly the opposite of that.

``` ruby
class Api::V1::BaseController < ApplicationController
  protect_from_forgery with: :null_session

  before_action :destroy_session

  def destroy_session
    request.session_options[:skip] = true
  end
end
```

Now let's add our RESTFul resource. By the way, there is a long discussion about what REST means. Is just JSON rest? Or should we call an API REST only if it supported Hypermedia too.

It turns out that the [initial REST definition](http://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) included the constraint of the APIs having hypermedia. However, having hypermedia in the API is not that easy, even the big players (Facebook, Twitter etc) have limited support of hypermedia. One of the main reasons that hypermedia is not easy is caching. When a client requests data from a hypermedia API, the API is supposed to return links for each of the returned resources and methods that are supported (GET, POST etc) fine grained to the client's permissions. How can you cache these links? It's almost impossible.

Yes hypermedia is the future and one day we all wish we build HATEOAS APIs but until they are sustainable, we stay non hypermedia APIs (also called low REST). If you build an API today which is not hypermedia you shouldn't feel guilty about it at all (unless of course you are a big player).

Moving forward, let's add our first resource, let it be a user. But before adding the controller let's add the routes first:

``` ruby
  #api
  namespace :api do
    namespace :v1 do
      resources :users, only: [:index, :create, :show, :update, :destroy]
      resources :microposts, only: [:index, :create, :show, :update, :destroy]
    end
  end
```

All REST routes for each record and only GET method for collections (Rails muddles up collection REST routes with element REST routes in the same controllers).

We will use ActiveModelSerializers for the JSON serialization. Let's create the users API controller and add support for the GET method on a single record:

``` ruby
class Api::V1::UsersController < Api::V1::BaseController
  def show
    user = User.find(params[:id])

    render(json: Api::V1::UserSerializer.new(user).to_json)
  end
end
```

One thing that I like building APIs in Rails is that controllers are super clean. We just request the user from the database and render it in JSON using AMS.

Let's add the user serializer under `app/serializers/api/v1/user_serializer.rb`:

``` ruby
class Api::V1::UserSerializer < Api::V1::BaseSerializer
  attributes :id, :email, :name,  :activated, :admin, :created_at, :updated_at

  has_many :microposts
  has_many :following
  has_many :followers

  def created_at
    object.created_at.in_time_zone.iso8601 if object.created_at
  end

  def updated_at
    object.updated_at.in_time_zone.iso8601 if object.created_at
  end
end
```
If we now request a single user it will also render all microposts, followers and followings (users that the user follows). Usually we don't want that but instead we probably want AMS to render only the ids. In an initializer add:

``` ruby
ActiveModel::Serializer.setup do |config|
  config.embed = :ids
end
```

There is one more thing that needs to be fixed. If a client asks for a user that does not exist in our database, `find` will raise a `ActiveRecord::RecordNotFound` exception and Rails will return a 500 error. But what we actually want here is to return a 404 error. We can catch the exception in the `BaseController` and make rails return 404. Just add in `BaseController`:

``` ruby
  rescue_from ActiveRecord::RecordNotFound, with: :not_found

  def not_found
    return api_error(status: 404, errors: 'Not found')
  end
```

A "Not found" in the body section is enough since the client can figure out the error from the 404 status code.

_Tip: Exceptions in Ruby are quite slow. A faster way is to request the user from the db using find_by and render 404 if find_by returned a nil._

If we now send a request `api/v1/users/101` we get the following json response:

``` http
{
    "user": {
        "id": 101,
        "email": "vasilakisfil@gmail.com",
        "name": "Filippos",
        "activated": true,
        "admin": false,
        "created_at": "2015-04-09T13:21:28Z",
        "updated_at": "2015-04-09T13:21:28Z",
        "micropost_ids": [
            304,
            303
        ],
        "following_ids": [
            1,
            2
        ],
        "follower_ids": []
    }
}
```


## Adding the index method
Now let's add a method to retrieve all users. Rails names that method index, in terms of REST it's a GET method that acts on the `users` collection.

``` ruby
class Api::V1::UsersController < Api::V1::BaseController
  def index
    users = User.all

    render(
      json: ActiveModel::ArraySerializer.new(
        users,
        each_serializer: Api::V1::UserSerializer,
        root: 'users',
      )
    )
  end
end
```

Pretty easy right? Here, we are going to use [active_hash_relation](https://github.com/kollegorna/active_hash_relation) gem which adds a whole API in our index method for free! Be sure to [check it out](https://github.com/kollegorna/active_hash_relation)! It's as simple as adding 2 lines:

``` ruby
class Api::V1::UsersController < Api::V1::BaseController
  include ActiveHashRelation

  def index
    users = User.all

    users = apply_filters(users, params)

    render(
      json: ActiveModel::ArraySerializer.new(
        users,
        each_serializer: Api::V1::UserSerializer,
        root: 'users',
      )
    )
  end
end
```

Now, using ActiveHashRelation API we can ask for users that were created after a specific date or users with a specific email prefix etc. However, there might be some security implications for some columns so it's good to filter the params before using it!

## Adding Authentication
For authentication, the Rails app uses a custom implementation. That shouldn't be a problem because we build an API and we need to re-implement the authentication endpoint anyway. In APIs you don't use cookies and you don't have sessions. Instead, when a user wants to sign in she sends an HTTP POST request with her username and password to our API (in our case it's the `sessions` endpoint) which sends back a token. This token is user's proof of who she is. In each API request, rails finds the user based on the token sent. If no user found with the received token the API should return a 401 error.

First let's add a callback that adds a token to every new user is created:

``` ruby
    before_create :generate_authentication_token

    def generate_authentication_token
      loop do
        self.authentication_token = SecureRandom.base64(64)
        break unless User.find_by(authentication_token: authentication_token)
      end
    end
```

Then let's add the `sessions` endpoint:

``` ruby
class Api::V1::SessionsController < Api::V1::BaseController
  def create
    user = User.find_by(email: create_params[:email])
    if user && user.authenticate(create_params[:password])
      self.current_user = user
      render(
        json: Api::V1::SessionSerializer.new(user, root: false).to_json,
        status: 201
      )
    else
      return api_error(status: 401)
    end
  end

  private
  def create_params
    params.require(:user).permit(:email, :password)
  end
end
```

And the sessions serializer:

``` ruby
class Api::V1::SessionSerializer < Api::V1::BaseSerializer
  #just some basic attributes
  attributes :id, :email, :name, :admin, :token

  def token
    object.authentication_token
  end
end
```

_Tip: We only need user's id, email and token but for Ember and other client frameworks it's good to return some more data for better optimization. We might save us from an extra request to the users endpoint :)_

Once the client has the token it sends both token and email to the API for each subsequent request. Now let's add the `authenticate_user!` filter inside the `Api::V1::BaseController`:

``` ruby
  def authenticate_user!
    token, options = ActionController::HttpAuthentication::Token.token_and_options(request)

    user_email = options.blank?? nil : options[:email]
    user = user_email && User.find_by(email: user_email)

    if user && ActiveSupport::SecurityUtils.secure_compare(user.authentication_token, token)
      @current_user = user
    else
      return unauthenticated!
    end
  end
```
`ActionController::HttpAuthentication::Token` parses Authorization header which holds both token and email. Actually, an Authorization header looks like that:


``` http
Authorization: Token token="VCiPlgG9fbQHkpjzp4JnVcDm2KR5zpu39xY2lx6kkMYXhkvIkTRGSfLAeaQH1aDls548d05a4QS4uJTOIYJ3/g==", email="filippos@kollegorna.se"
```

Note that we use `secure_compare` to compare the received token with the user's saved token because otherwise our app would be vulnerable to timing attacks. You can find more info [here](http://codahale.com/a-lesson-in-timing-attacks/).

Now that we have set the current_user it's time to move on to authorization.


## Adding Authorization
For authorization we will use [Pundit](https://github.com/elabs/pundit), a minimalistic yet wonderful gem based on policies. It's worth mentioning that authorization should be the same regardless of the API version, so no namespacing here.

After we add the gem and run the generators for default policy we create the user policy:

``` ruby
class UserPolicy < ApplicationPolicy
  def show?
    return true
  end

  def create?
    return true
  end

  def update?
    return true if user.admin?
    return true if record.id == user.id
  end

  def destroy?
    return true if user.admin?
    return true if record.id == user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
```

It should be straightforward. Of course for admins all actions are allowed. Micropost policy would be similar.


## Adding pagination, rate limit and CORS
Pagination is necessary for 2 reasons. It adds some very basic hypermedia for the front-end client and it increases the performance since it renders only a fraction of the total resources.

For pagination we will use [Kaminari](https://github.com/amatsuda/kaminari) and we only need to add 2 methods:

``` ruby
  def paginate(resource)
    resource = resource.page(params[:page] || 1)
    if params[:per_page]
      resource = resource.per_page(params[:per_page])
    end

    return resource
  end

  #expects pagination!
  def meta_attributes(object)
    {
      current_page: object.current_page,
      next_page: object.next_page,
      prev_page: object.previous_page,
      total_pages: object.total_pages,
      total_count: object.total_entries
    }
  end
```

Rate limit is a good way to filter unwanted bots or users that abuse our API. It's implemented by [redis-throttle](https://github.com/andreareginato/redis-throttle) gem and as the name suggests it uses redis to store the limits based on the user's IP. We only need to add the gem and add 2 lines in `config/application.rb`

``` ruby
  config.middleware.use Rack::RedisThrottle::Daily, max: 100000
```

[CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) is a specification that "that enables many resources (e.g. fonts, JavaScript, etc.) on a web page to be requested from another domain outside the domain from which the resource originated". Essentially it allows us to have loaded the javascript client in another domain from our API and allow the js to send AJAX requests to our API.

For Rails all we have to do is to install the `rack-cors` gem and allow:

``` ruby
    config.middleware.insert_before 0, "Rack::Cors" do
      allow do
        origins '*'
        resource '*', :headers => :any, :methods => [:get, :post, :put, :patch, :delete, :options, :head]
      end
    end
```

We allow access from anywhere, as a proper API. We can set restrictions on which clients are allowed to access the API by specifying the hostnames in origins.

## Tests
Now let's go and write some tests! We will use Rack::Test helper methods as described [here](https://gist.github.com/alex-zige/5795358). When building APIs it's important to test that the path input -> controller -> model -> controller -> serializer -> output works ok. That's why API tests are between unit tests and integration tests.

``` ruby
describe Api::V1::UsersController, type: :api
  context :show do
    before do
      create_and_sign_in_user
      @user = FactoryGirl.create(:user)

      get api_v1_user_path(@user.id), format: :json
    end

    it 'returns the correct status' do
      expect(last_response.status).to eql(200)
    end

    it 'returns the data in the body' do
      body = HashWithIndifferentAccess.new(MultiJson.load(last_response.body))
      expect(body[:user][:name]).to eql(@user.name)
      expect(body[:user][:updated_at]).to eql(@user.updated_at.iso8601)
    end
  end
end
```

`create_and_sign_in_user` method comes from our authentication helper:

``` ruby
module AuthenticationHelper
  def sign_in(user)
    header('Authorization', "Token token=\"#{user.authentication_token}\", email=\"#{user.email}\"")
  end

  def create_and_sign_in_user
    user = FactoryGirl.create(:user)
    sign_in(user)
    return user
  end
  alias_method :create_and_sign_in_another_user, :create_and_sign_in_user

  def create_and_sign_in_admin
    admin = FactoryGirl.create(:admin)
    sign_in(admin)
    return admin
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelper, :type=>:api
end
```

The same pattern goes for the rest endpoints. Since Michael has already added some model tests we don't have to be pedantic about it.

In our final app we use [rspec-api_helpers](https://github.com/kollegorna/rspec-api_helpers) gem that make tests look more beautiful and efficient.


## Final API
The final API can be found [here](https://github.com/vasilakisfil/rails_tutorial_api). You can dig in the code and see how everything is implemented :) Just for reference, this API is used for the [Ember app](https://github.com/vasilakisfil/rails_tutorial_ember) that mimitates [Rails Tutorial app](https://www.railstutorial.org/). For authentication and authorization in the ember side we used the [devise addon](https://github.com/simplabs/ember-simple-auth/tree/master/packages/ember-simple-auth-devise) although we haven't used devise in Rails app. But that's the beauty of APIs: you can hide your implementation details :)

## Bonus: Some Optimizations and tips
When our resource includes a day, it's good to have it in UTC time and iso8601 format. In general, we really don't want to include anywhere timezones in our API. If we clearly state that our datetimes are in utc and we only accept utc datetime, clients are responsible to convert the utc datetime to their local datetime (for instance, in Ember this is very easy using [moment](http://momentjs.com/) and [transforms](http://emberjs.com/api/data/classes/DS.Transform.html).

Another good idea is to use uuids instead of ids when we know that our app is going to have an API. With ids we might unveil sensitive information to an attacker.

We also may want to have fine-grained permissions on the resources based on the user type. For instance, for users that have not authenticated and request a user endpoint, we may want to reveal only the user email. We can do that, as long as you are prepared to monkey patch Pundit. Take a look [here](https://labs.kollegorna.se/blog/2014/11/rails-api/#authorization-is-tough) on how you can do that (a bit advanced).

When you are confused on how to implement an API endpoint, always take a look on existing API standards. The most close to AMS is [JSONAPI](http://jsonapi.org/) standard, but there are a few other like [HAL](http://stateless.co/hal_specification.html) and [Siren](https://github.com/kevinswiber/siren). For instance, in our final API we needed to add support for creating and deleting associations between users (endpoint that creates a follower or a following for a user). We mimitated the JSONAPI relationships ([here](http://jsonapi.org/format/#fetching-relationships) and [here](http://jsonapi.org/format/#crud-updating-to-one-relationships))

## Bonus: Adding automatic deployment
A new Rails project without automatic deployment is not cool. Services like [circleci](https://circleci.com/) and [travis](https://travis-ci.org/) help us build and deploy faster. In this project we will use [circleci](https://circleci.com/). After following the circleci [guide](https://circleci.com/docs/continuous-deployment-with-heroku) for setting up heroku and circleci keys, we only need to add circle.yml file that contains:

``` yml
deployment:
  production:
    branch: master
    commands:
      - git push git@heroku.com:rails-tutorial-api.git $CIRCLE_SHA1:refs/heads/master
      - heroku run rake db:migrate --app rails-tutorial-api
```

Now If we commit to master and our tests are green, it will push and deploy our repo in heroku and run migrations :)

## Bonus: In case of a break change: how to handle Version 2
We build our API, we ship it and everything works as expected. We can always add more endpoints or enhance current ones and keep our current version as long as we don't have a breaking changes. However, although rare, we might reach the point where we must have a break change because the requirements changed. Don't panic! All we have to do is define the same routes but for V2 namespace, define the V2 controllers that inherit from V1 controllers and override any method we want.

``` ruby
class Api::V2::UsersController < Api::V1::UsersController

  def index
    #new overriden index here
  end

end
```

In that way we save a lot of time and effort for our V2 API ( although for shifting an API version you will probably want more changes than a single endpoint).

## Bonus: Add documentation!
Documenting our API is vital even if it supported hypermedia. Documentation helps users to speed up their app or client development. There are many documentation tools for rails like [swagger](http://swagger.io/)  (I have made it work in rails using both [swagger-rails](https://github.com/marsz/swagger-rails) and [swagger-docs](https://github.com/richhollis/swagger-docs) ping me if you need help), [apipie-rails](https://github.com/Apipie/apipie-rails) and [slate](https://github.com/tripit/slate). However, I really like slate cause it doesn't pollute the controllers like swagger or apipie-rails.

Our app is rather small and we are going to have docs in the same repo with the rails app but ideally we would want them in a separate repository because it generates css and html files which are also versioned and there is no point since they are generated with a bundler command.

Create an app/docs/ directory and clone the slate repository there and delete the .git directory (we don't need slate revisions). In a app/docs/config.rb set the build directory to public folder:

``` ruby
set :build_dir, '../public/docs/'
```

and start writing your docs. You can take some inspiration from [our docs](https://rails-tutorial-api.herokuapp.com/docs/) :)


## That's all folks
That's all for now. You should really start building your Rails API _today_ and not tomorrow.

Next time we will take a look on how to have fine-grained permissions on resources based on the current user, more hypermedia, caching and many more!

Until then, take a look on other articles published here that have to do with APIs:

* [Export your db as a searchable API in Rails](/blog/2015/02/active-hash-relation/)
* [Challenges faced in a little larger Rails API project](/blog/2014/11/rails-api/)

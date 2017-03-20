---
title: "Rack Reqorder"
date: 2016-04-25 00:00 UTC
author: filippos
disable_comments: false
---

In our development days in Kollegorna we build various of stuff and fluff.

One of those is [rack-reqorder](https://github.com/kollegorna/rack-reqorder): a multi-fanctional rack middleware that allows you to:

* record requests/responses
* get statistics over which are the most popular or most slow endpoints
* record errors that might happen in a middleware that is below in the Rack stack.

But let's first see what is Rack and why such a tool could be useful.

## Rack

[Rack](http://rack.github.io/) provides a modular and adaptable interface for developing web applications in Ruby.
By wrapping HTTP requests and responses in rack request/response objects,
it unifies the API for web servers and web applications (or frameworks) so that
developers can focus on the development.

Rack allows us to have a 'common protocol' between various middleware. Each
middleware in the rack stack takes the request, processes it if it's needed and
forwards it deeper in the stack. In the deepest level there is, usually, the application
code (like Rails controllers). On the way back each rack middleware takes the
response, processes it if needed and forwards it in the next middleware.

For instance, the simplest rack middleware could look like:

``` ruby
class Foobar
  def initialize(app)
    @app = app
  end

  def call(environment)
    rack_request = Rack::Request.new(environment.clone)

    #do work with the request

    http_request = record_request(rack_request) if conf.request_monitoring

    #forward the request
    status, headers, body = @app.call(environment)

    rack_response = Rack::Response.new(body, status, headers)

    #do work with the response

    #forward the response
    return [status, headers, body]
  end
end
```

Foobar middleware only needs to be injected in the Rack middleware. For instance,
in rails:

``` ruby
Rails.application.config.middleware.insert_after(0 , Foobar)
```

Foobar middleware will run in every request and in every response. Whether it
does work on request, on response or on both depends on the middleware itself.

So in essence, Rack is the place from which you can control everything. Wouldn't
be great to record a request or a response if you wanted to?

## Rack Reqorder

That's how [rack-reqorder](https://github.com/kollegorna/rack-reqorder) started.
We are developing some code on our machine, tests
are green, we deploy on staging but the client (EmberJS in our case) seems to
get an error. To debug the error when the code has been deployed it's challenging
most of the times.

Rack-reqorder provides 2 mechanisms to invistage what has happened
to the backend:

First it records all errors that happen in a middleware below (even the application
code is considered a middleware for Rack). So you don't have to check the logs
all the time:
![exceptions](/posts/rack-exceptions.jpg)

Once an exception takes places, rack-reqorder will record both the request that
caused the exception and information about the error, like the exact lines that
it happened, the application trace etc
![exceptions](/posts/rack-exception-details.jpg)

The developer can mark fitler the exceptions based on environment and status
(solved, unsolved), see other instances of the same exception and change the status,
like marking it to solved.

Secondly, rack-reqorder allows you to start reqording all requests/responses instantly
to see what's going on, why the error happened, based on a header.
![exceptions](/posts/rack-recording.jpg)

The header could be a custom one (like X-Custom-Header), or just the authentication
token of the client that complaints for the bug (like Authorization header along
with the api token of the client). By enabling this feature, rack-reqorder will
record all requests/responses in a continued timeline for better understanding.

As a bonus, rack-reqorder records various statistics about the requests/responses
by categorizing in route paths. A route path is a requested url combined with 
the request action (so GET /users is different from POST /users).
![exceptions](/posts/rack-metrics.jpg)

This should allow you to see some initial results on your system so that you know
which endpoint is the slowest or the most popular.

As a bonus it also provides an overview of the requests in the last 24 hours:
![exceptions](/posts/rack-metric-charts.jpg).


It should be noted that rack-reqorder has been built on top of [grape](https://github.com/ruby-grape/grape)
and exposes a very robust API using [mongoid-hash-query](https://github.com/kollegorna/mongoid_hash_query).
This means that although we provide a basic frontend, anyone extend it, build a new one or even start using CURL to
check the information straight from the API ;)

It has been build as a rails engine, but can run standalone as well.
You only need to specify the mongoid file and start using it. Currently it supports
routes from Sinatra, Grape and Rails and we are looking forward to support Hanami (ex Lotus)
framework as well. Wanna help us? :)

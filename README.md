Upgrade 2017 for [our labs website](https://labs.kollegorna.se).

## Local setup

1. Make sure you have [the same Ruby version installed as the repo](https://github.com/kollegorna/kollegorna.se/blob/master/.ruby-version).
2. Install [Bundler](https://rubygems.org/gems/bundler) and [Node.js](http://nodejs.org).
3. Clone repository
4. ``$ npm install && gulp install``

### Gulp commands

Runs bundle install and bower install:

    $ gulp install

Runs bundle exec middleman:

    $ gulp middleman

Builds Middleman and create a BrowserSync server that watches all changes:

    $ gulp serve

Builds Middleman:

    $ gulp build

## Writing posts

    $ middleman article NAME

Will generate a file in source/posts.

## Deployment

The master branch is automatically deployed with Codeship.

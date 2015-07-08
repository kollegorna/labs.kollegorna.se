---
layout: post
type: post
title: "Export your db as a searchable API in Rails"
created: 1423406108
author: filippos
comments: true
---

In a previous [blog post](https://labs.kollegorna.se/blog/2014/11/rails-api/) we had talked about challenges faced when building large apis in Rails. One of them was that AR would limit you, especially in the index method (the /resources/ endpoint) where you `GET` all the resources but with some filters applied.

A typical resource method will be like that:

```ruby
class Api::V1::PdsasController < Api::V1::BaseController
  def index
    pdsas = Pdsa.all
    pdsas = pdsas.where(id: params[:ids]) if params[:ids]
    pdsas = pdsas.scope_by(params[:scope]) if params[:scope]

    [:unit_id, :act_status, :unit_category_id, :subject_id, :area_id].each do |prm|
      pdsas = pdsas.where(prm => params[prm]) unless params[prm].blank?
    end

    unless params[:start_date].blank?
      pdsas = pdsas.where('START_DATE >= ?', params[:start_date])
    end

    unless params[:end_date].blank?
      pdsas = pdsas.where('END_DATE <= ?', params[:end_date])
    end

    unless params[:name].blank?
      pdsas = pdsas.where('NAME ILIKE ?', "%#{params[:name]}%")
    end

    pdsas = policy_scope(pdsas)

    render json: pdsas, each_serializer: Api::V1::PdsaSerializer
  end
end
```

We can see various problems arising in such a controller:

* You will repeat such filters in other controller too. For instance, the following `pdsas = pdsas.where(id: params[:ids]) if params[:ids]` is the least filter you will want to have in an API controller. By giving the ability to specify exactly which resources you need will increase your performance since you will return those resources only.
* Date attributes of a resource should be have a better API. Now you can only get resources that have a greater or equal start_date and/or resources that have less or equal `end_date`. We need many more filters here. What about resources with less than `start_date` or resources with less or equal than `start_date` etc.
* Usually, especially when you build an API not meant for public use, you will only declare filters that you really need. Essentially this leads to a non consistent APIs among different resources.
* Filtering associations: What if you would want all Pdsas that belong to units that were created after a given datetime? Building that inside PdsasController will make you want to cry for refactoring :)

#### Refactoring round 1
So what can we do? One idea is to move all such filters to another class, say `Api::V1::PdsaFilters.rb`. Meaning:

```ruby
class Api::V1::PdsasFilter
  attr_accessor :pdsas, :params

  def initialize(pdsas, params)
    @pdsas = pdsas
    @params = params
  end

  def collection
    self.pdsas = pdsas.where(id: params[:ids]) if params[:ids]
    self.pdsas = pdsas.scope_by(params[:scope]) if params[:scope]

    [:unit_id, :act_status, :unit_category_id, :subject_id, :area_id].each do |prm|
      self.pdsas = pdsas.where(prm => params[prm]) unless params[prm].blank?
    end

    unless params[:start_date].blank?
      self.pdsas = pdsas.where('START_DATE >= ?', params[:start_date])
    end

    unless params[:end_date].blank?
      self.pdsas = pdsas.where('END_DATE <= ?', params[:end_date])
    end

    unless params[:name].blank?
      self.pdsas = pdsas.where('NAME ILIKE ?', "%#{params[:name]}%")
    end

    return self.pdsas
  end
end
```

Now our controller becomes:

```ruby
class Api::V1::PdsasController < Api::V1::BaseController
  def index
    pdsas = Api::V1::PdsasFilter.new(Pdsa.all, params).collection

    pdsas = policy_scope(pdsas)

    render json: pdsas, each_serializer: Api::V1::PdsaSerializer
  end
end
```

Yay! Now we have a rather skinny controller by taking away all those ugly filters. But still, we haven't solved our problem with associations. Also, like before, we have to add ugly filters to `PdsasFilters`, so essentially we just moved the problem from the controller to the filter class. Let's fix that!

#### Refactoring round 2
First, embracing OO patterns we define a base (=abstract) filter class:

```ruby
class Api::V1::BaseFilter
  attr_reader :resource, :params

  def initialize(resource, params)
    @resource = resource
    @params = params
  end

  def collection
    return resource
  end

  protected
  def with_associations(pdsas, model: nil)
    unless model
      model = self.class.to_s.demodulize.gsub('Filter','').singularize.constantize
    end

    model.reflect_on_all_associations.map(&:name).each do |association|
      if params[association]
        association_name = association.to_s.titleize.split.join
        pdsas = pdsas.joins(association).merge(
          "Api::V1::#{association_name.pluralize}Filter".constantize.new(
            association_name.constantize.all, params[association]
          ).collection
        )
      end
    end

    return pdsas
  end
end
```
By using some light metaprogramming (for a good reason :-) ) and some recursion the `with_associations` method will find all the associations defined in the current model that is being filtered and runs their filter too. An example of params could be:
`{... pdsa filters ...}, unit: {... unit filters ...} }`. The filters for each association are defined in the filter class of the association controller.

For instance, like before, the filters for Pdsas will be:

```ruby
class Api::V1::PdsasFilter < Api::V1::BaseFilter
  def collection
    pdsas = self.resource

    pdsas = pdsas.where(id: params[:ids]) if params[:ids]
    pdsas = pdsas.scope_by(params[:scope]) if params[:scope]

    [:unit_id, :act_status, :unit_category_id, :subject_id, :area_id].each do |prm|
      pdsas = pdsas.where(prm => params[prm]) unless params[prm].blank?
    end

    unless params[:start_date].blank?
      pdsas = pdsas.where('START_DATE >= ?', params[:start_date])
    end

    unless params[:end_date].blank?
      pdsas = pdsas.where('END_DATE <= ?', params[:end_date])
    end

    unless params[:name].blank?
      pdsas = pdsas.where('NAME ILIKE ?', "%#{params[:name]}%")
    end

    return self.with_associations(pdsas)
  end
end
```

and for the unit we could have the following filters:

```ruby
class Api::V1::UnitsFilter < Api::V1::BaseFilter
  def collection
    units = self.resource

    units = units.where(id: params['ids']) if params['ids']

    unless params[:is_test].blank?
      units = units.where(
        is_test: ActiveRecord::ConnectionAdapters::Column.value_to_boolean(params[:is_test])
      )
    end

    return self.with_associations(units)
  end
end
```

Now we have a complete API for all our resources. But unfortunately, our API is not consistent, meaning the API of each resource depends on the filters we have written. Also, we see a recurring pattern. We have similar filters for many resources like the following:

```ruby
units = units.where(attribute_x: params[:attribute_x]) if params[:attribute_x]
```

#### Refactoring round 3
Our final refactoring step was to extract the common logic to an external gem, called [active_hash_relation](https://github.com/kollegorna/active_hash_relation). The reason to call it like that is because we wanted to run `where` clauses from a hash (converted by an incoming GET query string). Check it out! You can do really cool stuff.

If you are lazy (or building an internal API), you can just add the following line in your controller `resources = apply_filters(Resource.all, params)` and still support a consistent API regardless of your underlying resource.

For instance, [active_hash_relation](https://github.com/kollegorna/active_hash_relation) gives you many options on filtering a resource by a date attribute. You can filter by an exact date, (`{example_column: 2015-02-09}`), you can filter by supplying inequality filters like `{example_column: {leq: 2015-02-09}}` (give me all resources that `example_column > 2015-02-09`) or even combine those too: `{example_column: {leq: 2015-02-09, geq: 2014-02-09}}`. The same goes for other kind of attributes like integers, datetimes, float etc. You can also filter based on text or string attributes.

The gem can also filter by relationship in a very consistent way exactly because it uses rails internals methods to figure out the column types (actually for that, rails asks the db) and their associations defined in the model class. By using the gem, you can retrieve all `pdsas` updated after "2014-11-2" with `unit` that has `test` attribute to `false` and which has `areas` with `ids` 22,23 and 24. Here you go: `{updated_at: { geq: "2014-11-2 14:25:04"}, unit: {test: false, areas: {id: [22,23,24]} }}` Watch how the API reflects the association: pdsa `belong_to` unit and it expects `unit`, whereas a unit `has_many` areas and hence it expects `areas` instead of area.

Finally [active_hash_relation](https://github.com/kollegorna/active_hash_relation) also supports filtering by scope, a quite useful feature. Scopes are expected in their own hash, like `{updated_at: { geq: "2014-11-2 14:25:04"}, unit: {test: false, areas: {id: [22,23,24]} }, scopes: { published: true } }`. Scopes with argument are not supported but hey do you really need that?! (it's easy to add that though!)

Essentially your whole db is exposed there. And somewhere here you will probably be wondering, aren't there any security issues with that? Well, yes and no.

Yes because, you might don't want to allow your resource based on a sensitive attribute. Suppose that you have a `credit_card_number` there. Although no attribute is exposed in the first place, an attacker could brute force your API and start sending random attributes to scrutinize if a resource has a `credit_card_number` attribute or any other sensitive attribute.

No, because, if you don't want to expose an attribute in your API, you can always filter it in the params (strong params is a good idea!) **before** supplying the params to `apply_filters` method. If you find this cumbersome (especially on larger projects) [active_hash_relation](https://github.com/kollegorna/active_hash_relation) supports internally a similar way to whitelist the params for each resource. Just create an initializer and declare your filter classes:

```ruby
#config/initializers/active_hash_relation.rb
ActiveHashRelation.configure do |config|
  config.has_filter_classes = true
  config.filter_class_prefix = 'Api::V1::'
  config.filter_class_suffix = 'Filter'
end
```

That way active_hash_relation will first check for a fitler class. It could be also useful when you don't want to expose a whole set of resources (i.e. Resource.all) but a part of them (Resource.my_scope). An example could be:

```ruby
class Api::V1::PdsasFilter < Api::V1::BaseFilter
  include ActiveHashRelation

  attr_accessor :pdsas, :params

  def initialize(pdsas, params)
    @pdsas = pdsas.my_scope
    @params = filter_the_params
  end

  def apply_filters
    return FilterApplier.new(pdsas, params).apply_filters
  end

  private
  def filter_the_params
  	#chop chop chop!
  end
end
```

This is extremely helpful because when you ask for /units and you pass the pdsas filters (for instance units with test=false and that have at pdsas that where updated before Christmas `{test: false, pdsas: {updated_at: {le: 2014-12-25}}`, [active_hash_relation](https://github.com/kollegorna/active_hash_relation) will search only on pdsas with my_scope scope.

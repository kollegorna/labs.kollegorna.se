---
layout: post
type: post
title: "Integrating Tictail with Prisjakt and PriceRunner"
created: 1425632493
author: ivan
comments: true
---

When launching our online snowboard store - [The Kong Initiative](http://www.konginitiative.com) (Bringing you the widest snowboards around) we also wanted our products to be listed on price comparison websites, namely [Prisjakt](http://www.prisjakt.nu/) and [PriceRunner](http://www.pricerunner.com).

In order to do that, we built a simple Rails app [Kong Integrations](https://github.com/kollegorna/kong-integrations), that provides Prisjakt and Pricerunner with the data they require.
The shop itself is a [Tictail](https://tictail.com/) store, so we're using the Tictail RESTful API to fetch the products from the store and we provide 2 endpoints: 

Prisjakt:  
[http://integrations.konginitiative.com/prisjakt/products.csv](http://integrations.konginitiative.com/prisjakt/products.csv)

PriceRunner:  
[http://integrations.konginitiative.com/pricerunner/products.csv](http://integrations.konginitiative.com/pricerunner/products.csv)

Those are just simple CSV files that contain our products' data and match specifications of those 2 vendors.
We're looking forward to adding more!

---
title: "Integrating Tictail with Prisjakt and PriceRunner"
date: 2015-03-06 00:00 UTC
author: ivan
disable_comments: false
comments: true
---

When launching our online snowboard store - [The Kong Initiative](http://www.konginitiative.com) (Bringing you the widest snowboards around) we also wanted our products to be listed on price comparison websites, namely [Prisjakt](http://www.prisjakt.nu/) and [PriceRunner](http://www.pricerunner.com).

In order to do that, we built a simple Rails app [Kong Integrations](https://github.com/kollegorna/kong-integrations), that provides Prisjakt and Pricerunner with the data they require.
The shop itself is a [Tictail](https://tictail.com/) store, so we're using the Tictail RESTful API to fetch the products from the store and we provide 2 endpoints: 

[Prisjakt CSV](http://integrations.konginitiative.com/prisjakt/products.csv)

[PriceRunner CSV](http://integrations.konginitiative.com/pricerunner/products.csv)

Those are just simple CSV files that contain our products' data and match specifications of those 2 vendors.
We're looking forward to adding more!

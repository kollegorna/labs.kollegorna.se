---
layout: post
type: post
title: "Environment variables"
created: 1428577944
author: urban
comments: true
---

> "If Only I Had A Penny For Everytime I've been missing an API key."

Setting up projects locally needs a good way organizing API keys and other secret info that your repo needs to work properly. Keeping the repo readme updated is super important making sure everyone in your teams knows how to setting up the repo locally. But how do we share secret stuff, like API keys?

First of all: never version control API-keys in your repo. Instead use ``.envrc`` files. The ``.envrc`` file should be added to your ``.gitignore`` patterns. Or incorporated in your other free and open source distributed version control system of choice.

## Manage environment variables
Here at Kollegorna we use [direnv.net](http://direnv.net). It is an environment variable manager for your shell.

### What?
Direnv sells itself as an environment variable manager and that's exactly what it is. Instead of storing the env vars in your global ``~/.profile`` or have some funky code that checks if you run locally and otherwise use env var. You only have to create a ``.envrc`` file inside your root project directory. This ``.envrc`` file can look something like this:

    export CLOUDINARY_URL=cloudinary://4567868765:873546tyufgjagjhsfghjasghjf
    export VIMEO_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    export VIMEO_ACCESS_TOKEN_SECRET=1234567xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    export VIMEO_CLIENT_ID=1234567xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    export VIMEO_CLIENT_SECRET=1234567xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    export LINKEDIN_CLIENT_ID=123456789
    export LINKEDIN_CLIENT_SECRET=1234567xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Before each prompt direnv checks for the existence of an ``.envrc`` file in the current and parent directories. The first time you cd into a directory with a ``.envrc`` file, it will refuse to load the file.  This is to protect you since ``.envrc`` variables will be executed by your shell. 

### Storing keys
We store api keys as [secure notes](https://helpdesk.lastpass.com/secure-notes/) in [Lastpass](http://lastpass.com), as we use Lastpass as our vault for storing passwords. Making sure everyone is in sync and has access to the top secret vault.

When you have added your necessary keys in ``.envrc`` run `direnv allow` for trusting this file until next time it changes.

Now your api keys is ready to be used in your project. Also don't forget to document, adding info to the repo readme file about which keys is needed and where they can be found. This makes it easy the next time someone needs to set up the repo on their machine.
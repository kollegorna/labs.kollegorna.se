---
title: "Signing a user in from a worker"
date: 2015-04-08 00:00 UTC
author: filippos
disable_comments: false
---

In one of our projects we had the following requirement: create a "confirm" endpoint (like /confirm/:id) that when a user browses and the token is correct user should automatically be signed in and redirected to profile whereas when the token is incorrect user shouldn't be signed in and should get a redirect to the login page.

At the same time, another requirement is that the whole validation process is using an external service and thus should be done in the backend (otherwise it would stall the whole request for a long time), inside an async worker. Worker would then send data (redirect on not to redirect) to the client using Pusher.

In a regular sign in process, user sends an HTTP request that holds username and password, Rails checks their validity and if they are valid, sends back a specific cookie to the client which is also saved in the Rails side (in the database or in Redis or in memory depending on the adapter you use). Then in a subsequent HTTP request, Rails retrieves the cookies the client sent and checks the 'session' variable inside the cookies. The user is authenticated only if 'session' has valid values.

So, how do you sign in the user from a worker? The problem is that authentication is achieved by using cookies only and given that workers don't have access to cookies (makes sense since they don't interact with the browser) makes things more difficult.

However, there is a solution and it's pretty straightforward. When user lands to the "confirm" endpoint, you immediately suppose that the user is signed in. You create a cookie and send it with your initial response which is actually a js snippet that listens to a unique Pusher channel. However, in order to avoid any risk, the cookie that you set points to a bogus user and not in the real user. So if user explicitly redirects to profile, authentication would fail (essentially, browser has a session cookie with unique values, only that these values point in the backend to nowhere). Then in your worker you start checking if the token is valid. If it is, you modify the cookie values in the backend to point to the real user and then push the profile redirect to Pusher. On the other hand if token is invalid, you delete the cookie and push the login redirect to Pusher.

And voilà! You get a sign in from a worker using an external service without having to worry about scalability issues and request timeouts.

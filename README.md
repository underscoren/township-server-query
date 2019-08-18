# township-server-query
### A "A Township Tale" server query app

In order to run it, clone the github repo, make sure node v10.15.1 or later is installed, then

    npm install
    node index.js


### Setup

In order to be able to access the API, you need to get an API key. Ask Timo_Alta#8750 on the [discord](https://discord.gg/townshiptale) for one, or find it yourself.

Once you get it, open up config.js and put it into the `api_key` variable. Then, enter your login details into the `username` and `password` fields.

### TODO:
 - Desktop notifications for things like player counts dropping or rising to a set amount, servers going back online or game updates
 - Store historical player counts in a small database, and display a graph on the website
 - Handle edge case where all servers are down
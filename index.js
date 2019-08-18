const api = require("./api");
const express = require("express");
const app = express();
const PORT = process.platform == "win32" ? 8080 : 80; //development on a windows machine, deployment on a linux machine

//setup express to serve files
app.use(express.static("static"));

//send currently cached server status
app.get("/api/status", (req, res) => {
    res.json(api.server_status);
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

console.log("logging in");
//begin the query loop 
api.login().then(() => {
    console.log("login successful");
    api.queryServer().then(servers => {
        console.log("recieved server status");

        //cache server status in memory
        api.server_status = servers;
        startUpdateClock();
    }).catch(err => {
        console.error("error querying:", err);
    });
}).catch(err => {
    console.error("error login:",err);
});

const timeDiff = 60000; //update every minute
let timerEnd = new Date(new Date().getTime() + timeDiff);

//Timer function
const startUpdateClock = () => setInterval(()=>{
    const now = new Date().getTime();
    let diff = timerEnd.getTime() - now;
    if (diff < 1) {
        console.log(now, "server update");
        api.updateServer();
        timerEnd = new Date(new Date().getTime() + timeDiff);
    }
}, 100);


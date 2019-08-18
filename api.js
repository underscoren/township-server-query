//Handles authentication and querying the api
const request = require("request");
const config = require("./config");

let access_token = "";
let refresh_token = "";

let server_status = [];

//query api server for server status
const queryServer = () => {
    return new Promise((resolve, reject) => {
        request({
            method:"GET",
            headers: {
                "x-api-key": config.api_key,
                "Authorization": "Bearer "+access_token
            },
            json: true,
            url: "https://967phuchye.execute-api.ap-southeast-2.amazonaws.com/prod/api/Servers?status=Online"
        }, (err, res, data) => {
            if(err) reject(err);

            //status code 401 usually means the access token expired, try refreshing
            if( res.statusCode == 401 ) {
                console.log("token expired, getting new token");
                refreshAccess().then(() => {
                    resolve(queryServer());
                }).catch(err => {
                    reject(err);
                });
            } else if (res.statusCode != 200) {
                reject(res);
            } else {
                resolve(data);
            }
            
        });
    });
};

//get new access token via refresh token
const refreshAccess = () => {
    return new Promise((resolve,reject) => {
        request({
            method: "PUT",
            headers: {
                "x-api-key": config.api_key,
                "Authorization": "Bearer "+refresh_token,
                "Content-Type":	"application/json; charset=utf-8",
                "Accept": "application/json"
            },
            url: "https://967phuchye.execute-api.ap-southeast-2.amazonaws.com/prod/api/Sessions",
            json: true,
            body: {}
        }, (err, res, body) => {
            if(err) reject(err);
            
            if (res.statusCode == 200) {
                //get new tokens
                refresh_token = body.refresh_token;
                access_token = body.access_token;
                resolve();
            } else {
                reject(res);
            }
            
        });
    });
};

const updateServer = () => {
    queryServer().then(servers => {
        server_status = servers;
    }).catch(err => {
        console.error("error querying:",err);
    });
};

//get refresh and access tokens
const login = () => {
    return new Promise((resolve, reject) => {
        const crypto = require("crypto");
        request({
            method: "POST",
            headers: {
                "x-api-key": config.api_key,
                "Content-Type":	"application/json; charset=utf-8",
                "Accept": "application/json"
            },
            url: "https://967phuchye.execute-api.ap-southeast-2.amazonaws.com/prod/api/Sessions",
            body: JSON.stringify({
                "username": config.username,
                "password_hash": crypto.createHash("sha512").update(config.password, "utf8").digest("hex")
            })
        }, (err, res, body) => {
            if(err) reject(err);
            //parse the response
            body = JSON.parse(body);

            access_token = body.access_token;
            refresh_token = body.refresh_token;
            resolve();
        });
    });
};

module.exports = {
    server_status,
    queryServer,
    refreshAccess,
    updateServer,
    login
};
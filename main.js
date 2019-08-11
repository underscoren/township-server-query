const api_key = ""; //insert the api key here
let access_token = "";
let refresh_token = "";

//if no api key is set, warn the user
if(!api_key) {
    $(".modal-body").empty().append("<p class='text-danger'>You need to provide an API key in order to access the API. Look at the <a href='https://github.com/underscoren/township-server-query/blob/master/README.md'>readme</a> for more information.</p>");
    $(".modal-footer").remove();
}

//get new access token via refresh token
const refreshAccess = () => {
    return new Promise((resolve,reject) => {
        $.ajax({
            type: "PUT",
            headers: {
                "x-api-key": api_key,
                "Authorization": "Bearer "+refresh_token,
                "Content-Type":	"application/json; charset=utf-8",
                "Accept": "application/json"
            },
            url: "https://967phuchye.execute-api.ap-southeast-2.amazonaws.com/prod/api/Sessions",
            data: "{\"data\": \"servercheckerby_n#1111ondiscord\" }"
        }).done(data => {
            access_token = data.access_token;
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
};

//check if we have a refresh token
if(window.localStorage.getItem("refresh_token")) {
    refresh_token = window.localStorage.getItem("refresh_token");
    refreshAccess().then(() => {
        updateServerInfo();
        startClock();
    });
} else {
    $("#loginModal").modal("show");
}

//initialise tooltips
$(() => {
    $("[data-toggle='tooltip']").tooltip();
});

//shamelessly stolen from https://stackoverflow.com/questions/55926281/how-do-i-hash-a-string-using-javascript-with-sha512-algorithm
const sha512 = async str => {
    const buf = await crypto.subtle.digest("SHA-512", new TextEncoder("utf-8").encode(str));
    return Array.prototype.map.call(new Uint8Array(buf), x => (("00" + x.toString(16)).slice(-2))).join("");
};

//query api server for server status
const queryServer = () => {
    return new Promise((resolve, reject)=>{
        $.ajax({
            type:"GET",
            headers: {
                "x-api-key": api_key,
                "Authorization": "Bearer "+access_token
            },
            url: "https://967phuchye.execute-api.ap-southeast-2.amazonaws.com/prod/api/Servers?status=Online"
        }).done((data) => {
            resolve(data);
        }).catch(err => {
            if(err.status == 401) {
                refreshAccess().then(() => {
                    resolve(queryServer());
                });
            } else {
                reject(err);
            }
        });
    });
};

//util function for css styling
const playerNumToClass = playerNum => {
    if ( playerNum <= 0 ) return "-dark";
    else if ( playerNum <= 10 ) return "-primary";
    else if ( 11 <= playerNum <= 20 ) return "-warning";
    else return "-danger";
};

//updates the DOM with server info
const updateServerInfo = () => {
    queryServer().then(servers => {
        console.log(servers);

        //remove previous content in servers
        $("#serverlist").empty();
        $("#serverdata").empty();

        //loop through all servers
        for (const server of servers) {
            //console.log("parsing",server.name);

            //add server to list
            $("#serverlist").append(
                $(`<a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center d-flex justify-content-between align-items-center" href="#list-${server.id}" data-toggle="list" role="tab">`).append(
                    [
                        server.name,
                        $("<span class='badge badge-pill'>").append(server.online_players.length).addClass("badge"+playerNumToClass(server.online_players.length))
                    ]
                )
            );

            //add server info to tab
            $("#serverdata").append(
                $(`<div class="tab-pane fade" id="list-${server.id}" role="tabpanel">`).append(
                    $("<div class='table-responsive'>").append(
                        $("<table class='table table-hover'>").append(
                            $("<tbody>").append(
                                [
                                    $("<tr>").append([
                                        $("<th>").append("Server version"),
                                        $("<td>").append(server.meta_data.version)
                                    ]),
                                    $("<tr>").append([
                                        $("<th>").append("Online players"),
                                        $("<td>").append(
                                            $("<dl>").append(
                                                server.online_players.map(player=>{
                                                    return $("<dd>").append(player.username);
                                                })
                                            )
                                            
                                        )
                                    ])
                                ]
                            )
                        ) //this is why you don't write code at 4am kids
                    )
                )
            );
        }
    });
};

//countdown timer stolen from https://www.w3schools.com/howto/howto_js_countdown.asp
const updateTime = 60000;
let time_end = new Date(new Date().getTime()+updateTime);

const startClock = () => {
    setInterval(() => {
        let now = new Date().getTime();
        let diff = time_end - now;

        //calculations for days, hours, minutes and seconds
        let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((diff % (1000 * 60)) / 1000);

        $("#timer").text(`${days ? days+":" : ""}${hours ? hours.toString().padStart(2,"0")+":" : ""}${minutes ? minutes.toString().padStart(2,"0")+":" : ""}${seconds.toString().padStart(2,"0")}`);
        
        //when countdown finishes, update the server
        if (diff < 1) {
            time_end = new Date(new Date().getTime()+updateTime);
            updateServerInfo();
        }
    }, 250);
};

//login using form data from the modal
$(".modal-footer button").on("click", async () => {
    $(".modal-footer button").html("Loading...").addClass("disabled");
    $.ajax({
        type: "POST",
        headers: {
            "x-api-key": api_key,
            "Content-Type":	"application/json; charset=utf-8",
            "Accept": "application/json"
        },
        url: "https://967phuchye.execute-api.ap-southeast-2.amazonaws.com/prod/api/Sessions",
        data: JSON.stringify({
            "username": $("#username").val(),
            "password_hash": await sha512($("#password").val())
        })
    }).done(data => {
        //get access and refresh tokens
        access_token = data.access_token;
        refresh_token = data.refresh_token;

        //if the remember me checkbox is ticked, save the refresh token for later use
        if($("#remember").prop("checked")) {
            window.localStorage.setItem("refresh_token",refresh_token);
        }

        //cleanup
        $("#loginModal").modal("hide");
        updateServerInfo();
        startClock();
    }).catch(err => {
        //report error to login forms
        $(".modal-footer button").html("Login").removeClass("disabled");
        if(err.status == 403) {
            $("#loginMessage").text("Invalid API key, or the request was formed incorrectly");
        }
        if(err.status == 400) {
            $("#loginMessage").text(err.responseJSON.message);
        }
    });
});
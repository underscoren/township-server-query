//get server status from the proxy api
const queryServer = () => {
    return new Promise((resolve, reject) => {
        $.getJSON("api/status").done(data => {
            resolve(data);
        }).fail(err => {
            reject(err);
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
                        $("<span class='badge badge-pill'>")
                            .append(server.online_players.length)
                            .addClass("badge"+playerNumToClass(server.online_players.length))
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
    }).catch(err=>{
        console.error("error querying server",err);
    });
};

//countdown timer
const update_time = 60000;
let time_end = new Date(new Date().getTime()+update_time);

setInterval(() => {
    let diff = time_end - new Date().getTime();

    $("#timer").text(`${Math.floor(diff/1000).toString().padStart(2,"0")}`);

    //when countdown finishes, update the server
    if (diff < 500) {
        time_end = new Date(new Date().getTime()+update_time);
        updateServerInfo();
    }
}, 100);

updateServerInfo();

// declare packages
const express = require('express');
const app = express();
const path = require('path');
const socketio = require('socket.io');
const mysql = require("mysql2");
const chalk=require("chalk"); 

// declare constants
const port = 3000
const gamespawn = {x: 1, y: 1}
const starterinventory = []

var userinfo = {}
var gameinfo = {}
var playersocket = {}
var playerpass = {}

// declare mysql server connection
var con = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "toor",
    database: "db"
});

// attempt to connect to database
con.connect(function(err) {
	if (err) throw err
    console.log(chalk.blue("db connected"))
});

// make server serve index.html when requested
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// allow use of game dir
app.use("/game", express.static(path.resolve(__dirname, "public", "game")));

// use folder public
app.use(express.static('public'));

// start server
const server = app.listen(port, () => {
  console.log(`Server listening on`, chalk.magenta(`${port}`));
});

// declare websocket server
const io = socketio(server)

// listen for incoming connections
io.on('connection', (socket) =>{

    console.log(chalk.cyan(`new connection`), chalk.yellow(`${socket.id}`))
    
    updategame('allinfo', gameinfo, socket)

    socket.on('disconnect', () => {
        let deleted = playersocket[socket.id]
        console.log(chalk.red('player left'), chalk.yellowBright(deleted))
        userinfo[deleted] = gameinfo[deleted]
        delete playersocket[socket]
        updategame('allinfo', gameinfo, io)
    })

    socket.on('clientupdate', (data)=> {
        let type = data[0]
        let info = data[1]
        let client = playersocket[socket.id]
        if (type == 'position') {
            gameinfo[client][2] = info
            let newinfo = [info['x'], info['y']]
            let clientinfo = [client, newinfo]
            updategame('position', clientinfo)
        }
    })

    // request username of client
    socket.emit('getname', (callback) => {
        socket.on('requestpass', (nameandpass, callback2) => {
            if (!nameandpass[0] in playerpass) {
                playerpass[nameandpass[0]] = nameandpass[1]
                handlesuccess(callback.name, callback.color, gamespawn, starterinventory)
            } else {
                if (nameandpass[1] != playerpass[nameandpass[0]]) {
                    callback2('incorrect')
                }
                else {
                    let currentuserinfo = userinfo[nameandpass[0]]
                }
            }
        })

        function handlesuccess(name, color, position, inventory) {
            console.log(chalk.yellowBright(`new player`), chalk.green(`${callback.name}`))
            let playerinfo = [name, color, position, inventory]
            playersocket[socket.id] = callback.name

            updategame('playerjoin', playerinfo)
        }
    })
})

function updategame(updatetype, info, socket) {
    
    if (updatetype == 'playerjoin') {
        let name = info[0]
        let color = info[1]
        let position = info[2]
        let inventory = info[3]
        gameinfo[name] = [name, color, position, inventory]
        io.emit('gameupdate', ['join', info])
    }
    if (updatetype == 'allinfo') {
        socket.emit('gameupdate', ['all', undefined])
        for (var key in gameinfo) {
            if (gameinfo.hasOwnProperty(key)) {
                var infoArray = gameinfo[key];
                updategame('playerjoin', infoArray)
            }
        }
    }
    if (updatetype = 'position') {
        io.emit('gameupdate', ['pos', info])
    }
}
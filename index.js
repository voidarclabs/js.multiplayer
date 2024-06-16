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
var gameinfo = {red: ['red', 'red', {x: 1, y: 1}, []]}
var playersocket = {}
var playerpass = {red: 'balls'}

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

let cum = setTimeout(() => {
            savegame()
        }, 1000);

function savegame() {
        for (let elem in gameinfo) {
            let element = gameinfo[elem]
            let stringelem = element.split(',')
            console.log(stringelem)
            con.query(`INSERT INTO gameinfo VALUES (${element[0]}, ${element[1]}, ${element[2]}, ${element[3]})`, function (err, result) {
                if (err) throw err;
                console.log("Result: " + result);
            });
        }
        
    }
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
        delete gameinfo[deleted]
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

    socket.on('requestpass', (data, callback) => {
        let name = data[0]
        let pass = data[1]
        if (name in playerpass) {
            if (pass !== playerpass[name]) {
                callback({status: 'incorrect'})
            } else {
                callback({status: 'correct'})
            }
        } else {
            callback({status: 'newplayer'})
        }
    })

    // request username of client
    socket.emit('getname', (callback) => {

        if (callback.name in userinfo) {
            let info = userinfo[callback.name]
            handlesuccess(info[0], info[1], info[2], info[3])
        } else {
            handlesuccess(callback.name, callback.color, gamespawn, starterinventory, callback.password)
        }

        function handlesuccess(id, color, pos, inventory, password) {
            console.log(chalk.yellowBright(`new player`), chalk.green(`${callback.name}`))
            let playerinfo = [id, color, pos, inventory]
            if (password) {
                playerpass[id] = password
            }
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
// declare packages
const express = require('express');
const app = express();
const path = require('path');
const socketio = require('socket.io');
const mysql = require("mysql2");

// declare constants
const port = 3000
const gamespawn = {x: 1, y: 1}

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
    console.log("db connected")
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
  console.log(`listening on ${port}`);
});

// declare websocket server
const io = socketio(server)

// listen for incoming connections
io.on('connection', (socket) =>{
    console.log(`new connection ${socket.id}`)
    
    // request username of client
    socket.emit('getname', (callback) => {
        console.log(callback.name, callback.color)
        let playerinfo = [callback.name, callback.color, gamespawn]
        updategame('playerjoin', playerinfo)
    })
})

function updategame(updatetype, info) {
    if (updatetype == 'playerjoin') {
        io.emit('gameupdate', ['join', info])
    }
}
// declare packages
const express = require('express');
const app = express();
const path = require('path');
const socketio = require('socket.io');
const mysql = require("mysql2");
const chalk=require("chalk"); 
const fs = require('fs');


// declare constants
const port = 3000
const gamespawn = {x: 1, y: 1}
const starterinventory = []

var userinfo
var gameinfo = {}
var playersocket = {}
var playerpass
var worldinfo

function init() {
    userinfo = require('./gameinfo/userinfo.json')
    playerpass = require('./gameinfo/playerpass.json')
    worldinfo = require('./gameinfo/worldinfo.json')
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

init()

// listen for incoming connections
io.on('connection', (socket) =>{

    console.log(chalk.cyan(`new connection`), chalk.yellow(`${socket.id}`))
    
    updategame('allinfo', gameinfo, socket)

    socket.on('disconnect', () => {
        let deleted = playersocket[socket.id]
        savegame(playersocket[socket.id])
        console.log(chalk.red('player left'), chalk.yellowBright(deleted))
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
        if (type == 'savegame') {
            savegame(playersocket[socket.id])
        }
        if (type == 'blockdamage') {
            let blockmeta = info[0]
            let blocktype = blockmeta[1]

            let blockpos = {}
            blockpos['x'] = blockmeta[0].split(':')[0]
            blockpos['y'] = blockmeta[0].split(':')[1]

            let blockdamgelevel = info[1]

            for (let block in worldinfo[blocktype]) {
                let blockinfo = worldinfo[blocktype][block]
                if (blockinfo['x'] == blockpos['x']) {
                    if (blockinfo['y'] == blockpos['y']) {
                        blockinfo['d'] = blockdamgelevel
                        updategame('blockdamage', [blockmeta, blockinfo['d']])
                    }
                }
            }
        }
        if (type == 'blockbroken') {
            let blocktype = info[1]
            let player = info[2]
            
            let blockpos = {}
            blockpos['x'] = info[0].split(':')[0]
            blockpos['y'] = info[0].split(':')[1]

            let blockindex = findBlockIndex(blocktype, blockpos['x'], blockpos['y'])
            console.log(blockindex)
            delete worldinfo[blocktype][blockindex]
            updategame('blockbroken', info[0])
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
            playerpass[name] = pass
            console.log(pass)
            savepasswordtofile()
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

        function handlesuccess(id, color, pos, inventory) {
            console.log(chalk.yellowBright(`new player`), chalk.green(`${callback.name}`))
            let playerinfo = [id, color, pos, inventory]
            playersocket[socket.id] = callback.name

            updategame('playerjoin', playerinfo)
        }
    })
})

function findBlockIndex(blockType, targetX, targetY) {
    if (!worldinfo[blockType]) {
        return -1; // Block type does not exist
    }
    
    const blockArray = worldinfo[blockType];
    i = 0
    
    for (let elem in blockArray) {
        i++
        if (elem['x'] == targetX) {
            if (elem['y'] == targetY) {
                
            } else {
                return -1
            }
        } else {
            return -1
        }
    }
}


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
        updategame('worldfull', undefined)
        for (var key in gameinfo) {
            if (gameinfo.hasOwnProperty(key)) {
                var infoArray = gameinfo[key];
                updategame('playerjoin', infoArray)
            }
        }
    }
    if (updatetype == 'position') {
        io.emit('gameupdate', ['pos', info])
    }
    if (updatetype == 'worldfull') {
        io.emit('gameupdate', ['worldall', worldinfo])
    }
    if (updatetype == 'world') {
        io.emit('gameupdate', ['worldupdate', info])
    }
    if (updatetype == 'blockdamage') {
        let coords = info[0][0]
        let damagelevel = `damage${info[1]}`
        io.emit('gameupdate', ['blockdamage', [coords, damagelevel]])
    }
    if (updatetype == 'blockbroken') {
        console.log(worldinfo)
        io.emit('gmaeupdate', ['blockbroken', info])
    }
}

function savegame(player) {
    userinfo[player] = gameinfo[player]
    savegametofile()
    saveworldtofile()
}

function savegametofile() {
    let jsonuserinfo = JSON.stringify(userinfo)
    fs.writeFileSync('./gameinfo/userinfo.json', jsonuserinfo, (err) => {
        if (err) throw err;
    })
}

function savepasswordtofile() {
    let jsonpassinfo = JSON.stringify(playerpass)
    fs.writeFileSync('./gameinfo/playerpass.json', jsonpassinfo, (err) => {
        if (err) throw err;
    })
}

function saveworldtofile() {
    let worldpassinfo = JSON.stringify(worldinfo)
    fs.writeFileSync('./gameinfo/worldinfo.json', worldpassinfo, (err) => {
        if (err) throw err;
    })
}
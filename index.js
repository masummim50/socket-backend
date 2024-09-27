const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const cors = require('cors')


const users = {
}

const app = express();
app.use(cors())
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

app.get('/', (req, res) => {
    res.send("home page")
});

app.get("/isUnique/:userName", (req, res) => {
    const { userName } = req.params;

    if (users[userName]) {
        res.json({ unique: false })
    } else {

        res.json({ unique: true })
    }
})

const pending = {
    masum: [{ userName: 'alim', to: 'masum', message: 'message' }]
}


io.on('connection', (socket) => {
    console.log('a user connected', socket.id, socket.handshake.query);
    const userName = socket.handshake.query.userName;

    if(userName !== 'undefined'){
        console.log("reconnecting existing user")
        users[userName] = socket.id;
        socket.broadcast.emit("newUserAdded", users)
    }


    socket.on("userSignedUp", async (data) => {

        users[data.userName] = socket.id;
        socket.broadcast.emit("newUserAdded", users)
    })

    socket.on('sendUsers', () => {
        socket.emit("sendingUsers", users);
    })

    socket.on("sendMessage", (data) => {
        console.log("message: ", data);
        socket.to(users[data.to]).emit("receiveUserMessage", data)
    })



    socket.on('manualDisconnect', (userName) => {
        // find the username that has the id of socket.id and remove it and then emit to everyone newusersadded
        if(userName){
            console.log("manual disconnect hapening: ", userName)
            const copy = userName;
            delete users[userName];
            delete pending[userName];
            socket.broadcast.emit("newUserAdded", users)
            socket.broadcast.emit("userDisconnected", copy)
            console.log('user disconnected');
        }
    });
});

server.listen(3001, () => {
    console.log('server running at http://localhost:3001');
});
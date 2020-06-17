const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const messageBGC = {
    red: '#DB4437',
    green: '#0F9D58',
    yellow: '#F4B400',
    blue: '#4285F4'
};
const messageTC = {
    white: '#ffffff',
    grey: '#3e3e3e'
};

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log('new web socket connection');
    // socket.emit : send an event to specific client
    // io.emit : send an event to every connected client
    // socket.broadcast.emit : send an event to connected client except for specific client (current connected one)
    // io.to.emit : send an event to everybody in a specific room
    // socket.broadcast.to.emit : send an event to everybody in except for specific client (current connected one) but limited to the specific room

    try {
        socket.on('join', ({ username, room }, callback) => {
            const  { error, user } = addUser({id: socket.id, username, room});
    
            if (error){
                return callback(error);
            }
            socket.join(user.room);
    
            socket.emit('message', generateMessage('Admin', `Welcome to the '${user.room}' room!`, {boolTime: true, messageBGC: messageBGC.green, messageTC: messageTC.white}));
            socket.emit('message', generateMessage('Admin', `Invite others to join the chat to have a pleasant chat!`, {boolTime: false, messageBGC: messageBGC.green, messageTC: messageTC.white}));
            socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the chat!`, {boolTime: true, messageBGC: messageBGC.green, messageTC: messageTC.white}));
            
            io.to(user.room).emit('roomData', {
                room: user.room,
                users:  getUsersInRoom(user.room)
            });
            callback();
        });
    
        socket.on('sendMessage', (message, callback) => {
            const user = getUser(socket.id);
            const filter = new Filter();
    
            if(filter.isProfane(message)){
                return callback({error: 'Profanity is not allowed! Please watch your language!', boolTime: false, messageBGC: messageBGC.red, messageTC: messageTC.white});
            }
    
            io.to(user.room).emit('message', generateMessage(user.username, message, {boolTime: true}));
            callback();
        });
    
        socket.on('sendLocation', (coords, callback) => {
            const user = getUser(socket.id);
    
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://www.google.com/maps/@?q=${coords.latitude},${coords.longitude}`));
            // generateLocationMessage(`https://www.google.com/maps/@?api=1&map_action=map&center=${coords.latitude},${coords.longitude}`)
            // generateLocationMessage(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coords.latitude},${coords.longitude}`)
            callback();
        });
    
        socket.on('disconnect', () => {
            const user = removeUser(socket.id);
            if (user){
                io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left the chat!`, {boolTime: true, messageBGC: messageBGC.yellow, messageTC: messageTC.grey}));
                io.to(user.room).emit('roomData', {
                    room: user.room,
                    users:  getUsersInRoom(user.room)
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
});

module.exports = {
    app,
    server
};
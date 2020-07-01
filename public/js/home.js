const socket = io();

// Elements
const $roomList = document.querySelector('#active-room-list');
const roomName = document.querySelector('#room-list').innerHTML;

socket.on('activeRoomList', (activeRoom) => {
    const rooms = activeRoom.map((elem) => ({ room: elem }))
    const html = Mustache.render(roomName, { rooms });
    if (rooms.length > 0) $roomList.innerHTML = html;
    else $roomList.innerHTML = '';
});
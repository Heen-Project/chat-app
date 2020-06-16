const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');
// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
const adminMessageTemplate = document.querySelector('#admin-message-template').innerHTML;
// Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;
    // Height of the new message
    const newMessageStyle = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyle.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    // Visible height
    const visibleHeight = $messages.offsetHeight;
    // Height of message container
    const containerHeight = $messages.scrollHeight;
    // Current scroll position
    const scrollOffset = $messages.scrollTop + visibleHeight;
    // Validate only autoscroll if you are on the bottom of the chat 
    // (else you are scrolling chat history and doesn't need an autoscroll)
    if (containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

const disableInput = () => {
    $messageFormButton.setAttribute('disabled', 'disabled');
    $messageFormInput.setAttribute('disabled', 'disabled');
    $sendLocationButton.setAttribute('disabled', 'disabled');
}

const enableInput = () => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.removeAttribute('disabled');
    $sendLocationButton.removeAttribute('disabled');
    $messageFormInput.focus();
}

socket.on('message', (message) => {
    const isMe = message.username === username.trim().toLowerCase();
    const html = (message.username  === 'Admin') ? Mustache.render(adminMessageTemplate, {
        message: message.text,
        createdAt: (!message.boolTime)? '' : ' at '+moment(message.createdAt).format('h:mm a'),
        messageBGC: (!message.messageBGC)? '' : `background:${message.messageBGC+';'}`,
        messageTC: (!message.messageTC)? '' : `color:${message.messageTC+';'}`
    }): Mustache.render(messageTemplate, {
        username: isMe? 'me': `${message.username}`,
        message: message.text,
        float: isMe? 'right': 'left',
        createdAt: (!message.boolTime)? '' : moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (message) => {
    const isMe = message.username === username.trim().toLowerCase();
    const html = Mustache.render(locationTemplate, {
        username: isMe? 'me': `${message.username}`,
        location_username: isMe? 'my': `user '${message.username}'`,
        url: message.url,
        float: isMe? 'right': 'left',
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    });
    $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    disableInput();
    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => {
        $messageFormInput.value = '';
        enableInput();
        if (error){
            const html = Mustache.render(adminMessageTemplate, {
                message: error.error,
                createdAt: (!error.boolTime)? '' : ' at '+moment(error.createdAt).format('h:mm a'),
                messageBGC: (!error.messageBGC)? '' : `background:${error.messageBGC+';'}`,
                messageTC: (!error.messageTC)? '' : `color:${error.messageTC+';'}`
            });
            $messages.insertAdjacentHTML('beforeend', html);
            autoscroll();
        }
    });
});

$sendLocationButton.addEventListener('click', (e) => {
    e.preventDefault();
    disableInput();
    if (!navigator.geolocation) { // mdn geolocation
        enableInput();
        return alert('Geolocation is not supported by your browser');
    }
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (callback) => {
            enableInput();
        });
    }, (error) => {
        enableInput();
        if (error.code == error.PERMISSION_DENIED){
            const html = Mustache.render(adminMessageTemplate, {
                message: 'You denied permission to retrieve location data!',
                messageBGC: 'background:#DB4437;',
                messageTC: 'color:#FFFFFF;'
            });
            $messages.insertAdjacentHTML('beforeend', html);
        } else alert(error);
    });
});

socket.emit('join', {username,  room}, (error) => {
    if (error){
        alert(error);
        location.href = '/';
    }
});
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
const adminNotificationTemplate = document.querySelector('#admin-notification-template').innerHTML;
const adminWarningTemplate = document.querySelector('#admin-warning-template').innerHTML;
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
    const html = (message.username  === 'Admin' && message.text.includes('left')) ? Mustache.render(adminNotificationTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    }): (message.username  === 'Admin') ? Mustache.render(adminMessageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    }): Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        float: message.username === username.trim().toLowerCase()? 'right': 'left',
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        float: message.username === username.trim().toLowerCase()? 'right': 'left',
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
            const html = Mustache.render(adminWarningTemplate, {
                message: error
            });
            $messages.insertAdjacentHTML('beforeend', html);
            autoscroll();
        }
    });
});

$sendLocationButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (!navigator.geolocation) { // mdn geolocation
        return alert('Geolocation is not supported by your browser');
    }
    disableInput();
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (callback) => {
            enableInput();
        });
    });
});

socket.emit('join', {username,  room}, (error) => {
    if (error){
        alert(error);
        location.href = '/';
    }
});
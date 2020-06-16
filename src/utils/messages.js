const generateMessage = (username, text, {boolTime, messageBGC, messageTC}) => {
    return {
        username,
        text,
        createdAt: new Date().getTime(),
        boolTime,
        messageBGC,
        messageTC
    }
}
const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage, 
    generateLocationMessage
}
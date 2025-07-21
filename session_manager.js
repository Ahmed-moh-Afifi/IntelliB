var sessionManager = {
    messages: [],
    addMessage: function(message) {
        this.messages.push(message)
    }
}

module.exports = sessionManager
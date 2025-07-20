const express = require('express')

const app = express()
const botbuilder = require('botbuilder')

const adapter = new botbuilder.BotFrameworkAdapter({
    MicrosoftAppId: '',
    MicrosoftAppPassword: ''
})

// ************* Config *************
const port = 8000
// ************* Config *************

const testMiddleware = function(req, res, next) {
    console.log('Test Middleware Exectued!')
    next()
}

const loggerMiddleware = function(req, res, next) {
    console.log('Logged!')
    next()
}

app.use(express.json());
app.use(testMiddleware)
app.use(loggerMiddleware)

app.get('/', (req, res) => {
    res.send('This is the root!')
})

app.post('/api/messages', async (req, res) => {
    console.log('Received a post request')
    await adapter.processActivity(req, res, async (context) => {
        console.log(`activity.type = ${context.activity.type}`)
        if (context.activity.type === 'message') {
            const text = context.activity.text
            await context.sendActivity(`You said: ${text}`)
        }
    })
})

app.listen(port)
const express = require('express')

const app = express()
const botbuilder = require('botbuilder')
const Extractors = require('./extractors')
const intents = require('./intents')
const ResponseGenerator = require('./response_generator')
const sessionManager = require('./session_manager')
const Utils = require('./utils')

const adapter = new botbuilder.BotFrameworkAdapter({
    MicrosoftAppId: '',
    MicrosoftAppPassword: ''
})

// ************* Config *************
const port = 8000
// ************* Config *************

const testMiddleware = function(req, res, next) {
    console.log('Test Middleware Executed!')
    next()
}

const loggerMiddleware = function(req, res, next) {
    console.log('Logged!')
    next()
}

app.use(express.json());
// app.use(testMiddleware)
// app.use(loggerMiddleware)

app.get('/', (req, res) => {
    res.send('This is the root!')
})

app.post('/api/messages', async (req, res) => {
    console.log('Received a post request')
    await adapter.processActivity(req, res, async (context) => {
        console.log(`activity.type = ${context.activity.type}`)
        if (context.activity.type === 'message') {
            const text = context.activity.text
            sessionManager.addMessage(text)
            let intentExtractor = new Extractors.IntentExtractor()
            let intent = await intentExtractor.extractIntent(text, intents)
            console.log(`Extracted Intent: ${intent}`)
            let entityExtractor = new Extractors.EntityExtractor()
            let entity = await entityExtractor.extractCityEntity(text)
            console.log(`Extracted Entity: ${entity}`)
            entity = entity === 'no_city_found' || undefined ? await Utils.publicIp() : entity
            console.log(`Final Entity: ${entity}`)
            let responseGenerator = new ResponseGenerator()
            let response = await responseGenerator.generateResponse(intent, entity)
            await context.sendActivity(response)
        }
    })
})

app.listen(port)
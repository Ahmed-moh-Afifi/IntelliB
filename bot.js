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

const testMiddleware = function (req, res, next) {
    console.log('Test Middleware Executed!')
    next()
}

const loggerMiddleware = function (req, res, next) {
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
            let entity = await entityExtractor.extractEntity(text)
            console.log(`Extracted Entity: ${entity}`)
            entity = entity === 'local' ? await Utils.publicIp() : entity
            console.log(`Final Entity: ${entity}`)

            if (entity !== 'undefined') {
                let responseGenerator = new ResponseGenerator()
                let rawResponse = await responseGenerator.generateResponse(intent, entity)
                // await context.sendActivity(response)
                responseObject = JSON.parse(rawResponse)
                const adaptiveCard = {
                    type: "AdaptiveCard",
                    body: [
                        {
                            type: "ColumnSet",
                            columns: [
                                {
                                    type: "Column",
                                    width: "stretch",
                                    items: [
                                        {
                                            type: "TextBlock",
                                            text: responseObject.title,
                                            weight: "Bolder",
                                            size: "Large"
                                        }
                                    ]
                                },
                                {
                                    type: "Column",
                                    width: "auto",
                                    items: [
                                        {
                                            type: "Image",
                                            url: responseObject.icon,
                                            size: "Medium",
                                            style: "Person"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            type: "TextBlock",
                            text: responseObject.message,
                            wrap: true,
                            spacing: "Medium"
                        }
                    ],
                    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                    version: "1.3"
                };
                // const card = botbuilder.CardFactory.heroCard(intent !== 'undefined' ? intent : "Sorry, didn't get you!", `${responseObject.response}`, [responseObject.icon])
                await context.sendActivity({ attachments: [botbuilder.CardFactory.adaptiveCard(adaptiveCard)] })
            } else {
                await context.sendActivity("No such city")
            }
        }
    })
})

app.listen(port)
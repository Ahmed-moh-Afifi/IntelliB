const Groq = require("groq-sdk");
const intents = require("./intents.js");
const sessionManager = require("./session_manager.js");
const Weather = require("./weather.js");
require('dotenv').config();

class LLMGenerator {
    async generateGroq(intent, json) {
        console.log(`Logging json data from llm generator: ${json}`)
        const getWeather = Weather.getCurrentWeather
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        let chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a bot in a weather app. You will be given json response from a weather api and a user intent, and you should generate a human readable response for the user. In case the intent was undefined, you should use the available intents (${intents}) to tell the user what he could ask for. Answer using the same language of the last message. Your response should always be a json object with only three properties, a title property (Generate it based on the API response), a message property that contains the text message, and an icon property that contains the url of an image representing the weather. You will find the icon url in the json response given to you. If the intent was 'undefined', the title should be 'Sorry, didn't get you :(', and the icon should be an empty string. Add 'https:' at the beginning of the icon url if does not exist`,
                },
            ].concat(
                sessionManager.messages.map((m) => { return { role: "user", content: m } })
            ).concat([
                {
                    role: "user",
                    content: `User Intent: ${intent}\nJson Response: ${json}`,
                },
            ]),
            model: "llama-3.3-70b-versatile",
            tools: [
                {
                    type: "function",
                    function: {
                        name: "getWeather",
                        description: "Get current weather in a specific location",
                        parameters: {
                            type: "object",
                            properties: {
                                expression: {
                                    type: "string",
                                    description: "The mathematical expression to evaluate",
                                }
                            },
                            required: ["expression"],
                        },
                    },
                }
            ]
        });
        return chatCompletion.choices[0]?.message?.content || ""
    }
}

module.exports = LLMGenerator
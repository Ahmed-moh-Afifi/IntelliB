const Groq = require("groq-sdk");
const intents = require("./intents.js");
require('dotenv').config();

class LLMGenerator {
    async generateGroq(intent, json) {
        console.log(`Logging json data from llm generator: ${json}`)
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY});
        let chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a bot in a weather app. You will be given json response from a weather api and a user intent, and you should generate a human readable response for the user. In case the intent was undefined, you should use the available intents (${intents}) to tell the user what he could ask for.`,
                },
                {
                    role: "user",
                    content: `User Intent: ${intent}\nJson Response: ${json}`,
                },
            ],
            model: "llama-3.3-70b-versatile",
        });
        return chatCompletion.choices[0]?.message?.content || ""
    }
}

module.exports = LLMGenerator
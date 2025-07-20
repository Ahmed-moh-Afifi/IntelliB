const LLMGenerator = require("./groq.js");
const Weather = require("./weather.js");

class ResponseGenerator {
    async generateResponse(intent, location) {
        let weather = new Weather()
        let currentWeather = await weather.getCurrentWeather(location)

        let llmGenerator = new LLMGenerator()
        let response = await llmGenerator.generateGroq(intent, JSON.stringify(currentWeather))

        return response
    }
}

module.exports = ResponseGenerator
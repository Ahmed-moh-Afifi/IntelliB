require('dotenv').config();

class Weather {
    async getCurrentWeather(location) {
        let response = await fetch(`https://api.weatherapi.com/v1/current.json?q=${location}&key=${process.env.WEATHER_API_KEY}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'},
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        let data = await response.json()
        return data
    }
}

module.exports = Weather;
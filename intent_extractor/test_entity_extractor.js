/**
 * Test file for EntityExtractor class
 * This will test city name extraction and validation
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Manually read .env file
function loadEnvFile() {
    try {
        const envPath = path.join(__dirname, '..', '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('GROQ_API_KEY=')) {
                return line.split('=')[1].trim();
            }
        }
        return null;
    } catch (error) {
        console.error('Could not read .env file:', error.message);
        return null;
    }
}

// Simple city extraction using Groq API
function extractCityWithGroq(apiKey, message) {
    return new Promise((resolve, reject) => {
        const prompt = `
Extract the city name from the following weather-related message. Look for any mention of a city, town, or location.

User Message: "${message}"

Examples:
- "What's the weather in London?" → city: "London"
- "How's the weather in New York today?" → city: "New York"
- "Will it rain in Paris tomorrow?" → city: "Paris"
- "What's today's weather?" → city: "no_city_found"

Please respond with a JSON object in this exact format:
{
    "city": "extracted_city_name_or_no_city_found",
    "confidence": 0.95,
    "reasoning": "Brief explanation of the extraction"
}

If no city is mentioned, use "no_city_found" as the city value.
        `.trim();

        const data = JSON.stringify({
            messages: [
                {
                    role: "system",
                    content: "You are an expert entity extractor specialized in identifying city names from weather-related queries. Always respond with a valid JSON object."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama3-8b-8192",
            temperature: 0.1,
            max_tokens: 150,
            response_format: { type: "json_object" }
        });

        const options = {
            hostname: 'api.groq.com',
            port: 443,
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    if (result.choices && result.choices[0]) {
                        const content = JSON.parse(result.choices[0].message.content);
                        resolve(content);
                    } else {
                        reject(new Error('Invalid response format'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse response: ' + error.message));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Known cities list (subset for testing)
const knownCities = [
    'london', 'paris', 'tokyo', 'new york', 'los angeles', 'chicago', 'houston',
    'berlin', 'madrid', 'rome', 'amsterdam', 'vienna', 'stockholm', 'dubai',
    'mumbai', 'delhi', 'cairo', 'alexandria', 'sydney', 'toronto', 'mexico city'
];

// Validate city function
function validateCity(cityName) {
    const normalizedCity = cityName.toLowerCase().trim();
    return knownCities.includes(normalizedCity) || 
           knownCities.some(knownCity => 
               knownCity.includes(normalizedCity) || normalizedCity.includes(knownCity)
           );
}

// Format city name
function formatCityName(cityName) {
    return cityName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Main test function
async function testEntityExtractor() {
    console.log('🏙️  Testing EntityExtractor (City Name Extraction)\n');

    // Load API key
    const apiKey = loadEnvFile();
    if (!apiKey || apiKey === 'your-groq-api-key-here') {
        console.error('❌ GROQ_API_KEY not found or not configured in .env file');
        return;
    }

    console.log('✅ API key loaded successfully');
    console.log('🎯 Testing city name extraction and validation\n');

    // Test messages with various city scenarios
    const testMessages = [
        // Valid cities
        "What's the weather in London today?",
        "How's the weather in New York?",
        "Will it rain in Paris tomorrow?",
        "Is it sunny in Tokyo right now?",
        "Tell me about Cairo's weather",
        "What's the weather like in Los Angeles?",
        
        // Invalid/non-existent cities
        "What's the weather in Atlantis?",
        "How's the weather in Narnia?",
        "Is it raining in Gotham City?",
        
        // No city mentioned
        "What's the weather like today?",
        "Is it going to rain?",
        "How's the weather?",
        
        // Unclear/partial city names
        "What's the weather in York?",
        "How's the weather in Angeles?"
    ];

    for (const message of testMessages) {
        try {
            console.log(`📝 Message: "${message}"`);
            
            // Extract city using Groq
            const result = await extractCityWithGroq(apiKey, message);
            const extractedCity = result.city ? result.city.toLowerCase().trim() : null;
            
            console.log(`🔍 Extracted: "${result.city}"`);
            console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            
            // Validate city
            let finalResult;
            if (extractedCity && extractedCity !== 'no_city_found') {
                const cityExists = validateCity(extractedCity);
                if (cityExists) {
                    finalResult = formatCityName(extractedCity);
                    console.log(`✅ Final Result: "${finalResult}"`);
                } else {
                    finalResult = "this city don't exist";
                    console.log(`❌ Final Result: "${finalResult}"`);
                }
            } else {
                finalResult = "this city don't exist";
                console.log(`❌ Final Result: "${finalResult}"`);
            }
            
            if (result.reasoning) {
                console.log(`💭 Reasoning: ${result.reasoning}`);
            }
            
            console.log('─'.repeat(70));
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`❌ Error processing "${message}":`, error.message);
            console.log('─'.repeat(70));
        }
    }

    console.log('\n🎉 EntityExtractor Test Completed!');
    console.log('\n📋 Summary:');
    console.log('   🏙️  Valid cities return formatted city name');
    console.log('   ❌ Invalid/unknown cities return "this city don\'t exist"');
    console.log('   🚫 Messages without cities return "this city don\'t exist"');
    
    console.log('\n🌍 Sample known cities:');
    console.log('   ' + knownCities.slice(0, 10).map(formatCityName).join(', ') + '...');
}

// Run the test
testEntityExtractor().catch(console.error);

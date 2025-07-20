/**
 * Test the weather-specific IntentExtractor
 * This will test the three weather intents and "undefined" responses
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load weather intents
const weatherIntents = ["today's weather inquiry", "upcoming week's weather inquiry", "upcoming month's weather inquiry"];

// Manually read .env file
function loadEnvFile() {
    try {
        const envPath = path.join(__dirname, '.env');
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

// Make request to Groq API
function makeWeatherIntentRequest(apiKey, message) {
    return new Promise((resolve, reject) => {
        const prompt = `
Classify the following user message into one of the provided weather-related intents. If the message is NOT related to weather or doesn't match any of the specific intents, classify it as "undefined".

User Message: "${message}"

Available Weather Intents: ${weatherIntents.join(', ')}

Guidelines:
- "today's weather inquiry": Questions about current day weather
- "upcoming week's weather inquiry": Questions about weather for the next 7 days  
- "upcoming month's weather inquiry": Questions about weather for the next month
- "undefined": Use this for non-weather messages or unclear weather requests

Please respond with a JSON object in this exact format:
{
    "intent": "the_classified_intent_or_undefined",
    "confidence": 0.95,
    "reasoning": "Brief explanation of why this intent was chosen"
}

The intent must be exactly one of: ${weatherIntents.join(', ')}, undefined
`;

        const data = JSON.stringify({
            messages: [
                {
                    role: "system",
                    content: "You are an expert weather intent classifier. Analyze the user message and classify it into weather-related intents or 'undefined' for non-weather messages. Always respond with a valid JSON object."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama3-8b-8192",
            temperature: 0.1,
            max_tokens: 200,
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

// Main test function
async function testWeatherIntents() {
    console.log('🌤️  Testing Weather Intent Classifier\n');

    // Load API key
    const apiKey = loadEnvFile();
    if (!apiKey || apiKey === 'your-groq-api-key-here') {
        console.error('❌ GROQ_API_KEY not found or not configured in .env file');
        return;
    }

    console.log('✅ API key loaded successfully');
    console.log('🎯 Weather Intents:', weatherIntents.join(', '));
    console.log('🚫 Non-weather messages will return: "undefined"\n');

    // Test messages - mix of weather and non-weather
    const testMessages = [
        // Weather-related messages
        "What's the weather like today?",
        "How's the weather right now?",
        "Will it rain today?",
        
        "What's the weather forecast for next week?",
        "How will the weather be in the coming 7 days?",
        "Is it going to be sunny this week?",
        
        "What's the weather outlook for next month?",
        "How's the weather going to be in the upcoming month?",
        "Will we have snow this month?",
        
        // Non-weather messages (should return "undefined")
        "Hello, how are you?",
        "I need help with my booking",
        "What time is it?",
        "Tell me a joke",
        "How do I cook pasta?"
    ];

    for (const message of testMessages) {
        try {
            console.log(`📝 Message: "${message}"`);
            
            const result = await makeWeatherIntentRequest(apiKey, message);
            
            // Color code the output based on intent
            const isWeatherIntent = weatherIntents.includes(result.intent);
            const intentDisplay = isWeatherIntent ? `🌤️  ${result.intent}` : `🚫 ${result.intent}`;
            
            console.log(`🎯 Intent: ${intentDisplay}`);
            console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
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

    console.log('\n🎉 Weather Intent Classification Test Completed!');
    console.log('\n📋 Summary:');
    console.log(`   🌤️  Weather intents: ${weatherIntents.join(', ')}`);
    console.log('   🚫 Non-weather messages: "undefined"');
}

// Run the test
testWeatherIntents().catch(console.error);

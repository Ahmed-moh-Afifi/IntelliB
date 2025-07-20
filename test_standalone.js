/**
 * Standalone test for IntentExtractor (without external dependencies)
 * This version manually handles environment variables and HTTP requests
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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

// Simple HTTP request function
function makeGroqRequest(apiKey, message) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            messages: [
                {
                    role: "system",
                    content: "You are an expert intent classifier. Analyze the user message and classify it into one of these intents: greeting, question, help, booking, complaint, compliment, goodbye, other. Always respond with a valid JSON object."
                },
                {
                    role: "user",
                    content: `Classify this message into an intent: "${message}"\n\nRespond with JSON in this format:\n{\n  "intent": "the_classified_intent",\n  "confidence": 0.95,\n  "reasoning": "Brief explanation"\n}`
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
async function testIntentExtractor() {
    console.log('🤖 Testing IntentExtractor (Standalone Version)\n');

    // Load API key
    const apiKey = loadEnvFile();
    if (!apiKey || apiKey === 'your-groq-api-key-here') {
        console.error('❌ GROQ_API_KEY not found or not configured in .env file');
        return;
    }

    console.log('✅ API key loaded successfully');
    console.log(`🔑 Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}\n`);

    // Test messages
    const testMessages = [
        "Hello, how are you today?",
        "I need help with my booking",
        "Can you tell me about your services?",
        "Thank you and goodbye!"
    ];

    for (const message of testMessages) {
        try {
            console.log(`📝 Message: "${message}"`);
            
            const result = await makeGroqRequest(apiKey, message);
            
            console.log(`🎯 Intent: ${result.intent}`);
            console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            if (result.reasoning) {
                console.log(`💭 Reasoning: ${result.reasoning}`);
            }
            
            // Determine confidence level
            let confidenceLevel = 'Very Low';
            if (result.confidence >= 0.8) confidenceLevel = 'High';
            else if (result.confidence >= 0.6) confidenceLevel = 'Medium';
            else if (result.confidence >= 0.4) confidenceLevel = 'Low';
            
            console.log(`🎚️ Confidence Level: ${confidenceLevel}`);
            console.log('─'.repeat(50));
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`❌ Error processing "${message}":`, error.message);
            console.log('─'.repeat(50));
        }
    }

    console.log('\n🎉 Test completed!');
    console.log('\n💡 To use the full IntentExtractor class:');
    console.log('   1. Install dependencies: npm install dotenv groq-sdk');
    console.log('   2. Use: const extractor = new IntentExtractor();');
}

// Run the test
testIntentExtractor().catch(console.error);

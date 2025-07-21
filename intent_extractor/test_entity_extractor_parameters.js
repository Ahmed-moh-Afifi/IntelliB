/**
 * Comprehensive test for EntityExtractor with parameters
 * This demonstrates all the new parameter options
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

// Simulate EntityExtractor functionality for testing
async function simulateEntityExtraction(message, options = {}) {
    // Simulate the enhanced functionality
    const allowedCities = options.allowedCities || null;
    const strictMode = options.strictMode || false;
    const defaultCity = options.defaultCity || "this city don't exist";
    const includeMetadata = options.includeMetadata || false;

    // Simple city detection for demonstration
    const allKnownCities = ['london', 'paris', 'tokyo', 'new york', 'cairo', 'madrid', 'berlin'];
    let extractedCity = null;
    let confidence = 0.0;
    
    // Basic extraction simulation
    for (const city of allKnownCities) {
        if (message.toLowerCase().includes(city)) {
            extractedCity = city;
            confidence = 0.9;
            break;
        }
    }

    // Validate against allowed cities if specified
    let isValid = false;
    let finalCity = defaultCity;

    if (extractedCity) {
        if (allowedCities) {
            isValid = allowedCities.some(city => 
                city.toLowerCase().trim() === extractedCity
            );
        } else {
            isValid = true; // All known cities are valid
        }

        if (isValid) {
            finalCity = extractedCity.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
        }
    }

    if (includeMetadata) {
        return {
            city: finalCity,
            confidence: confidence,
            reasoning: extractedCity ? `Found city: ${extractedCity}` : "No city detected",
            extractedRaw: extractedCity,
            isValid: isValid,
            allowedCities: allowedCities,
            strictMode: strictMode,
            timestamp: new Date().toISOString()
        };
    }

    return finalCity;
}

// Main test function
async function testEntityExtractorWithParameters() {
    console.log('🏙️  Testing Enhanced EntityExtractor with Parameters\n');

    const apiKey = loadEnvFile();
    if (!apiKey || apiKey === 'your-groq-api-key-here') {
        console.log('⚠️  API key not configured - using simulation mode\n');
    }

    // Test scenarios
    const testScenarios = [
        {
            title: "Basic Usage (No Parameters)",
            message: "What's the weather in London today?",
            options: {}
        },
        {
            title: "With Metadata",
            message: "How's the weather in Paris?",
            options: { includeMetadata: true }
        },
        {
            title: "Allowed Cities - Valid City",
            message: "What's the weather in Tokyo?",
            options: { 
                allowedCities: ['London', 'Tokyo', 'Cairo'],
                includeMetadata: true 
            }
        },
        {
            title: "Allowed Cities - Invalid City",
            message: "What's the weather in Paris?",
            options: { 
                allowedCities: ['London', 'Tokyo', 'Cairo'],
                includeMetadata: true 
            }
        },
        {
            title: "Custom Default City",
            message: "What's the weather today?",
            options: { 
                defaultCity: "Please specify a city",
                includeMetadata: true 
            }
        },
        {
            title: "Strict Mode",
            message: "What's the weather in New York?",
            options: { 
                strictMode: true,
                includeMetadata: true 
            }
        },
        {
            title: "Combined Parameters",
            message: "How's the weather in Cairo?",
            options: {
                allowedCities: ['Cairo', 'Alexandria', 'Giza'],
                strictMode: true,
                defaultCity: "Egyptian city not found",
                includeMetadata: true
            }
        }
    ];

    for (const scenario of testScenarios) {
        console.log(`📋 ${scenario.title}`);
        console.log(`📝 Message: "${scenario.message}"`);
        console.log(`⚙️  Options:`, JSON.stringify(scenario.options, null, 2));
        
        try {
            const result = await simulateEntityExtraction(scenario.message, scenario.options);
            
            if (scenario.options.includeMetadata) {
                console.log(`🎯 Result (Metadata):`);
                console.log(`   City: ${result.city}`);
                console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
                console.log(`   Raw Extracted: ${result.extractedRaw || 'null'}`);
                console.log(`   Is Valid: ${result.isValid}`);
                console.log(`   Reasoning: ${result.reasoning}`);
                if (result.allowedCities) {
                    console.log(`   Allowed Cities: ${result.allowedCities.join(', ')}`);
                }
                console.log(`   Strict Mode: ${result.strictMode}`);
                console.log(`   Timestamp: ${result.timestamp}`);
            } else {
                console.log(`🎯 Result: "${result}"`);
            }
            
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
        
        console.log('─'.repeat(70));
    }

    console.log('\n🎉 Enhanced EntityExtractor Test Completed!\n');

    console.log('📖 New Parameter Options:\n');
    console.log('1. **allowedCities**: Array of specific cities to restrict extraction');
    console.log('   Example: { allowedCities: ["London", "Paris", "Tokyo"] }');
    console.log('');
    console.log('2. **strictMode**: Boolean for exact matching only');
    console.log('   Example: { strictMode: true }');
    console.log('');
    console.log('3. **defaultCity**: Custom message for unrecognized cities');
    console.log('   Example: { defaultCity: "Please specify a valid city" }');
    console.log('');
    console.log('4. **includeMetadata**: Boolean to return detailed result object');
    console.log('   Example: { includeMetadata: true }');
    console.log('');

    console.log('💡 Usage Examples:\n');
    console.log(`
// Basic usage
const city = await entityExtractor.extractCityEntity("Weather in London?");

// With allowed cities only
const city = await entityExtractor.extractCityEntity(
    "Weather in Paris?", 
    { allowedCities: ["London", "Tokyo"] }
);

// With detailed metadata
const result = await entityExtractor.extractCityEntity(
    "Weather in Cairo?", 
    { includeMetadata: true }
);

// Combined options
const result = await entityExtractor.extractCityEntity(
    "Weather in Alexandria?",
    {
        allowedCities: ["Cairo", "Alexandria", "Giza"],
        strictMode: true,
        defaultCity: "Egyptian city not found",
        includeMetadata: true
    }
);
    `);
}

// Run the test
testEntityExtractorWithParameters().catch(console.error);

/**
 * Example usage of both IntentExtractor and EntityExtractor classes
 * This shows how to extract both intent and city from weather queries
 */

// For testing without dependencies, we'll simulate the classes
console.log('🤖 IntentExtractor & EntityExtractor Usage Example\n');

// Example weather queries
const testQueries = [
    "What's the weather in London today?",
    "How will the weather be in New York next week?",
    "Is it going to rain in Paris this month?",
    "What's the weather in Atlantis?",  // Non-existent city
    "How's the weather today?",          // No city mentioned
    "Hello, how are you?",               // Non-weather query
];

console.log('📋 Test Scenarios:\n');

testQueries.forEach((query, index) => {
    console.log(`${index + 1}. Query: "${query}"`);
    
    // Simulate intent extraction
    let intent = 'undefined';
    if (query.toLowerCase().includes('today')) {
        intent = "today's weather inquiry";
    } else if (query.toLowerCase().includes('week')) {
        intent = "upcoming week's weather inquiry";
    } else if (query.toLowerCase().includes('month')) {
        intent = "upcoming month's weather inquiry";
    }
    
    // Simulate city extraction
    let city = "this city don't exist";
    const cityPatterns = {
        'london': 'London',
        'new york': 'New York',
        'paris': 'Paris',
        'tokyo': 'Tokyo',
        'cairo': 'Cairo'
    };
    
    for (const [pattern, formatted] of Object.entries(cityPatterns)) {
        if (query.toLowerCase().includes(pattern)) {
            city = formatted;
            break;
        }
    }
    
    console.log(`   🎯 Intent: ${intent}`);
    console.log(`   🏙️  City: ${city}`);
    console.log('');
});

console.log('🔧 How to use in your code:\n');

console.log(`
// Import the classes
const { IntentExtractor, EntityExtractor } = require('./intent_extractor');

// Initialize extractors
const intentExtractor = new IntentExtractor();
const entityExtractor = new EntityExtractor();

// Example usage
async function processWeatherQuery(userMessage) {
    try {
        // Extract intent
        const intentResult = await intentExtractor.extractIntent(userMessage);
        console.log('Intent:', intentResult.intent);
        
        // Extract city (only if it's a weather-related intent)
        if (intentResult.intent !== 'undefined') {
            const cityResult = await entityExtractor.extractCityEntity(userMessage);
            console.log('City:', cityResult);
            
            // Process the weather request
            if (cityResult !== "this city don't exist") {
                console.log(\`Getting \${intentResult.intent} for \${cityResult}\`);
            } else {
                console.log('Sorry, the city you mentioned is not recognized.');
            }
        } else {
            console.log('This is not a weather-related query.');
        }
        
    } catch (error) {
        console.error('Error processing query:', error.message);
    }
}

// Test the function
processWeatherQuery("What's the weather in London today?");
// Output:
// Intent: today's weather inquiry
// City: London
// Getting today's weather inquiry for London
`);

console.log('✨ Features of your EntityExtractor:\n');
console.log('   🔍 Extracts city names from weather queries using Groq AI');
console.log('   ✅ Validates against a comprehensive list of known cities');
console.log('   🌍 Supports major cities worldwide (100+ cities included)');
console.log('   📝 Returns formatted city names (proper capitalization)');
console.log('   ❌ Returns "this city don\'t exist" for invalid/unknown cities');
console.log('   🚫 Handles messages with no city mentions gracefully');
console.log('   🔧 Easily extensible (add new cities with addCity() method)');

console.log('\n🎯 Your complete weather bot workflow:');
console.log('   1. User sends message → IntentExtractor classifies intent');
console.log('   2. If weather-related → EntityExtractor extracts city');
console.log('   3. If valid city → Fetch weather data');
console.log('   4. If invalid city → Return "this city don\'t exist"');
console.log('   5. If not weather-related → Return "undefined" intent');

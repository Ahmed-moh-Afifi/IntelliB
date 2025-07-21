/**
 * Real test using actual IntentExtractor and EntityExtractor classes
 */

const { IntentExtractor, EntityExtractor } = require('./intent_extractor');

async function testRealExtractors() {
    console.log('🧪 Testing Real EntityExtractor with Enhanced Country Detection\n');

    try {
        const entityExtractor = new EntityExtractor();

        // Test cases that the user specifically asked for
        const testCases = [
            {
                name: "UAE Test (User's Example)",
                message: "How is the weather in United Arab Emirates?",
                description: "Should return country info with capital"
            },
            {
                name: "UAE Short Form",
                message: "What's the weather in UAE?",
                description: "Should work with UAE abbreviation"
            },
            {
                name: "Valid City - Abu Dhabi",
                message: "What's the weather in Abu Dhabi?",
                description: "Should return the city name for weather lookup"
            },
            {
                name: "France Country Test",
                message: "How's the weather in France?",
                description: "Should return France country info"
            },
            {
                name: "Valid City - Paris",
                message: "What's the weather in Paris?",
                description: "Should return Paris for weather lookup"
            }
        ];

        for (const testCase of testCases) {
            console.log(`\n📋 ${testCase.name}`);
            console.log(`📝 Input: "${testCase.message}"`);
            console.log(`📖 Expected: ${testCase.description}`);
            
            try {
                // Test basic extraction
                const result = await entityExtractor.extractCityEntity(testCase.message);
                console.log(`✅ Result: "${result}"`);

                // Test with metadata to see detailed info
                const detailedResult = await entityExtractor.extractCityEntity(
                    testCase.message, 
                    { includeMetadata: true }
                );
                
                if (detailedResult.isCountry) {
                    console.log(`🌍 Detected Country: ${detailedResult.countryDetected}`);
                    console.log(`🏛️ Capital: ${detailedResult.capital}`);
                }
                
                console.log(`📊 Valid City: ${detailedResult.isValid ? 'Yes' : 'No'}`);
                console.log(`📊 Is Country: ${detailedResult.isCountry ? 'Yes' : 'No'}`);

            } catch (error) {
                console.error(`❌ Error: ${error.message}`);
            }
            
            console.log('─'.repeat(60));
        }

        console.log('\n🎉 All tests completed!\n');

        // Show the exact output format the user requested
        console.log('✨ User\'s Exact Example:');
        console.log('Input: "How is the weather in United Arab Emirates?"');
        const uaeResult = await entityExtractor.extractCityEntity("How is the weather in United Arab Emirates?");
        console.log(`Output: "${uaeResult}"`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the real test
testRealExtractors();

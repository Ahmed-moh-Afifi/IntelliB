/**
 * Simple test for the enhanced EntityExtractor
 */

const { EntityExtractor } = require('./intent_extractor/intent_extractor');

async function simpleTest() {
    console.log('🧪 Testing Enhanced EntityExtractor\n');

    const extractor = new EntityExtractor();

    // The exact test case the user requested
    console.log('🌍 Testing: "How is the weather in United Arab Emirates?"');
    
    try {
        const result = await extractor.extractCityEntity("How is the weather in United Arab Emirates?");
        console.log(`✅ Result: "${result}"`);
        
        // Test with metadata
        const detailed = await extractor.extractCityEntity(
            "How is the weather in United Arab Emirates?", 
            { includeMetadata: true }
        );
        
        if (detailed.isCountry) {
            console.log(`🌍 Country: ${detailed.countryDetected}`);
            console.log(`🏛️ Capital: ${detailed.capital}`);
        }

        console.log('\n─'.repeat(50));
        
        // Test a few more cases
        console.log('\n🌍 Testing: "What\'s the weather in UAE?"');
        const uaeResult = await extractor.extractCityEntity("What's the weather in UAE?");
        console.log(`✅ Result: "${uaeResult}"`);

        console.log('\n🏙️ Testing: "What\'s the weather in Abu Dhabi?"');
        const cityResult = await extractor.extractCityEntity("What's the weather in Abu Dhabi?");
        console.log(`✅ Result: "${cityResult}"`);

        console.log('\n🌍 Testing: "How is the weather in France?"');
        const franceResult = await extractor.extractCityEntity("How is the weather in France?");
        console.log(`✅ Result: "${franceResult}"`);

        console.log('\n🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

simpleTest();

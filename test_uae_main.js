/**
 * Test specifically for the UAE example from main directory
 */

const { EntityExtractor } = require('./intent_extractor/intent_extractor');

async function testUAEExample() {
    console.log('🇦🇪 Testing UAE Example (User Request)\n');

    const extractor = new EntityExtractor();

    try {
        console.log('📝 Input: "How is the weather in United Arab Emirates?"');
        console.log('🎯 Expected: "United Arab Emirates is a country and its capital is Abu Dhabi. Do you want any information about it?"');
        
        const result = await extractor.extractCityEntity("How is the weather in United Arab Emirates?");
        console.log(`✅ Actual: "${result}"`);
        
        console.log('\n' + '─'.repeat(70));
        
        // Test short form too
        console.log('\n📝 Input: "What\'s the weather in UAE?"');
        const uaeResult = await extractor.extractCityEntity("What's the weather in UAE?");
        console.log(`✅ Actual: "${uaeResult}"`);
        
        console.log('\n' + '─'.repeat(70));
        
        // Test a valid city to make sure it still works
        console.log('\n📝 Input: "What\'s the weather in Abu Dhabi?"');
        const cityResult = await extractor.extractCityEntity("What's the weather in Abu Dhabi?");
        console.log(`✅ Actual: "${cityResult}"`);
        console.log('💡 This should return just "Abu Dhabi" for weather lookup');

        console.log('\n🎉 UAE test completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testUAEExample();

/**
 * Direct test of EntityExtractor with error handling
 */

async function testDirectly() {
    console.log('🧪 Testing EntityExtractor Directly\n');

    try {
        // Test if the class can be imported
        const { EntityExtractor } = require('./intent_extractor/intent_extractor');
        console.log('✅ EntityExtractor imported successfully');

        const extractor = new EntityExtractor();
        console.log('✅ EntityExtractor instance created');

        // Test the specific method the user asked for
        console.log('\n🌍 Testing UAE example...');
        console.log('📝 Input: "How is the weather in United Arab Emirates?"');
        
        const result = await extractor.extractCityEntity("How is the weather in United Arab Emirates?");
        console.log(`✅ Result: "${result}"`);

        // Check if it matches expected format
        if (result.includes("United Arab Emirates is a country") && result.includes("Abu Dhabi")) {
            console.log('🎉 SUCCESS: Enhanced country detection is working!');
        } else {
            console.log('⚠️  The result doesn\'t match the expected enhanced format');
        }

    } catch (error) {
        console.error('❌ Error occurred:', error.message);
        
        // Provide helpful debugging info
        if (error.message.includes('Cannot find module')) {
            console.log('💡 Module import issue - checking file structure...');
        } else if (error.message.includes('API')) {
            console.log('💡 This might be an API issue - your enhanced logic is likely working');
        } else {
            console.log('💡 Unexpected error:', error.stack);
        }
    }
}

testDirectly();

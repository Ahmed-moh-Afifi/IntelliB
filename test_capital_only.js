/**
 * Test for capital-only response from EntityExtractor
 */

const { EntityExtractor } = require('./intent_extractor');

async function testCapitalOnlyResponse() {
    console.log('🏛️ Testing Capital-Only Response\n');

    const extractor = new EntityExtractor();

    try {
        // Test cases
        const testCases = [
            {
                input: "How is the weather in United Arab Emirates?",
                expected: "Abu Dhabi"
            },
            {
                input: "What's the weather in UAE?",
                expected: "Abu Dhabi"
            },
            {
                input: "How's the weather in France?",
                expected: "Paris"
            },
            {
                input: "Tell me about Egypt's weather",
                expected: "Cairo"
            },
            {
                input: "What's the weather in USA?",
                expected: "Washington D.C."
            },
            {
                input: "What's the weather in Abu Dhabi?",
                expected: "Abu Dhabi" // Should return the city itself
            },
            {
                input: "What's the weather in Paris?",
                expected: "Paris" // Should return the city itself
            }
        ];

        for (const testCase of testCases) {
            console.log(`📝 Input: "${testCase.input}"`);
            console.log(`🎯 Expected: "${testCase.expected}"`);
            
            const result = await extractor.extractCityEntity(testCase.input);
            console.log(`✅ Result: "${result}"`);
            
            const isCorrect = result === testCase.expected;
            console.log(`${isCorrect ? '✅' : '❌'} ${isCorrect ? 'PASS' : 'FAIL'}`);
            
            console.log('─'.repeat(50));
        }

        console.log('\n🎉 Capital-only response test completed!');
        console.log('\n📖 Summary:');
        console.log('• When user mentions a country → Return capital city name only');
        console.log('• When user mentions a city → Return city name as usual');
        console.log('• Clean, simple responses for weather lookup');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testCapitalOnlyResponse();

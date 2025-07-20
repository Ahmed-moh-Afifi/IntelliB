/**
 * Simple test to verify IntentExtractor setup
 * This will test if the API key is loaded correctly
 */

// Load environment variables
require('dotenv').config();

console.log('🔍 Checking IntentExtractor setup...\n');

// Check if API key is loaded
const apiKey = process.env.GROQ_API_KEY;
if (apiKey) {
    console.log('✅ GROQ_API_KEY found in environment');
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
} else {
    console.log('❌ GROQ_API_KEY not found in environment');
    process.exit(1);
}

// Try to initialize IntentExtractor
try {
    const IntentExtractor = require('./intent_extractor');
    const intentExtractor = new IntentExtractor();
    console.log('✅ IntentExtractor initialized successfully');
    
    // Test a simple intent extraction
    console.log('\n🧪 Testing intent extraction...');
    
    const testMessage = "Hello, how are you?";
    console.log(`📝 Test message: "${testMessage}"`);
    
    intentExtractor.extractIntent(testMessage)
        .then(result => {
            console.log('✅ Intent extraction successful!');
            console.log(`🎯 Detected intent: ${result.intent}`);
            console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            if (result.reasoning) {
                console.log(`💭 Reasoning: ${result.reasoning}`);
            }
            console.log('\n🎉 Your IntentExtractor is working perfectly!');
        })
        .catch(error => {
            console.error('❌ Intent extraction failed:', error.message);
            console.log('\n💡 Possible issues:');
            console.log('   - Check your API key is valid');
            console.log('   - Ensure you have internet connection');
            console.log('   - Verify groq-sdk is installed: npm install groq-sdk');
        });
        
} catch (error) {
    console.error('❌ Failed to initialize IntentExtractor:', error.message);
    console.log('\n💡 Make sure to install dependencies: npm install');
}

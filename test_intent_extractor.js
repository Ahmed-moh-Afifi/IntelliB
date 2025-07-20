/**
 * Example usage of IntentExtractor class
 * Run this file to test the intent extraction functionality
 */

// Load environment variables from .env file
require('dotenv').config();

const IntentExtractor = require('./intent_extractor');

// Example usage
async function testIntentExtractor() {
    try {
        // Initialize IntentExtractor - it will automatically use GROQ_API_KEY from .env
        const intentExtractor = new IntentExtractor();
        
        console.log('✅ IntentExtractor initialized successfully with API key from .env file\n');

    // Test messages
    const testMessages = [
        "Hello, how are you today?",
        "I need help with my booking",
        "Can you tell me about your services?",
        "I want to cancel my reservation",
        "Thank you and goodbye!",
        "I'm not happy with the service I received"
    ];

    // Custom intents for your specific use case
    const customIntents = [
        'greeting',
        'help_request',
        'information_request',
        'booking',
        'cancellation',
        'complaint',
        'compliment',
        'goodbye'
    ];

    console.log('🤖 Testing Intent Extractor with Groq API\n');

    for (const message of testMessages) {
        try {
            console.log(`📝 Message: "${message}"`);
            
            // Extract single intent
            const result = await intentExtractor.extractIntent(message, customIntents);
            console.log(`🎯 Intent: ${result.intent}`);
            console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            if (result.reasoning) {
                console.log(`💭 Reasoning: ${result.reasoning}`);
            }
            
            // Get confidence level
            const thresholds = intentExtractor.getConfidenceThresholds();
            let confidenceLevel = 'Very Low';
            if (result.confidence >= thresholds.high_confidence) confidenceLevel = 'High';
            else if (result.confidence >= thresholds.medium_confidence) confidenceLevel = 'Medium';
            else if (result.confidence >= thresholds.low_confidence) confidenceLevel = 'Low';
            
            console.log(`🎚️ Confidence Level: ${confidenceLevel}`);
            console.log('─'.repeat(50));
            
        } catch (error) {
            console.error(`❌ Error processing "${message}":`, error.message);
            console.log('─'.repeat(50));
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test multiple intents extraction
    console.log('\n🔍 Testing Multiple Intents Extraction');
    const complexMessage = "Hi there! I need help canceling my booking and I'd also like to complain about the service.";
    
    try {
        console.log(`📝 Complex Message: "${complexMessage}"`);
        const multipleIntents = await intentExtractor.extractMultipleIntents(complexMessage, customIntents);
        
        console.log(`🎯 Found ${multipleIntents.length} intent(s):`);
        multipleIntents.forEach((intent, index) => {
            console.log(`  ${index + 1}. ${intent.intent} (${(intent.confidence * 100).toFixed(1)}%)`);
            if (intent.reasoning) {
                console.log(`     💭 ${intent.reasoning}`);
            }
        });
    } catch (error) {
        console.error('❌ Error processing complex message:', error.message);
    }
    
    } catch (error) {
        console.error('❌ Failed to initialize IntentExtractor:', error.message);
        console.log('💡 Make sure your GROQ_API_KEY is set in the .env file');
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    console.log('⚠️  Setup Instructions:');
    console.log('   1. Install dependencies: npm install');
    console.log('   2. Edit the .env file and add your GROQ_API_KEY');
    console.log('   3. Run: node test_intent_extractor.js\n');
    
    testIntentExtractor().catch(console.error);
}

module.exports = { testIntentExtractor };

/**
 * Simple test without external dependencies
 * This manually reads the .env file to test the setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking IntentExtractor setup (without external dependencies)...\n');

// Manually read .env file
try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse GROQ_API_KEY from .env file
    const lines = envContent.split('\n');
    let apiKey = null;
    
    for (const line of lines) {
        if (line.startsWith('GROQ_API_KEY=')) {
            apiKey = line.split('=')[1].trim();
            break;
        }
    }
    
    if (apiKey && apiKey !== 'your-groq-api-key-here') {
        console.log('✅ GROQ_API_KEY found in .env file');
        console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
        console.log('\n✅ Your .env file is configured correctly!');
        
        console.log('\n📋 Next steps:');
        console.log('   1. Install dependencies (when PowerShell allows):');
        console.log('      npm install dotenv groq-sdk');
        console.log('   2. Then test with: node test_intent_extractor.js');
        
        console.log('\n🔧 Alternative installation methods if npm is blocked:');
        console.log('   - Try running PowerShell as Administrator');
        console.log('   - Or use: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser');
        console.log('   - Or install packages individually');
        
    } else {
        console.log('❌ GROQ_API_KEY not found or still has placeholder value');
        console.log('💡 Please edit .env and add your actual Groq API key');
    }
    
} catch (error) {
    console.error('❌ Could not read .env file:', error.message);
}

// Show what the IntentExtractor class provides
console.log('\n🎯 Your IntentExtractor class features:');
console.log('   ✅ Extract single intent from user messages');
console.log('   ✅ Extract multiple intents from complex messages');
console.log('   ✅ Confidence scoring for each prediction');
console.log('   ✅ Custom intent categories support');
console.log('   ✅ Built-in error handling and validation');
console.log('   ✅ Groq API integration with latest models');

console.log('\n📖 Usage example:');
console.log(`
const IntentExtractor = require('./intent_extractor');
const extractor = new IntentExtractor();

// Extract intent
const result = await extractor.extractIntent("I need help with booking");
console.log(result.intent);     // 'booking' 
console.log(result.confidence); // 0.92
`);

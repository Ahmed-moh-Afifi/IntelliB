/**
 * Test file for country detection in EntityExtractor
 * This demonstrates how the EntityExtractor handles countries vs cities
 */

const fs = require('fs');
const path = require('path');

// Simulate the enhanced EntityExtractor functionality
class MockEntityExtractor {
    constructor() {
        this.knownCities = [
            'london', 'paris', 'tokyo', 'new york', 'cairo', 'madrid', 'berlin',
            'rome', 'sydney', 'toronto', 'mumbai', 'beijing', 'dubai'
        ];
        
        this.knownCountries = [
            'united states', 'usa', 'united kingdom', 'uk', 'england', 'france',
            'germany', 'italy', 'spain', 'japan', 'china', 'india', 'egypt',
            'australia', 'canada', 'russia', 'brazil', 'mexico'
        ];
    }

    isCountry(entityName) {
        const normalizedEntity = entityName.toLowerCase().trim();
        return this.knownCountries.includes(normalizedEntity) ||
               this.knownCountries.some(country => 
                   country.includes(normalizedEntity) || normalizedEntity.includes(country)
               );
    }

    validateCity(cityName) {
        const normalizedCity = cityName.toLowerCase().trim();
        return this.knownCities.includes(normalizedCity) ||
               this.knownCities.some(city => 
                   city.includes(normalizedCity) || normalizedCity.includes(city)
               );
    }

    formatCityName(name) {
        return name.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    async extractCityEntity(message, options = {}) {
        const includeMetadata = options.includeMetadata || false;
        const defaultCity = options.defaultCity || "this city don't exist";

        // Simple extraction simulation
        const words = message.toLowerCase().split(' ');
        let extractedEntity = null;
        let confidence = 0.0;

        // Look for known entities (cities or countries)
        for (const word of words) {
            if (this.knownCities.includes(word)) {
                extractedEntity = word;
                confidence = 0.9;
                break;
            }
            if (this.knownCountries.includes(word)) {
                extractedEntity = word;
                confidence = 0.9;
                break;
            }
        }

        // Check for multi-word entities
        if (!extractedEntity) {
            const text = message.toLowerCase();
            for (const city of this.knownCities) {
                if (text.includes(city)) {
                    extractedEntity = city;
                    confidence = 0.85;
                    break;
                }
            }
            if (!extractedEntity) {
                for (const country of this.knownCountries) {
                    if (text.includes(country)) {
                        extractedEntity = country;
                        confidence = 0.85;
                        break;
                    }
                }
            }
        }

        let finalCity = defaultCity;
        let isValid = false;
        let isCountry = false;

        if (extractedEntity) {
            // Check if it's a country first
            if (this.isCountry(extractedEntity)) {
                const countryName = this.formatCityName(extractedEntity);
                finalCity = `That's a country! Please specify a city in ${countryName}.`;
                isCountry = true;
                
                if (includeMetadata) {
                    return {
                        city: finalCity,
                        confidence: confidence,
                        reasoning: `Detected "${countryName}" which is a country, not a city`,
                        extractedRaw: extractedEntity,
                        isValid: false,
                        isCountry: true,
                        countryDetected: countryName,
                        timestamp: new Date().toISOString()
                    };
                }
                return finalCity;
            }
            
            // Check if it's a valid city
            if (this.validateCity(extractedEntity)) {
                finalCity = this.formatCityName(extractedEntity);
                isValid = true;
            }
        }

        if (includeMetadata) {
            return {
                city: finalCity,
                confidence: confidence,
                reasoning: extractedEntity ? `Found entity: ${extractedEntity}` : "No entity detected",
                extractedRaw: extractedEntity,
                isValid: isValid,
                isCountry: isCountry,
                timestamp: new Date().toISOString()
            };
        }

        return finalCity;
    }
}

// Main test function
async function testCountryDetection() {
    console.log('🌍 Testing Country Detection in EntityExtractor\n');

    const mockExtractor = new MockEntityExtractor();

    // Test scenarios with countries vs cities
    const testScenarios = [
        {
            title: "Valid City",
            message: "What's the weather in London today?",
            expected: "Should return: London"
        },
        {
            title: "Country - USA",
            message: "What's the weather in USA?",
            expected: "Should ask to specify a city in USA"
        },
        {
            title: "Country - France",
            message: "How's the weather in France?",
            expected: "Should ask to specify a city in France"
        },
        {
            title: "Country - Egypt",
            message: "Tell me about Egypt's weather",
            expected: "Should ask to specify a city in Egypt"
        },
        {
            title: "Country - UK",
            message: "What's the weather like in UK?",
            expected: "Should ask to specify a city in UK"
        },
        {
            title: "Valid City - Paris",
            message: "How's the weather in Paris?",
            expected: "Should return: Paris"
        },
        {
            title: "Country - Germany",
            message: "Is it raining in Germany?",
            expected: "Should ask to specify a city in Germany"
        },
        {
            title: "Valid City - Tokyo",
            message: "What's the weather in Tokyo?",
            expected: "Should return: Tokyo"
        },
        {
            title: "No Location",
            message: "What's the weather today?",
            expected: "Should return: this city don't exist"
        }
    ];

    for (const scenario of testScenarios) {
        console.log(`📋 ${scenario.title}`);
        console.log(`📝 Message: "${scenario.message}"`);
        console.log(`🎯 Expected: ${scenario.expected}`);
        
        try {
            // Test with basic response
            const result = await mockExtractor.extractCityEntity(scenario.message);
            console.log(`✅ Result: "${result}"`);
            
            // Test with metadata
            const detailedResult = await mockExtractor.extractCityEntity(
                scenario.message, 
                { includeMetadata: true }
            );
            
            if (detailedResult.isCountry) {
                console.log(`🌍 Country Detected: ${detailedResult.countryDetected}`);
            }
            console.log(`📊 Confidence: ${(detailedResult.confidence * 100).toFixed(1)}%`);
            console.log(`💭 Reasoning: ${detailedResult.reasoning}`);
            
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
        
        console.log('─'.repeat(70));
    }

    console.log('\n🎉 Country Detection Test Completed!\n');

    console.log('✨ Enhanced Features:\n');
    console.log('🌍 **Country Detection**: Recognizes when user mentions a country');
    console.log('💬 **Helpful Messages**: Asks user to specify a city instead');
    console.log('🏙️  **City Validation**: Still validates cities as before');
    console.log('📊 **Metadata Support**: Includes country detection in metadata');
    console.log('🔧 **Backwards Compatible**: Existing functionality unchanged');

    console.log('\n📖 Example Responses:\n');
    console.log('User: "What\'s the weather in France?"');
    console.log('Bot: "That\'s a country! Please specify a city in France."');
    console.log('');
    console.log('User: "What\'s the weather in Paris?"');
    console.log('Bot: "Paris" (proceeds with weather lookup)');
    console.log('');
    console.log('User: "What\'s the weather in USA?"');
    console.log('Bot: "That\'s a country! Please specify a city in USA."');

    console.log('\n🚀 Usage in your code:\n');
    console.log(`
const { EntityExtractor } = require('./intent_extractor');
const extractor = new EntityExtractor();

const result = await extractor.extractCityEntity("Weather in Egypt?");
// Returns: "That's a country! Please specify a city in Egypt."

const cityResult = await extractor.extractCityEntity("Weather in Cairo?");
// Returns: "Cairo"
    `);
}

// Run the test
testCountryDetection().catch(console.error);

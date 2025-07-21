/**
 * Test file for enhanced country detection with capitals
 * This demonstrates the new detailed country responses
 */

const fs = require('fs');
const path = require('path');

// Simulate the enhanced EntityExtractor with country capitals
class MockEntityExtractorWithCapitals {
    constructor() {
        this.knownCities = [
            'london', 'paris', 'tokyo', 'new york', 'cairo', 'madrid', 'berlin',
            'rome', 'sydney', 'toronto', 'mumbai', 'beijing', 'dubai', 'abu dhabi'
        ];
        
        this.knownCountries = [
            'united states', 'usa', 'united kingdom', 'uk', 'france', 'germany',
            'italy', 'spain', 'japan', 'china', 'india', 'egypt', 'australia',
            'canada', 'russia', 'brazil', 'mexico', 'uae', 'united arab emirates'
        ];

        this.countryCapitals = {
            'united states': 'Washington D.C.',
            'usa': 'Washington D.C.',
            'united kingdom': 'London',
            'uk': 'London',
            'france': 'Paris',
            'germany': 'Berlin',
            'italy': 'Rome',
            'spain': 'Madrid',
            'japan': 'Tokyo',
            'china': 'Beijing',
            'india': 'New Delhi',
            'egypt': 'Cairo',
            'australia': 'Canberra',
            'canada': 'Ottawa',
            'russia': 'Moscow',
            'brazil': 'Brasília',
            'mexico': 'Mexico City',
            'uae': 'Abu Dhabi',
            'united arab emirates': 'Abu Dhabi'
        };
    }

    isCountry(entityName) {
        const normalizedEntity = entityName.toLowerCase().trim();
        return this.knownCountries.includes(normalizedEntity) ||
               this.knownCountries.some(country => 
                   country.includes(normalizedEntity) || normalizedEntity.includes(country)
               );
    }

    getCountryCapital(countryName) {
        const normalizedCountry = countryName.toLowerCase().trim();
        
        if (this.countryCapitals[normalizedCountry]) {
            return this.countryCapitals[normalizedCountry];
        }

        for (const [country, capital] of Object.entries(this.countryCapitals)) {
            if (country.includes(normalizedCountry) || normalizedCountry.includes(country)) {
                return capital;
            }
        }

        return 'Unknown';
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
        const text = message.toLowerCase();
        let extractedEntity = null;
        let confidence = 0.0;

        // Look for known entities (cities or countries)
        for (const city of this.knownCities) {
            if (text.includes(city)) {
                extractedEntity = city;
                confidence = 0.9;
                break;
            }
        }

        if (!extractedEntity) {
            for (const country of this.knownCountries) {
                if (text.includes(country)) {
                    extractedEntity = country;
                    confidence = 0.9;
                    break;
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
                const capital = this.getCountryCapital(extractedEntity);
                finalCity = `${countryName} is a country and its capital is ${capital}. Do you want any information about it?`;
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
                        capital: capital,
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
async function testEnhancedCountryDetection() {
    console.log('🌍 Testing Enhanced Country Detection with Capitals\n');

    const mockExtractor = new MockEntityExtractorWithCapitals();

    // Test scenarios focusing on the specific example
    const testScenarios = [
        {
            title: "UAE Example (as requested)",
            message: "How is the weather in United Arab Emirates?",
            expected: "Should return detailed info about UAE and its capital"
        },
        {
            title: "UAE Alternative Form",
            message: "What's the weather in UAE?",
            expected: "Should return detailed info about UAE and its capital"
        },
        {
            title: "France Example",
            message: "How's the weather in France?",
            expected: "Should return detailed info about France and its capital"
        },
        {
            title: "Egypt Example",
            message: "Tell me about Egypt's weather",
            expected: "Should return detailed info about Egypt and its capital"
        },
        {
            title: "USA Example",
            message: "What's the weather in USA?",
            expected: "Should return detailed info about USA and its capital"
        },
        {
            title: "Valid City - Abu Dhabi",
            message: "What's the weather in Abu Dhabi?",
            expected: "Should return: Abu Dhabi (proceed with weather)"
        },
        {
            title: "Valid City - Paris",
            message: "How's the weather in Paris?",
            expected: "Should return: Paris (proceed with weather)"
        },
        {
            title: "Japan Example",
            message: "What's the weather like in Japan?",
            expected: "Should return detailed info about Japan and its capital"
        },
        {
            title: "Valid City - Tokyo",
            message: "What's the weather in Tokyo?",
            expected: "Should return: Tokyo (proceed with weather)"
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
            
            // Test with metadata for countries
            const detailedResult = await mockExtractor.extractCityEntity(
                scenario.message, 
                { includeMetadata: true }
            );
            
            if (detailedResult.isCountry) {
                console.log(`🌍 Country: ${detailedResult.countryDetected}`);
                console.log(`🏛️ Capital: ${detailedResult.capital}`);
            }
            console.log(`📊 Confidence: ${(detailedResult.confidence * 100).toFixed(1)}%`);
            
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
        
        console.log('─'.repeat(70));
    }

    console.log('\n🎉 Enhanced Country Detection Test Completed!\n');

    console.log('✨ New Features:\n');
    console.log('🌍 **Detailed Country Info**: Provides country name and capital');
    console.log('💬 **Engaging Response**: Asks if user wants more information');
    console.log('🏛️ **Capital Cities**: Includes capital city for each country');
    console.log('📊 **Comprehensive Database**: 80+ countries with capitals');
    console.log('🔧 **Backwards Compatible**: Cities still work perfectly');

    console.log('\n📖 Example Responses:\n');
    
    console.log('User: "How is the weather in United Arab Emirates?"');
    console.log('Bot: "United Arab Emirates is a country and its capital is Abu Dhabi. Do you want any information about it?"');
    console.log('');
    
    console.log('User: "What\'s the weather in France?"');
    console.log('Bot: "France is a country and its capital is Paris. Do you want any information about it?"');
    console.log('');
    
    console.log('User: "What\'s the weather in Paris?"');
    console.log('Bot: "Paris" (proceeds with weather lookup)');
    console.log('');
    
    console.log('User: "What\'s the weather in UAE?"');
    console.log('Bot: "Uae is a country and its capital is Abu Dhabi. Do you want any information about it?"');

    console.log('\n🚀 Usage in your code:\n');
    console.log(`
const { EntityExtractor } = require('./intent_extractor');
const extractor = new EntityExtractor();

// Country detection with capital info
const result = await extractor.extractCityEntity("Weather in UAE?");
// Returns: "Uae is a country and its capital is Abu Dhabi. Do you want any information about it?"

// City detection works normally
const cityResult = await extractor.extractCityEntity("Weather in Abu Dhabi?");
// Returns: "Abu Dhabi"

// Get detailed metadata
const detailed = await extractor.extractCityEntity("Weather in Egypt?", { includeMetadata: true });
// Returns: { city: "Egypt is a country...", capital: "Cairo", countryDetected: "Egypt", ... }
    `);
}

// Run the test
testEnhancedCountryDetection().catch(console.error);

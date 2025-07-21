// Load environment variables from .env file
require('dotenv').config();

/**
 * IntentExtractor class for extracting user intents using Groq API
 */
class IntentExtractor {
    constructor(groqApiKey = null) {
        // Use provided API key or fallback to environment variable
        this.groqApiKey = groqApiKey || process.env.GROQ_API_KEY;
        
        if (!this.groqApiKey) {
            throw new Error('Groq API key is required. Please set GROQ_API_KEY in your .env file or pass it to the constructor.');
        }
        
        this.groqClient = null;
        this.initializeGroqClient();
    }

    /**
     * Initialize Groq client
     */
    initializeGroqClient() {
        try {
            // Import Groq SDK (install with: npm install groq-sdk)
            const Groq = require('groq-sdk');
            this.groqClient = new Groq({
                apiKey: this.groqApiKey
            });
            console.log('Groq client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Groq client:', error.message);
            console.log('Please install groq-sdk: npm install groq-sdk');
        }
    }

    /**
     * Extract intent from user message using Groq API
     * @param {string} userMessage - The user's message
     * @param {Array} availableIntents - Array of possible intents (optional, will use weather intents by default)
     * @returns {Promise<Object>} - Intent classification result
     */
    async extractIntent(userMessage, availableIntents = []) {
        if (!this.groqClient) {
            throw new Error('Groq client not initialized. Please check your API key and ensure groq-sdk is installed.');
        }

        if (!userMessage || typeof userMessage !== 'string') {
            throw new Error('User message must be a non-empty string');
        }

        try {
            // Load weather-specific intents from intents.js
            const weatherIntents = require('../intents.js');
            
            // Use provided intents or default to weather intents
            const intents = availableIntents.length > 0 ? availableIntents : weatherIntents;

            // Create the prompt for intent classification
            const prompt = this.createIntentPrompt(userMessage, intents);

            // Call Groq API
            const response = await this.groqClient.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert intent classifier. Analyze the user message and classify it into one of the provided weather-related intents. If the message is not related to weather or doesn't match any of the specific intents, classify it as 'undefined'. Always respond with a valid JSON object."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama3-8b-8192", // You can change this to other Groq models
                temperature: 0.1,
                max_tokens: 200,
                response_format: { type: "json_object" }
            });

            // Parse the response
            const result = JSON.parse(response.choices[0].message.content);
            
            // Validate and return the result
            return this.validateIntentResult(result, intents);

        } catch (error) {
            console.error('Error extracting intent:', error);
            return {
                intent: 'undefined',
                confidence: 0.0,
                error: error.message,
                originalMessage: userMessage
            };
        }
    }

    /**
     * Create a prompt for intent classification
     * @param {string} message - User message
     * @param {Array} intents - Available intents
     * @returns {string} - Formatted prompt
     */
    createIntentPrompt(message, intents) {
        return `
Classify the following user message into one of the provided weather-related intents. If the message is NOT related to weather or doesn't match any of the specific intents, classify it as "undefined".

User Message: "${message}"

Available Weather Intents: ${intents.join(', ')}

Please respond with a JSON object in this exact format:
{
    "intent": "the_classified_intent_or_undefined",
    "confidence": 0.95,
    "reasoning": "Brief explanation of why this intent was chosen"
}

The intent must be exactly one of: ${intents.join(', ')}, undefined
The confidence should be between 0.0 and 1.0.
        `.trim();
    }

    /**
     * Validate the intent extraction result
     * @param {Object} result - The result from Groq API
     * @param {Array} validIntents - List of valid intents
     * @returns {Object} - Validated result
     */
    validateIntentResult(result, validIntents) {
        // Add "undefined" as a valid intent option
        const allValidIntents = [...validIntents, 'undefined'];
        
        // Ensure required fields exist
        if (!result.intent) {
            result.intent = 'undefined';
        }

        // Ensure intent is in valid list (including "undefined")
        if (!allValidIntents.includes(result.intent)) {
            result.intent = 'undefined';
        }

        // Ensure confidence is a number between 0 and 1
        if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
            result.confidence = 0.5;
        }

        // Add timestamp
        result.timestamp = new Date().toISOString();

        return result.intent;
    }

    /**
     * Extract multiple intents from a message (if message contains multiple intents)
     * @param {string} userMessage - The user's message
     * @param {Array} availableIntents - Array of possible intents
     * @returns {Promise<Array>} - Array of intent classification results
     */
    async extractMultipleIntents(userMessage, availableIntents = []) {
        if (!this.groqClient) {
            throw new Error('Groq client not initialized. Please check your API key and ensure groq-sdk is installed.');
        }

        try {
            const defaultIntents = [
                'greeting',
                'question',
                'request_information',
                'complaint',
                'compliment',
                'goodbye',
                'help',
                'booking',
                'cancellation',
                'other'
            ];

            const intents = availableIntents.length > 0 ? availableIntents : defaultIntents;

            const prompt = `
Analyze the following user message and identify ALL possible intents it contains:

User Message: "${userMessage}"

Available Intents: ${intents.join(', ')}

Please respond with a JSON object in this exact format:
{
    "intents": [
        {
            "intent": "intent_name",
            "confidence": 0.95,
            "reasoning": "explanation"
        }
    ]
}

If only one intent is found, return an array with one object. Order by confidence (highest first).
            `.trim();

            const response = await this.groqClient.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert intent classifier that can identify multiple intents in a single message. Always respond with a valid JSON object."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama3-8b-8192",
                temperature: 0.1,
                max_tokens: 300,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(response.choices[0].message.content);
            
            // Validate each intent in the array
            if (result.intents && Array.isArray(result.intents)) {
                return result.intents.map(intentObj => this.validateIntentResult(intentObj, intents));
            }

            // Fallback to single intent
            return [await this.extractIntent(userMessage, availableIntents)];

        } catch (error) {
            console.error('Error extracting multiple intents:', error);
            return [{
                intent: 'other',
                confidence: 0.0,
                error: error.message,
                originalMessage: userMessage
            }];
        }
    }

    /**
     * Get intent confidence threshold recommendations
     * @returns {Object} - Confidence thresholds for different use cases
     */
    getConfidenceThresholds() {
        return {
            high_confidence: 0.8,    // Use for automatic actions
            medium_confidence: 0.6,  // Use for suggestions
            low_confidence: 0.4,     // Use for fallback options
            very_low: 0.0           // Treat as uncertain
        };
    }
}

/**
 * EntityExtractor class for extracting city names from weather queries
 */
class EntityExtractor {
    constructor(groqApiKey = null) {
        // Use provided API key or fallback to environment variable
        this.groqApiKey = groqApiKey || process.env.GROQ_API_KEY;
        
        if (!this.groqApiKey) {
            throw new Error('Groq API key is required. Please set GROQ_API_KEY in your .env file or pass it to the constructor.');
        }
        
        this.groqClient = null;
        this.initializeGroqClient();
        
        // List of known cities (can be expanded)
        this.knownCities = [
            // Major world cities
            'london', 'paris', 'tokyo', 'new york', 'los angeles', 'chicago', 'houston', 'philadelphia',
            'phoenix', 'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville',
            'fort worth', 'columbus', 'charlotte', 'san francisco', 'indianapolis', 'seattle',
            'denver', 'washington', 'boston', 'el paso', 'detroit', 'nashville', 'portland',
            'memphis', 'oklahoma city', 'las vegas', 'louisville', 'baltimore', 'milwaukee',
            'albuquerque', 'tucson', 'fresno', 'mesa', 'sacramento', 'atlanta', 'kansas city',
            'colorado springs', 'miami', 'raleigh', 'omaha', 'long beach', 'virginia beach',
            'oakland', 'minneapolis', 'tulsa', 'arlington', 'tampa', 'new orleans', 'wichita',
            // International cities
            'berlin', 'madrid', 'rome', 'amsterdam', 'vienna', 'zurich', 'stockholm', 'oslo',
            'copenhagen', 'helsinki', 'dublin', 'lisbon', 'prague', 'budapest', 'warsaw',
            'moscow', 'istanbul', 'athens', 'cairo', 'dubai', 'mumbai', 'delhi', 'bangalore',
            'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'surat',
            'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'chengdu', 'hangzhou', 'wuhan',
            'xi\'an', 'nanjing', 'tianjin', 'sydney', 'melbourne', 'brisbane', 'perth',
            'adelaide', 'gold coast', 'newcastle', 'canberra', 'toronto', 'montreal',
            'vancouver', 'calgary', 'edmonton', 'ottawa', 'winnipeg', 'quebec city',
            'hamilton', 'kitchener', 'london', 'halifax', 'mexico city', 'guadalajara',
            'monterrey', 'puebla', 'tijuana', 'león', 'juárez', 'zapopan', 'mérida',
            'san luis potosí', 'aguascalientes', 'hermosillo', 'saltillo', 'mexicali',
            'culiacán', 'chihuahua', 'morelia', 'xalapa', 'tampico', 'reynosa', 'tuxtla',
            // Add more cities as needed
            'alexandria', 'giza', 'aswan', 'luxor', 'hurghada', 'sharm el sheikh',
            'ismailia', 'suez', 'port said', 'mansoura', 'tanta', 'zagazig', 'damanhur',
            'beni suef', 'minya', 'asyut', 'sohag', 'qena', 'kom ombo', 'edfu'
        ];

        // List of known countries
        this.knownCountries = [
            'united states', 'usa', 'america', 'united kingdom', 'uk', 'england', 'britain',
            'france', 'germany', 'italy', 'spain', 'portugal', 'netherlands', 'belgium',
            'switzerland', 'austria', 'sweden', 'norway', 'denmark', 'finland', 'ireland',
            'poland', 'czech republic', 'hungary', 'romania', 'bulgaria', 'greece', 'turkey',
            'russia', 'ukraine', 'belarus', 'lithuania', 'latvia', 'estonia', 'croatia',
            'serbia', 'bosnia', 'montenegro', 'albania', 'macedonia', 'slovenia', 'slovakia',
            'china', 'japan', 'south korea', 'north korea', 'india', 'pakistan', 'bangladesh',
            'sri lanka', 'nepal', 'bhutan', 'myanmar', 'thailand', 'vietnam', 'laos',
            'cambodia', 'malaysia', 'singapore', 'indonesia', 'philippines', 'brunei',
            'australia', 'new zealand', 'canada', 'mexico', 'brazil', 'argentina', 'chile',
            'peru', 'colombia', 'venezuela', 'ecuador', 'bolivia', 'uruguay', 'paraguay',
            'egypt', 'libya', 'tunisia', 'algeria', 'morocco', 'sudan', 'ethiopia', 'kenya',
            'tanzania', 'uganda', 'rwanda', 'burundi', 'somalia', 'djibouti', 'eritrea',
            'south africa', 'namibia', 'botswana', 'zimbabwe', 'zambia', 'malawi', 'mozambique',
            'madagascar', 'mauritius', 'seychelles', 'comoros', 'ghana', 'nigeria', 'senegal',
            'mali', 'burkina faso', 'niger', 'chad', 'cameroon', 'gabon', 'congo',
            'democratic republic of congo', 'central african republic', 'equatorial guinea',
            'sao tome and principe', 'cape verde', 'guinea-bissau', 'guinea', 'sierra leone',
            'liberia', 'ivory coast', 'togo', 'benin', 'iran', 'iraq', 'syria', 'lebanon',
            'jordan', 'israel', 'palestine', 'saudi arabia', 'yemen', 'oman', 'uae',
            'united arab emirates', 'qatar', 'bahrain', 'kuwait', 'afghanistan', 'uzbekistan', 
            'kazakhstan', 'kyrgyzstan', 'tajikistan', 'turkmenistan', 'mongolia', 'armenia', 
            'georgia', 'azerbaijan'
        ];

        // Country capitals mapping
        this.countryCapitals = {
            'united states': 'Washington D.C.',
            'usa': 'Washington D.C.',
            'america': 'Washington D.C.',
            'united kingdom': 'London',
            'uk': 'London',
            'england': 'London',
            'britain': 'London',
            'france': 'Paris',
            'germany': 'Berlin',
            'italy': 'Rome',
            'spain': 'Madrid',
            'portugal': 'Lisbon',
            'netherlands': 'Amsterdam',
            'belgium': 'Brussels',
            'switzerland': 'Bern',
            'austria': 'Vienna',
            'sweden': 'Stockholm',
            'norway': 'Oslo',
            'denmark': 'Copenhagen',
            'finland': 'Helsinki',
            'ireland': 'Dublin',
            'poland': 'Warsaw',
            'czech republic': 'Prague',
            'hungary': 'Budapest',
            'romania': 'Bucharest',
            'bulgaria': 'Sofia',
            'greece': 'Athens',
            'turkey': 'Ankara',
            'russia': 'Moscow',
            'ukraine': 'Kyiv',
            'belarus': 'Minsk',
            'lithuania': 'Vilnius',
            'latvia': 'Riga',
            'estonia': 'Tallinn',
            'croatia': 'Zagreb',
            'serbia': 'Belgrade',
            'bosnia': 'Sarajevo',
            'montenegro': 'Podgorica',
            'albania': 'Tirana',
            'macedonia': 'Skopje',
            'slovenia': 'Ljubljana',
            'slovakia': 'Bratislava',
            'china': 'Beijing',
            'japan': 'Tokyo',
            'south korea': 'Seoul',
            'north korea': 'Pyongyang',
            'india': 'New Delhi',
            'pakistan': 'Islamabad',
            'bangladesh': 'Dhaka',
            'sri lanka': 'Colombo',
            'nepal': 'Kathmandu',
            'bhutan': 'Thimphu',
            'myanmar': 'Naypyidaw',
            'thailand': 'Bangkok',
            'vietnam': 'Hanoi',
            'laos': 'Vientiane',
            'cambodia': 'Phnom Penh',
            'malaysia': 'Kuala Lumpur',
            'singapore': 'Singapore',
            'indonesia': 'Jakarta',
            'philippines': 'Manila',
            'brunei': 'Bandar Seri Begawan',
            'australia': 'Canberra',
            'new zealand': 'Wellington',
            'canada': 'Ottawa',
            'mexico': 'Mexico City',
            'brazil': 'Brasília',
            'argentina': 'Buenos Aires',
            'chile': 'Santiago',
            'peru': 'Lima',
            'colombia': 'Bogotá',
            'venezuela': 'Caracas',
            'ecuador': 'Quito',
            'bolivia': 'Sucre',
            'uruguay': 'Montevideo',
            'paraguay': 'Asunción',
            'egypt': 'Cairo',
            'libya': 'Tripoli',
            'tunisia': 'Tunis',
            'algeria': 'Algiers',
            'morocco': 'Rabat',
            'sudan': 'Khartoum',
            'ethiopia': 'Addis Ababa',
            'kenya': 'Nairobi',
            'tanzania': 'Dodoma',
            'uganda': 'Kampala',
            'rwanda': 'Kigali',
            'burundi': 'Gitega',
            'somalia': 'Mogadishu',
            'djibouti': 'Djibouti',
            'eritrea': 'Asmara',
            'south africa': 'Cape Town',
            'namibia': 'Windhoek',
            'botswana': 'Gaborone',
            'zimbabwe': 'Harare',
            'zambia': 'Lusaka',
            'malawi': 'Lilongwe',
            'mozambique': 'Maputo',
            'madagascar': 'Antananarivo',
            'mauritius': 'Port Louis',
            'seychelles': 'Victoria',
            'comoros': 'Moroni',
            'ghana': 'Accra',
            'nigeria': 'Abuja',
            'senegal': 'Dakar',
            'mali': 'Bamako',
            'burkina faso': 'Ouagadougou',
            'niger': 'Niamey',
            'chad': 'N\'Djamena',
            'cameroon': 'Yaoundé',
            'gabon': 'Libreville',
            'congo': 'Brazzaville',
            'democratic republic of congo': 'Kinshasa',
            'central african republic': 'Bangui',
            'equatorial guinea': 'Malabo',
            'sao tome and principe': 'São Tomé',
            'cape verde': 'Praia',
            'guinea-bissau': 'Bissau',
            'guinea': 'Conakry',
            'sierra leone': 'Freetown',
            'liberia': 'Monrovia',
            'ivory coast': 'Yamoussoukro',
            'togo': 'Lomé',
            'benin': 'Porto-Novo',
            'iran': 'Tehran',
            'iraq': 'Baghdad',
            'syria': 'Damascus',
            'lebanon': 'Beirut',
            'jordan': 'Amman',
            'israel': 'Jerusalem',
            'palestine': 'Ramallah',
            'saudi arabia': 'Riyadh',
            'yemen': 'Sana\'a',
            'oman': 'Muscat',
            'uae': 'Abu Dhabi',
            'united arab emirates': 'Abu Dhabi',
            'qatar': 'Doha',
            'bahrain': 'Manama',
            'kuwait': 'Kuwait City',
            'afghanistan': 'Kabul',
            'uzbekistan': 'Tashkent',
            'kazakhstan': 'Nur-Sultan',
            'kyrgyzstan': 'Bishkek',
            'tajikistan': 'Dushanbe',
            'turkmenistan': 'Ashgabat',
            'mongolia': 'Ulaanbaatar',
            'armenia': 'Yerevan',
            'georgia': 'Tbilisi',
            'azerbaijan': 'Baku'
        };
    }

    /**
     * Initialize Groq client
     */
    initializeGroqClient() {
        try {
            const Groq = require('groq-sdk');
            this.groqClient = new Groq({
                apiKey: this.groqApiKey
            });
            console.log('EntityExtractor Groq client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize EntityExtractor Groq client:', error.message);
            console.log('Please install groq-sdk: npm install groq-sdk');
        }
    }

    /**
     * Extract city name from weather query and validate if it exists
     * @param {string} message - The user's weather query message
     * @param {Object} options - Optional parameters for entity extraction
     * @param {Array} options.allowedCities - Array of specific cities to restrict extraction to
     * @param {boolean} options.strictMode - If true, only exact matches are allowed (default: false)
     * @param {string} options.defaultCity - Default city to return if no city found (default: "this city don't exist")
     * @param {boolean} options.includeMetadata - If true, returns object with metadata (default: false)
     * @returns {Promise<string|Object>} - City name if valid, or error message, or metadata object
     */
    async extractCityEntity(message, options = {}) {
        if (!this.groqClient) {
            throw new Error('Groq client not initialized. Please check your API key and ensure groq-sdk is installed.');
        }

        if (!message || typeof message !== 'string') {
            const defaultResponse = options.defaultCity || "this city don't exist";
            return options.includeMetadata ? {
                city: defaultResponse,
                confidence: 0.0,
                error: "Invalid message input",
                extractedRaw: null,
                isValid: false,
                timestamp: new Date().toISOString()
            } : defaultResponse;
        }

        try {
            // Extract allowed cities from options
            const allowedCities = options.allowedCities || null;
            const strictMode = options.strictMode || false;
            const defaultCity = options.defaultCity || "this city don't exist";
            const includeMetadata = options.includeMetadata || false;

            // Create prompt for city extraction with parameters
            const prompt = this.createCityExtractionPrompt(message, allowedCities);

            // Call Groq API to extract city name
            const response = await this.groqClient.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: allowedCities 
                            ? `You are an expert entity extractor specialized in identifying city names from weather-related queries. Extract the city name mentioned in the user's message. Only extract cities from this allowed list: ${allowedCities.join(', ')}. If no city is mentioned or if the text doesn't contain a city from the allowed list, respond with 'no_city_found'. Always respond with a valid JSON object.`
                            : "You are an expert entity extractor specialized in identifying city names from weather-related queries. Extract the city name mentioned in the user's message. If no city is mentioned or if the text doesn't contain a recognizable city name, respond with 'no_city_found'. Always respond with a valid JSON object."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama3-8b-8192",
                temperature: 0.1,
                max_tokens: 150,
                response_format: { type: "json_object" }
            });

            // Parse the response
            const result = JSON.parse(response.choices[0].message.content);
            const extractedCity = result.city ? result.city.toLowerCase().trim() : null;
            const confidence = result.confidence || 0.5;
            const reasoning = result.reasoning || "No reasoning provided";

            // Validate if the extracted city exists
            let isValid = false;
            let finalCity = defaultCity;

            if (extractedCity && extractedCity !== 'no_city_found') {
                // First check if it's a country instead of a city
                if (this.isCountry(extractedCity)) {
                    const countryName = this.formatCityName(extractedCity);
                    const capital = this.getCountryCapital(extractedCity);
                    
                    // Return just the capital city name
                    finalCity = capital;
                    
                    if (includeMetadata) {
                        return {
                            city: finalCity,
                            confidence: confidence,
                            reasoning: `Detected "${countryName}" which is a country, returning capital city`,
                            extractedRaw: extractedCity,
                            isValid: true,
                            isCountry: true,
                            countryDetected: countryName,
                            capital: capital,
                            allowedCities: allowedCities,
                            strictMode: strictMode,
                            timestamp: new Date().toISOString()
                        };
                    }
                    return finalCity;
                }

                // Check against allowed cities if specified
                if (allowedCities) {
                    isValid = allowedCities.some(city => 
                        city.toLowerCase().trim() === extractedCity
                    );
                } else {
                    // Check against known cities database
                    isValid = strictMode 
                        ? this.validateCityStrict(extractedCity)
                        : this.validateCity(extractedCity);
                }

                if (isValid) {
                    finalCity = this.formatCityName(extractedCity);
                }
            }

            // Return metadata object or just the city name
            if (includeMetadata) {
                return {
                    city: finalCity,
                    confidence: confidence,
                    reasoning: reasoning,
                    extractedRaw: extractedCity,
                    isValid: isValid,
                    allowedCities: allowedCities,
                    strictMode: strictMode,
                    timestamp: new Date().toISOString()
                };
            }

            return finalCity;

        } catch (error) {
            console.error('Error extracting city entity:', error);
            const defaultResponse = options.defaultCity || "this city don't exist";
            
            if (options.includeMetadata) {
                return {
                    city: defaultResponse,
                    confidence: 0.0,
                    error: error.message,
                    extractedRaw: null,
                    isValid: false,
                    timestamp: new Date().toISOString()
                };
            }
            
            return defaultResponse;
        }
    }

    /**
     * Create a prompt for city name extraction
     * @param {string} message - User's weather query
     * @param {Array} allowedCities - Optional array of allowed cities to restrict extraction
     * @returns {string} - Formatted prompt
     */
    createCityExtractionPrompt(message, allowedCities = null) {
        const basePrompt = `
Extract the city name from the following weather-related message. Look for any mention of a city, town, or location.

User Message: "${message}"`;

        const allowedCitiesSection = allowedCities ? `

IMPORTANT: Only extract cities from this allowed list: ${allowedCities.join(', ')}
If the mentioned city is not in the allowed list, respond with "no_city_found".` : '';

        const examples = allowedCities ? `

Examples with allowed cities [${allowedCities.slice(0, 3).join(', ')}]:
- "What's the weather in ${allowedCities[0]}?" → city: "${allowedCities[0]}"
- "How's the weather in SomeOtherCity?" → city: "no_city_found" (not in allowed list)
- "What's today's weather?" → city: "no_city_found"` : `

Examples:
- "What's the weather in London?" → city: "London"
- "How's the weather in New York today?" → city: "New York"
- "Will it rain in Paris tomorrow?" → city: "Paris"
- "What's the weather in Egypt?" → city: "Egypt" (country will be handled separately)
- "How's the weather in France?" → city: "France" (country will be handled separately)
- "What's today's weather?" → city: "no_city_found"
- "Is it sunny?" → city: "no_city_found"`;

        return `${basePrompt}${allowedCitiesSection}${examples}

IMPORTANT: Extract any location mentioned (city, country, or region). If it's a country, we'll handle it appropriately and ask the user to specify a city.

Please respond with a JSON object in this exact format:
{
    "city": "extracted_location_name_or_no_city_found",
    "confidence": 0.95,
    "reasoning": "Brief explanation of the extraction"
}

If no location is mentioned${allowedCities ? ' or the location is not in the allowed list' : ''}, use "no_city_found" as the city value.
        `.trim();
    }

    /**
     * Validate if a city exists in our known cities database
     * @param {string} cityName - The city name to validate
     * @returns {boolean} - True if city exists, false otherwise
     */
    validateCity(cityName) {
        const normalizedCity = cityName.toLowerCase().trim();
        
        // Check exact match
        if (this.knownCities.includes(normalizedCity)) {
            return true;
        }

        // Check partial matches for cities with multiple words
        const cityWords = normalizedCity.split(' ');
        if (cityWords.length > 1) {
            // For multi-word cities, check if any known city contains all words
            return this.knownCities.some(knownCity => {
                const knownWords = knownCity.split(' ');
                return cityWords.every(word => knownWords.includes(word));
            });
        }

        // Check if the input is part of a larger city name
        return this.knownCities.some(knownCity => 
            knownCity.includes(normalizedCity) || normalizedCity.includes(knownCity)
        );
    }

    /**
     * Validate if a city exists with strict matching (exact match only)
     * @param {string} cityName - The city name to validate
     * @returns {boolean} - True if city exists with exact match, false otherwise
     */
    validateCityStrict(cityName) {
        const normalizedCity = cityName.toLowerCase().trim();
        return this.knownCities.includes(normalizedCity);
    }

    /**
     * Check if the extracted entity is a country
     * @param {string} entityName - The entity name to check
     * @returns {boolean} - True if it's a country, false otherwise
     */
    isCountry(entityName) {
        const normalizedEntity = entityName.toLowerCase().trim();
        
        // Check exact match
        if (this.knownCountries.includes(normalizedEntity)) {
            return true;
        }

        // Check partial matches for countries with multiple words
        const entityWords = normalizedEntity.split(' ');
        if (entityWords.length > 1) {
            return this.knownCountries.some(knownCountry => {
                const countryWords = knownCountry.split(' ');
                return entityWords.every(word => countryWords.includes(word));
            });
        }

        // Check if the input is part of a larger country name
        return this.knownCountries.some(knownCountry => 
            knownCountry.includes(normalizedEntity) || normalizedEntity.includes(knownCountry)
        );
    }

    /**
     * Get the capital city of a country
     * @param {string} countryName - The country name
     * @returns {string} - The capital city name
     */
    getCountryCapital(countryName) {
        const normalizedCountry = countryName.toLowerCase().trim();
        
        // Check direct match first
        if (this.countryCapitals[normalizedCountry]) {
            return this.countryCapitals[normalizedCountry];
        }

        // Check for partial matches
        for (const [country, capital] of Object.entries(this.countryCapitals)) {
            if (country.includes(normalizedCountry) || normalizedCountry.includes(country)) {
                return capital;
            }
        }

        return 'Unknown'; // Fallback if capital not found
    }

    /**
     * Format city name to proper case
     * @param {string} cityName - The city name to format
     * @returns {string} - Properly formatted city name
     */
    formatCityName(cityName) {
        return cityName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Add a new city to the known cities list
     * @param {string} cityName - The city name to add
     */
    addCity(cityName) {
        const normalizedCity = cityName.toLowerCase().trim();
        if (!this.knownCities.includes(normalizedCity)) {
            this.knownCities.push(normalizedCity);
            console.log(`City "${cityName}" added to known cities list`);
        }
    }

    /**
     * Get the list of known cities
     * @returns {Array} - Array of known city names
     */
    getKnownCities() {
        return this.knownCities.map(city => this.formatCityName(city));
    }

    /**
     * Get the list of known countries
     * @returns {Array} - Array of known country names
     */
    getKnownCountries() {
        return this.knownCountries.map(country => this.formatCityName(country));
    }

    /**
     * Get country information including capital
     * @param {string} countryName - The country name
     * @returns {Object} - Country information object
     */
    getCountryInfo(countryName) {
        const normalizedCountry = countryName.toLowerCase().trim();
        const formattedCountry = this.formatCityName(countryName);
        const capital = this.getCountryCapital(countryName);
        
        return {
            country: formattedCountry,
            capital: capital,
            isCountry: this.isCountry(countryName),
            message: `${formattedCountry} is a country and its capital is ${capital}. Do you want any information about it?`
        };
    }

    /**
     * Search for cities matching a pattern
     * @param {string} pattern - Search pattern
     * @returns {Array} - Array of matching cities
     */
    searchCities(pattern) {
        const normalizedPattern = pattern.toLowerCase().trim();
        return this.knownCities
            .filter(city => city.includes(normalizedPattern))
            .map(city => this.formatCityName(city));
    }
}

module.exports = { IntentExtractor, EntityExtractor };

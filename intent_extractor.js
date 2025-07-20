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
            const weatherIntents = require('./intents.js');
            
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

Guidelines:
- "today's weather inquiry": Questions about current day weather
- "upcoming week's weather inquiry": Questions about weather for the next 7 days
- "upcoming month's weather inquiry": Questions about weather for the next month
- "undefined": Use this for non-weather messages or unclear weather requests

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

        return result;
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

module.exports = IntentExtractor;

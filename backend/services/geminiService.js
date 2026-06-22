const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Ensures GEMINI_API_KEY is configured.
 * @returns {string} The API Key.
 */
const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in backend/.env');
  }
  return key;
};

/**
 * Generates content using Gemini 2.5 Flash model with error handling, JSON parsing fallbacks, and progressive backoff retries.
 * 
 * @param {Object} options
 * @param {string} [options.prompt] - Full prompt (combines systemPrompt and userPrompt if not set).
 * @param {string} [options.systemPrompt] - System context/persona instructions.
 * @param {string} [options.userPrompt] - User input instructions.
 * @param {boolean} [options.jsonMode=true] - Request structured JSON output.
 * @param {number} [options.temperature=0.7] - Creativity metric.
 * @param {number} [options.maxOutputTokens=4096] - Response token limit.
 * @param {number} [options.retries=3] - Max network/rate-limit retries.
 * @returns {Promise<Object|string>} The parsed JSON object or raw string.
 */
async function generate(options = {}) {
  const {
    prompt = '',
    systemPrompt = '',
    userPrompt = '',
    jsonMode = true,
    temperature = 0.7,
    maxOutputTokens = 4096,
    retries = 3
  } = options;

  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Build the complete prompt text
  const fullPrompt = prompt || (systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt);

  const config = {
    temperature,
    maxOutputTokens,
  };

  if (jsonMode) {
    config.responseMimeType = 'application/json';
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: config,
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const responseWrapper = await model.generateContent(fullPrompt);
      const text = responseWrapper.response.text().trim();
      
      if (!text) {
        throw new Error('Received empty response from the AI model');
      }

      if (!jsonMode) {
        return text;
      }

      // Try raw parse
      try {
        return JSON.parse(text);
      } catch (jsonErr) {
        // Strip markdown blocks if present and retry
        const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '').trim();
        try {
          return JSON.parse(cleaned);
        } catch {
          // Last resort search for JSON bounds
          const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/s);
          if (match) {
            return JSON.parse(match[1]);
          }
          throw new Error('AI response structure did not conform to valid JSON format');
        }
      }
    } catch (error) {
      console.error(`⚠️ [Gemini API Attempt ${attempt}/${retries} failed]: ${error.message}`);
      if (attempt === retries) {
        throw error;
      }
      // Progressive delay (1s, 2s, 3s...)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

module.exports = {
  generate,
  getApiKey,
};

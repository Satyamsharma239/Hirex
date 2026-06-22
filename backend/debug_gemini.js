require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.8, maxOutputTokens: 4096, responseMimeType: 'application/json' },
  });

  const prompt = `Generate 3 Indian tech job listings for "React Developer" as a JSON array.
Each object must have: id, title, company, hrEmail, salary, location, mode, description.
Use these companies:
1. Swiggy [Unicorn] <careers@swiggy.in>
2. Squareboat [Product Studio] <careers@squareboat.com>
3. TCS [IT Services] <hr@tcs.com>

Return ONLY a JSON array, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('=== RAW RESPONSE (first 800 chars) ===');
    console.log(text.slice(0, 800));
    console.log('\n=== TYPE ===', typeof text);
    try {
      const parsed = JSON.parse(text);
      console.log('\n=== PARSED TYPE ===', Array.isArray(parsed) ? 'ARRAY ✅' : 'OBJECT');
      if (Array.isArray(parsed)) {
        console.log('=== COUNT ===', parsed.length, 'jobs');
        console.log('First job company:', parsed[0]?.company);
      } else {
        console.log('Keys:', Object.keys(parsed));
      }
    } catch(e) {
      console.log('\n=== PARSE ERROR ===', e.message);
    }
  } catch(e) {
    console.log('=== API ERROR ===', e.message);
  }
}

test();

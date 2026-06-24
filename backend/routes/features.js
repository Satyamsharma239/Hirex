const express = require('express');
const router  = express.Router();
const { generate } = require('../services/geminiService');

const TODAY = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

// ════════════════════════════════════════════════════════════════
// 1. GHOST RATE PREDICTOR
//    POST /api/features/ghost-rate
//    Predicts % chance HR will reply based on profile vs job match
// ════════════════════════════════════════════════════════════════
router.post('/ghost-rate', async (req, res) => {
  try {
    const { job, userProfile = {}, resumeData = {}, resumeText = '' } = req.body;
    if (!job) return res.status(400).json({ error: 'Job required' });

    const prompt = `You are a hiring data analyst for the Indian tech market.
Analyze this job application and predict the probability that HR will respond.

JOB: ${job.company} | ${job.title} | ${job.companyType}
Job Requirements: ${(job.requirements || []).join(', ')}
Location: ${job.location} | Mode: ${job.mode} | Openings: ${job.openings || 1}

CANDIDATE:
- Skills: ${userProfile.skills || resumeData.topSkills?.join(', ') || 'general programming'}
- Background: ${userProfile.background || 'Developer'}
- Resume excerpt: "${resumeText.slice(0, 300)}"
- Skills matching this job: ${resumeData.skillsPresent?.join(', ') || userProfile.skills || ''}
- Skills missing: ${resumeData.skillsMissing?.join(', ') || ''}

Return JSON:
{
  "replyProbability": <integer 10-90>,
  "verdict": "<Excellent / Good / Fair / Low>",
  "verdictColor": "<one of: #10b981, #00c9a7, #f59e0b, #f43f5e>",
  "reasons": [
    {"factor":"<factor name>","impact":"<Positive/Negative/Neutral>","detail":"<1 sentence explanation>"},
    {"factor":"<factor>","impact":"<>","detail":"<>"},
    {"factor":"<factor>","impact":"<>","detail":"<>"},
    {"factor":"<factor>","impact":"<>","detail":"<>"}
  ],
  "topAction": "<single most important thing to do to increase reply rate>",
  "bestTimeToApply": "<e.g. Tuesday-Thursday 10am-12pm IST>",
  "followUpDay": <integer — how many days to wait before following up>,
  "ghostRiskLevel": "<low / medium / high>",
  "encouragement": "<1 motivating sentence>"
}`;

    res.json(await generate({ prompt, temperature: 0.85 }));
  } catch (err) {
    console.error('[/ghost-rate]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 2. SMART FOLLOW-UP ENGINE
//    POST /api/features/followup-sequence
//    Generates Day 3 / Day 7 / Day 14 follow-up emails
// ════════════════════════════════════════════════════════════════
router.post('/followup-sequence', async (req, res) => {
  try {
    const { job, userName = '', userEmail = '', userSkills = '', dayNumber = 3, previousEmailSubject = '' } = req.body;
    if (!job) return res.status(400).json({ error: 'Job required' });

    const name = userName || 'Applicant';
    const strategies = {
      3:  { tone: 'brief and polite — just checking if they received your application', angle: 'Soft check-in. Mention you applied. Express continued interest. 80 words max.' },
      7:  { tone: 'value-add — share something relevant (a project, insight, or skill update)', angle: 'Add value. Mention a relevant project or achievement. Refer to previous email. 100 words max.' },
      14: { tone: 'final attempt — respectful, no desperation, leave door open', angle: 'Final polite follow-up. Mention you understand they\'re busy. Offer to connect in future. 80 words max.' },
    };
    const strat = strategies[dayNumber] || strategies[7];

    const prompt = `Write a Day-${dayNumber} follow-up email from "${name}" to HR at "${job.company}" for the "${job.title}" role.

Context: They applied ${dayNumber} days ago. Previous email subject: "${previousEmailSubject || `Application for ${job.title}`}"
HR Email: ${job.hrEmail}
Candidate skills: ${userSkills}

Strategy: ${strat.angle}
Tone: ${strat.tone}

Rules:
- Reference the original application naturally
- DO NOT sound desperate
- Be professional and concise
- End with a clear but soft CTA
- Sign off as "${name} | ${userEmail || 'candidate@email.com'}"

Return JSON:
{
  "subject": "<follow-up subject referencing original>",
  "body": "<complete email with \\n line breaks>",
  "dayAdvice": "<1 sentence on what to do if still no reply after this email>"
}`;

    res.json(await generate({ prompt, temperature: 0.85 }));
  } catch (err) {
    console.error('[/followup-sequence]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 3. INTERVIEW SIMULATION
//    POST /api/features/interview-sim
//    Full mock interview using company's real process + AI scoring
// ════════════════════════════════════════════════════════════════
router.post('/interview-sim', async (req, res) => {
  try {
    const { company, role, userAnswer = '', questionIndex = 0, jobDescription = '', question = '' } = req.body;
    if (!company || !role) return res.status(400).json({ error: 'company and role required' });

    if (!userAnswer) {
      const prompt = `Generate a realistic mock interview for "${role}" at "${company}" for an Indian candidate. Today: ${TODAY}.
Job context: ${jobDescription.slice(0, 300)}

CRITICAL: Settle ONLY for real-world questions that are historically known to be asked during actual interview rounds at "${company}" for the specific role of "${role}" (drawing from interview logs on Glassdoor, LeetCode, and GeeksforGeeks). 
- If "${company}" is a service company like TCS, Infosys, Wipro, Cognizant, or Accenture, include real foundational coding/logic questions, database queries (SQL/NoSQL), OOPs concepts, final-year project explanations, and TR/HR questions standard to their recruitment process.
- If "${company}" is a top-tier product-based company or startup, include actual data structures & algorithms (DSA) challenges, system design/architecture questions, and deep technical framework questions asked at their panels.

Return JSON matching this structure EXACTLY:
{
  "sessionTitle": "Mock Interview: ${role} at ${company}",
  "totalQuestions": 8,
  "estimatedTime": "20-25 minutes",
  "questions": [
    {"index":0,"type":"Technical","question":"<specific real technical question for ${role} historically asked at ${company}>","timeLimit":120,"hint":"<what a good answer includes for this question>"},
    {"index":1,"type":"Technical","question":"<real coding or system design question asked at ${company} for ${role}>","timeLimit":180,"hint":"<hint>"},
    {"index":2,"type":"Technical","question":"<real technical framework/language question asked at ${company}>","timeLimit":120,"hint":"<hint>"},
    {"index":3,"type":"Behavioral","question":"<real behavioral question asked at ${company}>","timeLimit":120,"hint":"<STAR method tip>"},
    {"index":4,"type":"Behavioral","question":"<another real behavioral question asked at ${company}>","timeLimit":120,"hint":"<hint>"},
    {"index":5,"type":"Situational","question":"<real situational/problem-solving question asked at ${company}>","timeLimit":120,"hint":"<hint>"},
    {"index":6,"type":"Company-Specific","question":"<real question about ${company}'s products, services, scale or tech stack>","timeLimit":90,"hint":"<hint>"},
    {"index":7,"type":"HR","question":"<real HR question asked at ${company} (e.g. standard HR questions like company interest or relocation)>","timeLimit":60,"hint":"<hint>"}
  ]
}`;
      return res.json(await generate({ prompt, temperature: 0.85 }));
    }

    const prompt = `You are a senior interviewer at "${company}" evaluating a candidate for "${role}".
Question: "${question || `Question ${questionIndex}`}"
Candidate's answer: "${userAnswer.slice(0, 800)}"

Score this answer and return JSON:
{
  "score": <integer 0-100>,
  "grade": "<A / B / C / D>",
  "strengths": ["<what they did well>","<strength 2>"],
  "improvements": ["<what to improve>","<improvement 2>"],
  "sampleAnswer": "<what a great answer would look like — 3-4 sentences>",
  "keyMissed": "<most important point they missed, or null>",
  "confidence": "<Low / Medium / High / Very High>",
  "deliveryAnalytics": {
    "speakingSpeed": "<estimate candidate WPM based on answer length, e.g., '135 WPM (Optimal)' or '80 WPM (Slow)'>",
    "fillerCount": <count of typical speech filler words like 'um', 'ah', 'like', 'basically', 'you know' in candidate answer>,
    "fillersUsed": ["<filler word 1>", "<filler word 2>"],
    "communicationTone": "<Confident, Technical, Conversational, or Hesitant depending on answer structure>"
  }
}`;

    res.json(await generate({ prompt, temperature: 0.85 }));
  } catch (err) {
    console.error('[/interview-sim]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 4. OFFER COMPARISON MATRIX
//    POST /api/features/compare-offers
//    Compare multiple job offers on 10+ dimensions
// ════════════════════════════════════════════════════════════════
router.post('/compare-offers', async (req, res) => {
  try {
    const { offers = [] } = req.body; // array of { company, role, salary, location, mode, benefits, type }
    if (offers.length < 2) return res.status(400).json({ error: 'Need at least 2 offers to compare' });

    const offersText = offers.map((o, i) =>
      `Offer ${i+1}: ${o.company} | ${o.role} | ${o.salary} | ${o.location} | ${o.mode} | Benefits: ${o.benefits || 'standard'}`
    ).join('\n');

    const prompt = `You are a career advisor for Indian tech professionals. Compare these job offers. Today: ${TODAY}.

OFFERS:
${offersText}

Return JSON:
{
  "winner": "<company name of recommended offer>",
  "winnerReason": "<2 sentences why this is the best overall choice>",
  "comparison": [
    {
      "dimension": "Salary & Compensation",
      "scores": [<score 1-10 for offer1>, <score for offer2>, ...],
      "insight": "<1 sentence comparing them>"
    },
    { "dimension": "Career Growth", "scores": [...], "insight": "<>" },
    { "dimension": "Work-Life Balance", "scores": [...], "insight": "<>" },
    { "dimension": "Learning Opportunities", "scores": [...], "insight": "<>" },
    { "dimension": "Job Security", "scores": [...], "insight": "<>" },
    { "dimension": "Location & Commute", "scores": [...], "insight": "<>" },
    { "dimension": "Company Culture", "scores": [...], "insight": "<>" },
    { "dimension": "Brand Value for Resume", "scores": [...], "insight": "<>" }
  ],
  "totalScores": [<total for offer1>, <total for offer2>, ...],
  "negotiationTips": ["<tip for offer 1>","<tip for offer 2>"],
  "redFlags": ["<any concerning thing about any offer>"],
  "finalAdvice": "<3 sentences of practical advice on which to choose and why>"
}`;

    res.json(await generate({ prompt, temperature: 0.85 }));
  } catch (err) {
    console.error('[/compare-offers]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 5. CAREER CARD GENERATOR
//    POST /api/features/career-card
//    Generates a shareable career profile summary
// ════════════════════════════════════════════════════════════════
router.post('/career-card', async (req, res) => {
  try {
    const { resumeText = '', userName = '', skills = [], targetRole = '' } = req.body;

    const prompt = `Create a shareable career profile card for an Indian tech job seeker. Today: ${TODAY}.

Name: ${userName || 'Developer'}
Target Role: ${targetRole || 'Software Developer'}
Skills: ${skills.join(', ')}
Resume excerpt: "${resumeText.slice(0, 600)}"

Return JSON:
{
  "headline": "<professional headline — e.g. 'Full Stack Developer | React · Node.js · MongoDB | Open to Work'>",
  "tagline": "<catchy 1-line personal brand statement>",
  "topSkills": ["<skill1>","<skill2>","<skill3>","<skill4>","<skill5>"],
  "uniqueValue": "<what makes this person uniquely valuable — 2 sentences>",
  "lookingFor": "<what kind of role/company they want — 1 sentence>",
  "availableFrom": "Immediately",
  "preferredLocations": ["<location1>","<location2>","<location3>"],
  "openToRemote": true,
  "experienceSummary": "<2-3 sentence summary of their experience from resume>",
  "achievements": ["<achievement 1>","<achievement 2>","<achievement 3>"],
  "linkedinMessage": "<a ready-to-use 150-word LinkedIn 'About' section>",
  "coldEmailIntro": "<a 2-sentence intro they can paste at the start of any cold email>"
}`;

    res.json(await generate({ prompt, temperature: 0.85 }));
  } catch (err) {
    console.error('[/career-card]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 8. REVERSE-ATS SCANNER
//    POST /api/features/ats-scan
// ════════════════════════════════════════════════════════════════
router.post('/ats-scan', async (req, res) => {
  try {
    const { resumeText, jobDescription = "No specific job provided. Score against general industry standards." } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'Resume text required' });

    const prompt = `You are an Enterprise Applicant Tracking System (ATS) bot (like Taleo, Workday, or Greenhouse).
You are brutal, highly literal, and look for exact keyword matches.
Analyze this resume text against this job description.

Job Description / Target:
${jobDescription}

Resume Text:
"${resumeText.slice(0, 4000)}"

Return JSON:
{
  "atsScore": <integer 0-100 representing how well the bot parses/likes it>,
  "parseStatus": "<Success / Warning / Error>",
  "missingKeywords": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "formattingErrors": ["<error1>", "<error2>"],
  "readabilityScore": <integer 0-100>,
  "verdict": "<2 sentences explaining why the bot passed or rejected this resume>"
}`;

    res.json(await generate({ prompt, temperature: 0.85 }));
  } catch (err) {
    console.error('[/ats-scan]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 9. REFERRAL HACKER & COLD OUTREACH ENGINE
//    POST /api/features/referral-hack
// ════════════════════════════════════════════════════════════════
router.post('/referral-hack', async (req, res) => {
  try {
    const { company, role, background, jobDescription } = req.body;
    if (!company) return res.status(400).json({ error: 'Company required' });

    const prompt = `You are an elite career strategist. Your client wants to get a referral or directly cold email a hiring manager at "${company}" for the role of "${role}".
Client Background: ${background || 'Standard applicant'}
Job Description Snippet: ${jobDescription || 'N/A'}

Analyze the company and role to guess their biggest current pain point, then write a highly targeted cold outreach strategy.

Return JSON:
{
  "emailFormats": ["<format1 e.g. first.last@company.com>", "<format2>"],
  "targetTitles": ["<who to email, e.g. VP of Engineering, Senior Recruiter>"],
  "painPoint": "<What is the likely business problem this role solves?>",
  "subjectLine": "<catchy cold email subject line>",
  "emailBody": "<A 3-4 sentence hyper-personalized cold email that focuses on solving their pain point rather than just asking for a job. Do not include placeholders like [Your Name], use realistic text.>"
}`;

    res.json(await generate({ prompt, temperature: 0.85 }));
  } catch (err) {
    console.error('[/referral-hack]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 10. 1-CLICK RESUME TAILOR
//     POST /api/features/resume-tailor
// ════════════════════════════════════════════════════════════════
router.post('/resume-tailor', async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) return res.status(400).json({ error: 'Resume and Job Description required' });

    const prompt = `You are an expert resume writer. Take this master resume and rewrite its key bullet points to perfectly align with the target job description. 
Incorporate the exact keywords from the JD where truthful and relevant. Enhance the impact of the achievements.

Job Description:
${jobDescription.slice(0, 3000)}

Original Resume Excerpt:
"${resumeText.slice(0, 4000)}"

Return JSON:
{
  "tailoredSummary": "<A new 3-sentence professional summary perfectly matching the JD>",
  "rewrittenBullets": [
    "<High-impact bullet 1 incorporating JD keywords>",
    "<High-impact bullet 2 incorporating JD keywords>",
    "<High-impact bullet 3 incorporating JD keywords>",
    "<High-impact bullet 4 incorporating JD keywords>"
  ],
  "keywordsAdded": ["<kw1>", "<kw2>", "<kw3>"],
  "tailoringAdvice": "<1 sentence on what else they should change manually>"
}`;

    res.json(await generate({ prompt, temperature: 0.85 }));
  } catch (err) {
    console.error('[/resume-tailor]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

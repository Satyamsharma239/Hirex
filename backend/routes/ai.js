const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { generate } = require('../services/geminiService');

// ─── Multer ────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedMimeTypes.includes(file.mimetype) || ext === 'pdf' || ext === 'docx' || ext === 'doc') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX resume files are allowed'), false);
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// 1. RESUME ANALYZER — Returns structured JSON with match %, skills, advice
// ────────────────────────────────────────────────────────────────────────────────
router.post('/analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription, resumeText: rawResumeText } = req.body;
    if (!jobDescription || jobDescription.trim().length < 30)
      return res.status(400).json({ error: 'Please provide a detailed job description (min 30 characters)' });

    let resumeText = '';
    if (req.file) {
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      if (req.file.mimetype === 'application/pdf' || ext === 'pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = (pdfData && pdfData.text) ? pdfData.text.trim() : '';
      } else {
        const docResult = await mammoth.extractRawText({ buffer: req.file.buffer });
        resumeText = (docResult && docResult.value) ? docResult.value.trim() : '';
      }
    } else if (rawResumeText && rawResumeText.trim().length >= 50) {
      resumeText = rawResumeText.trim();
    } else {
      return res.status(400).json({ error: 'Please upload a PDF or DOCX resume or provide valid resume text' });
    }

    if (resumeText.length < 50)
      return res.status(400).json({ error: 'Resume text is too short. Ensure it has at least 50 characters.' });

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) specialist and career coach 
with deep knowledge of the Indian tech job market. 
You analyze resumes against job descriptions with precision and give actionable feedback.
Focus on skills, keywords, and relevance to the Indian IT/tech industry.`;

    const userPrompt = `Analyze this resume against the job description for the Indian tech job market.

RESUME TEXT:
${resumeText.slice(0, 6000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

Return a JSON object with these EXACT fields:
{
  "matchPercentage": <integer 0-100 based on how well resume matches JD>,
  "skillsPresent": [<list of specific skills/technologies found in both resume and JD>],
  "skillsMissing": [<list of important skills mentioned in JD but NOT in resume>],
  "suggestion": "<single most impactful improvement to make for this specific role>",
  "verdict": "<exactly one of: Excellent Match, Good Match, Moderate Match, Low Match>",
  "summary": "<2-3 sentences: strengths, gaps, overall assessment for this Indian IT role>",
  "atsScore": <integer 0-100 representing ATS keyword match score>,
  "experienceMatch": "<Fresher OK, or describes gap>",
  "contact": {
    "name": "<candidate full name, or empty string if not found>",
    "email": "<candidate email address, or empty string if not found>",
    "phone": "<candidate phone/mobile number, or empty string if not found>",
    "linkedin": "<candidate LinkedIn profile link, or empty string if not found>",
    "github": "<candidate GitHub profile link, or empty string if not found>"
  }
}`;

    const result = await generate({ systemPrompt, userPrompt, jsonMode: true });
    res.json({ ...result, resumeText });
  } catch (err) {
    console.error('Resume analysis error:', err.message);
    if (err.message.includes('API key')) return res.status(401).json({ error: 'Invalid Gemini API key. Check backend/.env' });
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// 2. COVER LETTER GENERATOR
// ────────────────────────────────────────────────────────────────────────────────
router.post('/cover-letter', async (req, res) => {
  try {
    const { company, role, background, jobDescription } = req.body;
    if (!company || !role) return res.status(400).json({ error: 'Company and role are required' });

    const systemPrompt = `You are a professional career coach specializing in the Indian tech industry. 
You write compelling, personalized cover letters that get BSc IT freshers interviews at top Indian tech companies.
Your letters are professional but warm, concise (250-300 words), and highlight relevant skills clearly.`;

    const userPrompt = `Write a professional cover letter for this application:

Company: ${company}
Role: ${role}  
Candidate Background: ${background || 'BSc IT graduate with strong interest in MERN Stack development. Skilled in React, Node.js, MongoDB, Express. Passionate about building user-friendly web applications.'}
Job Description: ${jobDescription || 'Full-stack web development role'}

Requirements:
- Start with "Dear Hiring Manager,"
- Opening paragraph: engaging hook mentioning ${company} specifically
- Middle paragraph: highlight 2-3 key skills matching the role with specific examples
- Closing paragraph: enthusiasm, clear call-to-action, mention availability
- End with: "Sincerely,\n[Your Name]"
- Keep it 250-300 words, professional yet personable
- Tailor it for the Indian tech industry context

Write ONLY the letter. No extra commentary.`;

    const text = await generate({ systemPrompt, userPrompt, jsonMode: false });
    res.json({ coverLetter: text });
  } catch (err) {
    console.error('Cover letter error:', err.message);
    if (err.message.includes('API key')) return res.status(401).json({ error: 'Invalid Gemini API key. Check backend/.env' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/interview-questions', async (req, res) => {
  try {
    const { role, jobDescription, experienceLevel } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const systemPrompt = `You are a senior technical interviewer at a top Indian tech company.
You generate realistic, role-specific interview questions based on actual Indian tech interview patterns 
(TCS, Infosys, Wipro, Flipkart, Paytm, Zomato, and top-tier tech offices).`;

    const userPrompt = `Generate comprehensive interview questions for:
Role: ${role}
Experience Level: ${experienceLevel || 'Fresher/0-1 year'}
Job Description Context: ${jobDescription || 'Standard software development role'}

Return JSON with exactly this structure — 5 questions per category with answer tips:
{
  "technical": [
    { "question": "<specific technical question for ${role}>", "tip": "<what to include in your answer, 1-2 sentences>" },
    { "question": "...", "tip": "..." },
    { "question": "...", "tip": "..." },
    { "question": "...", "tip": "..." },
    { "question": "...", "tip": "..." }
  ],
  "behavioral": [
    { "question": "<behavioral/HR question>", "tip": "<use STAR method, mention...>" },
    { "question": "...", "tip": "..." },
    { "question": "...", "tip": "..." },
    { "question": "...", "tip": "..." },
    { "question": "...", "tip": "..." }
  ],
  "situational": [
    { "question": "<real-world scenario question>", "tip": "<approach: first..., then...>" },
    { "question": "...", "tip": "..." },
    { "question": "...", "tip": "..." },
    { "question": "...", "tip": "..." },
    { "question": "...", "tip": "..." }
  ]
}

Make questions SPECIFIC to "${role}" — not generic. Include actual coding concepts, frameworks, or tools relevant to this role.`;

    const result = await generate({ systemPrompt, userPrompt, jsonMode: true });
    res.json(result);
  } catch (err) {
    console.error('Interview questions error:', err.message);
    if (err.message.includes('API key')) return res.status(401).json({ error: 'Invalid Gemini API key. Check backend/.env' });
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// 4. FOLLOW-UP EMAIL GENERATOR
// ────────────────────────────────────────────────────────────────────────────────
router.post('/followup-email', async (req, res) => {
  try {
    const { company, role, interviewerName, daysAfter, interviewType } = req.body;
    if (!company || !role) return res.status(400).json({ error: 'Company and role are required' });

    const systemPrompt = `You are a professional communication coach. 
You write concise, effective follow-up emails for Indian tech job seekers.
Your emails are warm, professional, and respectful of the recruiter's time.`;

    const userPrompt = `Write a professional follow-up email:

Company: ${company}
Role: ${role}
Interviewer: ${interviewerName || 'Hiring Manager'}
Days since ${interviewType || 'interview'}: ${daysAfter || 3}

Format EXACTLY like this:
Subject: Follow-up: ${role} Position at ${company}

Dear ${interviewerName || 'Hiring Manager'},

[3-4 sentences: thank them, reiterate enthusiasm for ${role} at ${company}, mention one specific thing discussed or skill relevant to the role, politely ask about next steps/timeline]

Looking forward to hearing from you.

Warm regards,
[Your Name]

Keep it under 100 words in the body. Professional, polite, not desperate. Write ONLY the email.`;

    const text = await generate({ systemPrompt, userPrompt, jsonMode: false });
    res.json({ email: text });
  } catch (err) {
    console.error('Follow-up email error:', err.message);
    if (err.message.includes('API key')) return res.status(401).json({ error: 'Invalid Gemini API key. Check backend/.env' });
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// 5. AI CAREER INSIGHTS
// ────────────────────────────────────────────────────────────────────────────────
router.post('/insights', async (req, res) => {
  try {
    const { stats, topRoles } = req.body;

    const systemPrompt = `You are a career strategist specializing in the Indian tech job market.
You give data-driven, actionable advice to job seekers based on their application patterns.
Be specific, encouraging, and realistic about the Indian IT industry.`;

    const userPrompt = `Analyze this job search data and give personalized recommendations:

Application Stats: ${JSON.stringify(stats)}
Top roles applied to: ${JSON.stringify(topRoles || [])}

Return JSON with exactly this structure:
{
  "insights": [
    { 
      "title": "<specific, data-driven insight title>", 
      "description": "<2-3 sentences with specific advice based on the actual numbers above>",
      "priority": "high"
    },
    { "title": "...", "description": "...", "priority": "high" },
    { "title": "...", "description": "...", "priority": "medium" },
    { "title": "...", "description": "...", "priority": "medium" },
    { "title": "...", "description": "...", "priority": "low" }
  ],
  "weeklyGoal": "<specific, achievable goal based on current pace, e.g. 'Apply to 8 new roles this week'>",
  "encouragement": "<1-2 motivational sentences using the ACTUAL numbers from the stats provided>",
  "marketTip": "<one specific tip about the current Indian IT job market relevant to their top roles>"
}

Make ALL advice specific to the actual numbers. Do not give generic advice.`;

    const result = await generate({ systemPrompt, userPrompt, jsonMode: true });
    res.json(result);
  } catch (err) {
    console.error('Insights error:', err.message);
    if (err.message.includes('API key')) return res.status(401).json({ error: 'Invalid Gemini API key. Check backend/.env' });
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// 6. JOB READINESS SCORE — NEW FEATURE
// ────────────────────────────────────────────────────────────────────────────────
router.post('/readiness-score', async (req, res) => {
  try {
    const { company, role, jobDescription, hasResume, hasCoverLetter, researchedCompany, hasReferral, portfolioReady } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const systemPrompt = `You are a career readiness expert who helps job seekers assess how prepared they are before applying.
Give honest, actionable scores and tell them exactly what to fix before clicking Apply.`;

    const userPrompt = `Score this candidate's readiness to apply for:
Role: ${role} at ${company || 'the company'}
Job Description: ${jobDescription || 'Not provided'}

Their preparation status:
- Has tailored resume: ${hasResume ? 'Yes' : 'No'}
- Has cover letter: ${hasCoverLetter ? 'Yes' : 'No'}
- Researched the company: ${researchedCompany ? 'Yes' : 'No'}
- Has a referral: ${hasReferral ? 'Yes' : 'No'}
- Portfolio/GitHub ready: ${portfolioReady ? 'Yes' : 'No'}

Return JSON:
{
  "overallScore": <integer 0-100>,
  "grade": "<A+, A, B+, B, C, D — based on score>",
  "verdict": "<one of: Ready to Apply!, Almost Ready, Needs Preparation, Not Ready Yet>",
  "breakdown": [
    { "item": "Resume", "score": <0-20>, "maxScore": 20, "status": "<done/missing/weak>", "tip": "<specific improvement>" },
    { "item": "Cover Letter", "score": <0-20>, "maxScore": 20, "status": "...", "tip": "..." },
    { "item": "Company Research", "score": <0-20>, "maxScore": 20, "status": "...", "tip": "..." },
    { "item": "Portfolio/GitHub", "score": <0-20>, "maxScore": 20, "status": "...", "tip": "..." },
    { "item": "Network/Referral", "score": <0-20>, "maxScore": 20, "status": "...", "tip": "..." }
  ],
  "topAction": "<the single most important thing to do before applying>",
  "encouragement": "<brief motivational message>"
}`;

    const result = await generate({ systemPrompt, userPrompt, jsonMode: true });
    res.json(result);
  } catch (err) {
    console.error('Readiness score error:', err.message);
    if (err.message.includes('API key')) return res.status(401).json({ error: 'Invalid Gemini API key. Check backend/.env' });
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────────────────────
// 7. SALARY ESTIMATOR — NEW FEATURE
// ────────────────────────────────────────────────────────────────────────────────
router.post('/salary-estimate', async (req, res) => {
  try {
    const { role, company, location, experienceLevel, skills } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const systemPrompt = `You are a compensation expert with deep knowledge of Indian IT industry salary benchmarks.
You provide accurate salary estimates based on role, company tier, location, and skills in the Indian market.`;

    const userPrompt = `Estimate salary for:
Role: ${role}
Company: ${company || 'Mid-size Indian IT company'}
Location: ${location || 'Bangalore/Mumbai/Hyderabad'}
Experience: ${experienceLevel || 'Fresher (0-1 year)'}
Key Skills: ${Array.isArray(skills) ? skills.join(', ') : (skills || 'MERN Stack')}

Return JSON:
{
  "minSalary": "<e.g. 3.5 LPA>",
  "maxSalary": "<e.g. 6 LPA>",
  "averageSalary": "<e.g. 4.5 LPA>",
  "companyTier": "<Tier 1 / Tier 2 / Tier 3 / Startup>",
  "negotiationTip": "<specific tip for salary negotiation in Indian context>",
  "topPayingCompanies": ["<company1>", "<company2>", "<company3>"],
  "salaryFactors": [
    { "factor": "<skill/cert that increases salary>", "impact": "<+X% or +X LPA>" }
  ],
  "disclaimer": "These are estimates based on 2024-25 Indian market data. Actual offers may vary."
}`;

    const result = await generate({ systemPrompt, userPrompt, jsonMode: true });
    res.json(result);
  } catch (err) {
    console.error('Salary estimate error:', err.message);
    if (err.message.includes('API key')) return res.status(401).json({ error: 'Invalid Gemini API key. Check backend/.env' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/optimize-xyz', async (req, res) => {
  try {
    const { bulletPoint, role = 'Software Developer' } = req.body;
    if (!bulletPoint || bulletPoint.trim().length < 5) {
      return res.status(400).json({ error: 'Please enter a valid bullet point (minimum 5 characters)' });
    }

    const systemPrompt = `You are a senior recruitment expert and resume writer who optimizes candidate resumes using the Action-Impact-Method (AIM) formula.
AIM formula: "Accomplished [Action] as measured by [Impact], by doing [Method]"
You rewrite boring or weak bullet points into high-impact, results-oriented achievements containing clear metrics, action verbs, and core technologies.`;

    const userPrompt = `Optimize this experience/project bullet point for a "${role}" resume using the Action-Impact-Method (AIM) formula:
"${bulletPoint}"

Rules:
1. Start with a strong action verb (e.g. Architected, Engineered, Optimized, Spearheaded).
2. Quantify the impact with realistic metrics (e.g. 15%, $50K, 200+ users, 2.5x).
3. Specify the tech stack or methods used (the Method part).
4. Output ONLY the optimized bullet point (one sentence, starting with a bullet character like "- " or "• "). Do not include any notes, explanations, or quotes.`;

    const text = await generate({ systemPrompt, userPrompt, jsonMode: false });
    res.json({ optimized: text.trim() });
  } catch (err) {
    console.error('AIM optimization error:', err.message);
    if (err.message.includes('API key')) return res.status(401).json({ error: 'Invalid Gemini API key. Check backend/.env' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/recreate-resume-xyz', async (req, res) => {
  try {
    const { resumeText, targetRole, skills = [], metrics = '', contact = {} } = req.body;
    if (!resumeText || resumeText.trim().length < 30) {
      return res.status(400).json({ error: 'Please upload or provide valid resume text' });
    }

    const name = contact.name || 'Candidate Name';
    const email = contact.email || 'email@domain.com';
    const phone = contact.phone || '+91 99999 99999';
    const linkedin = contact.linkedin || 'linkedin.com/in/username';
    const github = contact.github || 'github.com/username';

    const systemPrompt = `You are a senior recruitment expert and elite resume editor. 
You rewrite candidate resumes from scratch into a standard single-column print-ready text layout. 
You strictly implement the Action-Impact-Method (AIM) formula on all project and experience bullet points: "Accomplished [Action] as measured by [Impact], by doing [Method]".`;

    const userPrompt = `Recreate and rewrite this candidate's resume to be 100% ATS-compliant and optimized for the target role.

TARGET ROLE: ${targetRole || 'Software Developer'}
EMPHASIZED KEYWORDS/SKILLS: ${skills.join(', ')}
USER INCLUDED METRICS/HIGHLIGHTS: ${metrics || 'None specified'}

CONTACT INFORMATION (YOU MUST PLACE THIS EXACTLY AT THE VERY TOP OF THE RESUME, DO NOT USE PLACEHOLDERS):
Name: ${name}
Email: ${email}
Phone: ${phone}
LinkedIn: ${linkedin}
GitHub: ${github}

ORIGINAL RESUME TEXT:
"${resumeText.slice(0, 4500)}"

CRITICAL RULES:
1. Put the verified contact details (Name, Email, Phone, LinkedIn, GitHub) exactly at the top.
2. Structure the resume into these sections with clean margins and uppercase headers:
   - CONTACT INFORMATION
   - PROFESSIONAL SUMMARY
   - TECHNICAL SKILLS (categorized cleanly)
   - PROFESSIONAL EXPERIENCE (use STAR/AIM bullet achievements starting with strong action verbs)
   - PROJECTS (use STAR/AIM bullet achievements starting with strong action verbs)
   - EDUCATION
3. For ALL bullet points in Experience and Projects, use the Action-Impact-Method (AIM) format: "Accomplished [Action] as measured by [Impact], by doing [Method]" (e.g. Optimized client-side render speed by 25% using component lazy-loading and memoization). Include realistic metrics.
4. STRICT ZERO-DUPLICATION POLICY: A project, job role, accomplishment, skill, or bullet point should NEVER appear twice across different sections. If an item is listed in PROFESSIONAL EXPERIENCE, it MUST NOT appear in PROJECTS. Keep all descriptions unique, non-repetitive, and cleanly segregated.
5. Output ONLY the complete plain text resume. Do not write any greetings, intros, markdown backticks (like \`\`\`), explanations, or meta commentary.`;

    const text = await generate({ systemPrompt, userPrompt, jsonMode: false });
    res.json({ optimizedResume: text.trim() });
  } catch (err) {
    console.error('Recreate resume AIM error:', err.message);
    if (err.message.includes('API key')) return res.status(401).json({ error: 'Invalid Gemini API key. Check backend/.env' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

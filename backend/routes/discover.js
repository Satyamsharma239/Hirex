const express = require('express');
const router  = express.Router();
const JOBS_DATABASE = require('../data/jobsDatabase');
const { generate } = require('../services/geminiService');

// ── Cache ──────────────────────────────────────────────────────────
const cache    = new Map();
const CACHE_MS = 20 * 60 * 1000; // 20 min
const getCache = k => { const h = cache.get(k); if (!h) return null; if (Date.now() - h.ts > CACHE_MS) { cache.delete(k); return null; } return h.data; };
const setCache = (k, d) => cache.set(k, { data: d, ts: Date.now() });

const toArr = x => Array.isArray(x) ? x : (x?.jobs ? x.jobs : []);

// ── Full company database ──────────────────────────────────────────
const ALL_COMPANIES = []; // Kept empty for reference but we now dynamically generate based on role

const TODAY  = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
const CITIES = ['Bangalore','Hyderabad','Mumbai','Pune','Chennai','Delhi NCR','Noida','Jaipur','Ahmedabad','Remote','Kolkata'];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// Split array into chunks
function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Build Gemini prompt for role-specific generation
function buildJobPrompt(role, location, experience, skills, count) {
  return `You are an elite Indian job board AI. Today: ${TODAY}.
Generate EXACTLY ${count} highly realistic, varied job listings for the role: "${role}" | Location: ${location || 'India'} | Experience: ${experience} | Skills: ${skills || 'none specified'}.

CRITICAL RULES:
1. Make the companies REAL or highly realistic sounding for the SPECIFIC ROLE. If it's a Doctor, use Fortis, Apollo, etc. If it's Marketing, use Ogilvy, Dentsu, or startups. If it's Finance, use HDFC, ICICI, etc.
2. Ensure the "hrEmail" looks 100% real (e.g. careers@company.com, hr@startup.in).
3. The descriptions and requirements MUST match the specific role perfectly.
4. Return a JSON ARRAY of exactly ${count} job objects.

Each object MUST have ALL these exact keys:
{
  "id": "<8 random alphanumeric chars>",
  "title": "<job title — a natural variation of '${role}'>",
  "company": "<real or realistic company name that actually hires this role>",
  "companyType": "<e.g., Hospital, Ad Agency, Startup, FinTech, School>",
  "hrEmail": "<realistic HR email for this company>",
  "logo": "<first 2 uppercase letters of company name>",
  "logoColor": "<one of: #00c9a7, #3b82f6, #8b5cf6, #f59e0b, #f43f5e, #10b981, #06b6d4>",
  "location": "<vary across Indian cities, or Remote>",
  "mode": "<one of: On-site, Hybrid, Remote>",
  "type": "<one of: Full-time, Contract>",
  "salary": "<realistic Indian salary in LPA or Per Month format depending on role>",
  "experience": "<${experience}>",
  "posted": "<e.g. Today, 2 days ago>",
  "deadline": "<apply by date>",
  "openings": <integer 1 to 5>,
  "description": "<2-3 detailed sentences describing the exact work environment and duties>",
  "responsibilities": ["<specific duty>","<specific duty>","<specific duty>"],
  "requirements": ["<required skill>","<required skill>","<required skill>"],
  "niceToHave": ["<bonus>","<bonus>"],
  "benefits": ["<benefit>","<benefit>"],
  "matchScore": <integer between 60 and 99>,
  "matchReason": "<1 sentence explaining fit>",
  "tags": ["<tag>","<tag>","<tag>"]
}

Return ONLY the valid JSON array of ${count} items. No markdown, no explanations.`;
}

// ════════════════════════════════════════════════════════════════
// POST /api/discover/jobs  — returns 30 jobs via 2 parallel calls
// ════════════════════════════════════════════════════════════════
router.post('/jobs', async (req, res) => {
  try {
    const { role = '', location = 'Bangalore', skills = [], experience = 'Fresher', page = 1 } = req.body;
    if (!role.trim()) return res.status(400).json({ error: 'Role is required' });

    const skillStr = Array.isArray(skills) ? skills.join(', ') : String(skills);
    const cacheKey = `jobs:${role}:${location}:${experience}:p${page}`.toLowerCase().replace(/\s+/g,'-');
    const hit = getCache(cacheKey);
    if (hit) { console.log('[cache hit]', cacheKey); return res.json(hit); }

    let jobs = [];

    // Try fetching from Gemini
    try {
      const pageSize = 20;
      const batchSize = 10;
      console.log(`[/jobs] Page ${page} — fetching ${pageSize} jobs in parallel for role: ${role}`);
      const [result1, result2] = await Promise.all([
        generate({ prompt: buildJobPrompt(role, location, experience, skillStr, batchSize), temperature: 0.9, maxOutputTokens: 8192 }),
        generate({ prompt: buildJobPrompt(role, location, experience, skillStr, batchSize), temperature: 0.9, maxOutputTokens: 8192 }),
      ]);
      jobs = [...toArr(result1), ...toArr(result2)];
    } catch (apiErr) {
      console.warn('⚠️ [Gemini API Error] Falling back to local static database:', apiErr.message);
    }

    // Fallback: search and customize local static database
    if (jobs.length === 0) {
      const searchTerms = role.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      
      // Filter database by search terms matching title, description or tags
      let filteredLocalJobs = JOBS_DATABASE.filter(j => {
        const title = j.title.toLowerCase();
        const desc = j.description.toLowerCase();
        const tags = j.tags.map(t => t.toLowerCase()).join(' ');
        return searchTerms.some(term => title.includes(term) || desc.includes(term) || tags.includes(term));
      });

      // If no matching jobs found locally, fall back to our entire database
      if (filteredLocalJobs.length === 0) {
        filteredLocalJobs = JOBS_DATABASE;
      }

      // Customize local jobs to match user location and experience level dynamically
      jobs = filteredLocalJobs.map((j, index) => ({
        ...j,
        id: `${j.id}-customized-${index}-${Math.floor(Math.random()*1000)}`,
        // Dynamic customization to match searched parameters
        title: j.title.toLowerCase().includes(role.toLowerCase()) ? j.title : `${role}`,
        location: location || j.location,
        experience: experience || j.experience,
        posted: `${index + 1} day${index === 0 ? '' : 's'} ago`,
      }));
    }

    // We allow up to 3 pages for the infinite scroll illusion
    const hasMore = page < 3;
    const out = { jobs, total: jobs.length, role, location, page, hasMore };
    if (jobs.length > 5) setCache(cacheKey, out);
    res.json(out);
  } catch (err) {
    console.error('[/jobs] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// POST /api/discover/outreach-email
// ════════════════════════════════════════════════════════════════
router.post('/outreach-email', async (req, res) => {
  try {
    const {
      job,
      userName            = '',
      userEmail           = '',
      userBackground      = '',
      userSkills          = [],
      resumeSkillsPresent = [],
      resumeSkillsMissing = [],
      resumeImprovement   = '',
      resumeText          = '',
    } = req.body;

    if (!job) return res.status(400).json({ error: 'Job details required' });

    const name      = userName.trim() || 'Job Applicant';
    const skillStr  = Array.isArray(userSkills) ? userSkills.join(', ') : String(userSkills);
    const hasResume = resumeSkillsPresent.length > 0 || resumeText.length > 100;
    const matched   = resumeSkillsPresent.length > 0 ? resumeSkillsPresent.slice(0, 5).join(', ') : skillStr;
    const jobReqs   = (job.requirements || []).join(', ');

    // Determine tone by company type
    const companyType = (job.companyType || '').toLowerCase();
    let tone, greeting, style;
    if (companyType.includes('startup') || companyType.includes('studio') || companyType.includes('ai ') || companyType.includes('agency')) {
      tone    = 'casual and energetic — like one builder talking to another. Use "I\'m excited", "love what you\'re building", etc.';
      greeting= `Hi ${job.company} Team,`;
      style   = 'Lead with what excites them about the startup\'s specific mission. Be direct and punchy.';
    } else if (companyType.includes('it services') || companyType.includes('it consulting') || companyType.includes('consulting')) {
      tone    = 'formal and structured. Use "Dear", "I wish to apply", "I would welcome the opportunity"';
      greeting= `Dear ${job.company} Recruitment Team,`;
      style   = 'Lead with qualifications and reliability. Emphasize process, teamwork, and domain knowledge.';
    } else if (companyType.includes('unicorn') || companyType.includes('giant') || companyType.includes('fintech')) {
      tone    = 'warm-professional — ambitious but respectful. Use "I\'ve admired", "genuinely excited", "would love to contribute"';
      greeting= `Dear ${job.company} Hiring Team,`;
      style   = 'Lead with a specific thing you admire about the company\'s product or growth. Then pivot to skills.';
    } else {
      tone    = 'professional yet personable';
      greeting= `Dear ${job.company} Recruitment Team,`;
      style   = 'Balance enthusiasm with professionalism.';
    }

    // Pick a random email structure so every email looks different
    const structures = [
      'Lead with who you are → why this company → your matching skills → CTA',
      'Lead with what excites you about the company → your relevant experience → specific skills match → CTA',
      'Lead with a skill that directly matches their top requirement → who you are → company excitement → CTA',
    ];
    const structure = structures[Math.floor(Math.random() * structures.length)];

    const prompt = `Write a UNIQUE, ${tone} cold-outreach email from "${name}" to "${job.company}" for the "${job.title}" role.

CANDIDATE:
- Name: ${name}
- Email: ${userEmail || '(their email)'}
- Background: ${userBackground || 'A passionate developer'}
- Skills: ${matched || skillStr || 'programming'}
${hasResume ? `- Resume skills that match this job: ${matched}
- Gaps (never mention): ${resumeSkillsMissing.join(', ')}
- Resume excerpt: "${resumeText.slice(0, 400)}"` : ''}

JOB:
- Company: ${job.company} (${job.companyType})
- Role: ${job.title} in ${job.location}
- What they do: ${job.description || job.companyType}
- Requirements: ${jobReqs}

EMAIL RULES:
1. Start with EXACTLY this greeting: "${greeting}"
2. TONE: ${tone}
3. STRUCTURE: ${structure}
4. STYLE NOTE: ${style}
5. Para 1 (2 sentences): Opening based on structure above
6. Para 2 (2-3 sentences): Name 2-3 SPECIFIC technologies/skills from "${matched}" that match "${jobReqs}" — be concrete
7. Para 3 (1-2 sentences): CTA — ask for a brief call or interview opportunity, mention availability
8. Sign off: "Best regards,\\n${name}\\n${userEmail || ''}"
9. WORD COUNT: 150-200 words exactly
10. CRITICAL: Make it sound human-written, NOT like a template. Avoid generic phrases like "I am writing to express my interest". Be specific, be real.

Return JSON with exactly these keys:
{
  "subject": "<specific subject — e.g. 'Application: ${job.title} | ${name} | ${(matched || skillStr || 'Developer').split(',')[0].trim()}'>",
  "body": "<full email body — use \\n for line breaks, include greeting and sign-off>",
  "tips": ["<personalization tip specific to ${job.company}>","<what to add if they have a relevant project>","<best time to follow up>"]
}`;

    const result = await generate({ prompt, temperature: 0.9 });
    res.json(result);
  } catch (err) {
    console.error('[/outreach-email] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// POST /api/discover/career-dna
// ════════════════════════════════════════════════════════════════
router.post('/career-dna', async (req, res) => {
  try {
    const { resumeText = '', currentSkills = [] } = req.body;
    if (resumeText.trim().length < 30)
      return res.status(400).json({ error: 'Resume text too short' });

    const prompt = `Analyze this resume for an Indian tech job seeker. Today: ${TODAY}.

RESUME TEXT:
${resumeText.slice(0, 4500)}

Additional skills mentioned: ${currentSkills.join(', ')}

Return a single JSON object (no markdown, no array):
{
  "careerPersonality": "<one of: The Builder, The Analyst, The Problem Solver, The Creator, The Architect, The Strategist, The Innovator>",
  "careerPersonalityDesc": "<2 sentences about their unique work style based on the resume>",
  "overallStrength": "<their single strongest professional attribute — 1 sentence>",
  "readinessLevel": "<one of: Entry-Ready, Job-Ready, Senior-Ready>",
  "topSkills": ["<skill1>","<skill2>","<skill3>","<skill4>","<skill5>"],
  "skillGaps": ["<gap1>","<gap2>","<gap3>"],
  "recommendedRoles": [
    {"title":"<role title>","fit":<70-99>,"reason":"<why they fit — 1 sentence>","avgSalary":"<e.g. 5-9 LPA>","demandLevel":"<Very High or High or Medium>","growthPath":"<career growth in 3-5 years>"},
    {"title":"<role>","fit":<int>,"reason":"<sentence>","avgSalary":"<LPA>","demandLevel":"<>","growthPath":"<>"},
    {"title":"<role>","fit":<int>,"reason":"<sentence>","avgSalary":"<LPA>","demandLevel":"<>","growthPath":"<>"},
    {"title":"<role>","fit":<int>,"reason":"<sentence>","avgSalary":"<LPA>","demandLevel":"<>","growthPath":"<>"}
  ],
  "topIndustries": ["<industry1>","<industry2>","<industry3>"],
  "careerAdvice": "<3-4 sentences of personalized actionable advice>",
  "oneThingToLearnNow": "<most impactful skill to learn RIGHT NOW for Indian job market>",
  "timeToHire": "<realistic estimate e.g. 3-6 weeks>",
  "confidence": "<1 encouraging sentence using their specific achievements from the resume>"
}`;

    const result = await generate({ prompt, temperature: 0.9 });
    res.json(result);
  } catch (err) {
    console.error('[/career-dna] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// POST /api/discover/company-intel
// ════════════════════════════════════════════════════════════════
router.post('/company-intel', async (req, res) => {
  try {
    const { company, role = 'Software Developer' } = req.body;
    if (!company) return res.status(400).json({ error: 'Company required' });

    const key = `intel:${company}`.toLowerCase().replace(/\s+/g,'-');
    const hit = getCache(key);
    if (hit) return res.json(hit);

    const prompt = `Provide a detailed company intelligence report for "${company}" for an Indian job seeker applying for "${role}". Today: ${TODAY}.

Return a single JSON object:
{
  "company": "${company}",
  "founded": "<founding year>",
  "headquarters": "<city, India>",
  "size": "<e.g. 500-2000 employees>",
  "domain": "<core business domain>",
  "fundingStage": "<Series X or Listed or Bootstrapped or Acquired>",
  "valuation": "<valuation if known, else Not disclosed>",
  "cultureScore": <integer 6-10>,
  "workLifeScore": <integer 5-10>,
  "salaryScore": <integer 6-10>,
  "growthScore": <integer 6-10>,
  "overallRating": <3.0 to 5.0>,
  "interviewProcess": ["<Round 1: description>","<Round 2: description>","<Round 3: description>"],
  "interviewDifficulty": "<Easy or Medium or Hard or Very Hard>",
  "typicalTimeline": "<e.g. 2-3 weeks from application to offer>",
  "commonTopics": ["<topic1>","<topic2>","<topic3>","<topic4>","<topic5>"],
  "insiderTips": ["<practical tip 1>","<practical tip 2>","<practical tip 3>"],
  "pros": ["<pro1>","<pro2>","<pro3>"],
  "cons": ["<con1>","<con2>"],
  "notablePerks": ["<perk1>","<perk2>","<perk3>","<perk4>"],
  "salaryRange": "<salary range for ${role} at this company>",
  "techStack": ["<tech1>","<tech2>","<tech3>","<tech4>","<tech5>"],
  "dresscode": "<Casual or Business Casual or Formal>",
  "verdict": "<2 honest sentences summarizing if this is a good company to join for this role>"
}`;

    const result = await generate({ prompt, temperature: 0.9 });
    setCache(key, result);
    res.json(result);
  } catch (err) {
    console.error('[/company-intel] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// POST /api/discover/role-jobs  (Career DNA "Find Jobs" button)
// ════════════════════════════════════════════════════════════════
router.post('/role-jobs', async (req, res) => {
  try {
    const { role = '', location = 'Bangalore', skills = [] } = req.body;
    if (!role.trim()) return res.status(400).json({ error: 'Role required' });

    const key = `role:${role}:${location}`.toLowerCase().replace(/\s+/g,'-');
    const hit = getCache(key);
    if (hit) return res.json(hit);

    const skillStr  = Array.isArray(skills) ? skills.join(', ') : String(skills);
    const selected  = shuffle(ALL_COMPANIES).slice(0, 15);
    const raw       = await generate({ prompt: buildJobPrompt(role, location, 'Any', skillStr, selected), temperature: 0.9, maxOutputTokens: 8192 });
    const jobs      = toArr(raw);
    const out       = { jobs, total: jobs.length, role };
    if (jobs.length) setCache(key, out);
    res.json(out);
  } catch (err) {
    console.error('[/role-jobs] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// POST /api/discover/ats-audit
// ════════════════════════════════════════════════════════════════
router.post('/ats-audit', async (req, res) => {
  try {
    const { resumeText = '', skills = [] } = req.body;
    if (!resumeText.trim() || resumeText.length < 30) {
      return res.status(400).json({ error: 'Resume text too short or empty' });
    }

    const skillStr = Array.isArray(skills) ? skills.join(', ') : String(skills);
    
    const prompt = `You are a Senior Recruiter and ATS (Applicant Tracking System) Expert with years of hiring experience in the tech sector.
Analyze this candidate's resume text and generate a comprehensive ATS Audit Report, customized suggestions, and a Suited Roles directory containing exactly 20 suited tech job titles they are qualified for based on their profile.

Candidate Resume Text:
"${resumeText.slice(0, 4500)}"

Additional skills: ${skillStr}

Return a single JSON object (with no markdown wrappers, no arrays outside fields):
{
  "atsGrade": "<A, B, C, D, or F>",
  "atsScore": <integer 0-100>,
  "recruiterSummary": "<3 sentences of expert feedback from a senior recruiter perspective on their strengths and gaps>",
  "formattingAudits": [
    {"rule":"Avoid tables & columns","status":"<Pass / Fail / Warning>","reason":"<why it passed or failed>"},
    {"rule":"Standard section headers","status":"<Pass / Fail / Warning>","reason":"<why>"},
    {"rule":"Font & readability consistency","status":"<Pass / Fail / Warning>","reason":"<why>"},
    {"rule":"Contact details location","status":"<Pass / Fail / Warning>","reason":"<why>"}
  ],
  "keywordDensity": [
    {"keyword":"React","present":true,"count":4},
    {"keyword":"TypeScript","present":false,"count":0},
    {"keyword":"Node.js","present":true,"count":2},
    {"keyword":"Docker","present":false,"count":0}
  ],
  "rewrittenSummary": "<ATS-optimized 3-sentence professional summary using high-impact action verbs and metric placeholders>",
  "rewrittenBullets": [
    "<High-impact resume experience bullet point 1 using STAR/XYZ format (Accomplished X as measured by Y by doing Z)>",
    "<High-impact resume experience bullet point 2 using STAR/XYZ format>",
    "<High-impact resume experience bullet point 3 using STAR/XYZ format>",
    "<High-impact resume experience bullet point 4 using STAR/XYZ format>"
  ],
  "suitedRoles": [
    {"index":1,"title":"React Developer","fit":98,"reason":"Excellent match with your frontend state and component framework projects.","avgSalary":"6-10 LPA","demand":"Very High"},
    {"index":2,"title":"Frontend Engineer","fit":95,"reason":"Strong JavaScript logic and responsive web interface background.","avgSalary":"5-9 LPA","demand":"Very High"},
    {"index":3,"title":"MERN Stack Developer","fit":94,"reason":"Full-stack project experience spanning MongoDB, Express, React, and Node.js.","avgSalary":"6-9 LPA","demand":"High"},
    {"index":4,"title":"Node.js Developer","fit":90,"reason":"Solid backend API construction and asynchronous logic understanding.","avgSalary":"5-8 LPA","demand":"High"},
    {"index":5,"title":"JavaScript Developer","fit":90,"reason":"Deep knowledge of JavaScript ES6+, closures, and asynchronous flow control.","avgSalary":"5-8 LPA","demand":"High"},
    {"index":6,"title":"Web Developer","fit":88,"reason":"General capability to design and implement client-side websites.","avgSalary":"4-7 LPA","demand":"Medium"},
    {"index":7,"title":"Associate Software Engineer","fit":85,"reason":"Foundational computer science concepts and coding ability for entry roles.","avgSalary":"6-10 LPA","demand":"High"},
    {"index":8,"title":"Junior Backend Developer","fit":82,"reason":"Familiarity with server architectures, routing, and databases.","avgSalary":"4-7 LPA","demand":"Medium"},
    {"index":9,"title":"UI Developer","fit":80,"reason":"Expertise in CSS, flexbox, grid, and converting designs to pixel-perfect layouts.","avgSalary":"4-6 LPA","demand":"Medium"},
    {"index":10,"title":"Full Stack Developer","fit":80,"reason":"Versatile experience on both client-side interfaces and database models.","avgSalary":"5-8 LPA","demand":"High"},
    {"index":11,"title":"Software Developer","fit":78,"reason":"Ability to write modular code, resolve bugs, and build features.","avgSalary":"5-9 LPA","demand":"High"},
    {"index":12,"title":"Data Analyst","fit":75,"reason":"Capability to handle structured database queries (SQL/MongoDB) and clean JSON data.","avgSalary":"4-7 LPA","demand":"Medium"},
    {"index":13,"title":"QA Automation Engineer","fit":72,"reason":"Logical mindset suitable for writing test scripts and verifying interface inputs.","avgSalary":"4-8 LPA","demand":"Medium"},
    {"index":14,"title":"Technical Support Engineer","fit":70,"reason":"Deep technical knowledge to diagnose user issues, review logs, and fix bugs.","avgSalary":"3-6 LPA","demand":"Medium"},
    {"index":15,"title":"DevOps Junior Associate","fit":68,"reason":"Foundational skills in hosting backend routes and configuring CORS or proxy headers.","avgSalary":"5-8 LPA","demand":"Medium"},
    {"index":16,"title":"Product Analyst","fit":65,"reason":"Strong combination of coding understanding and product features analysis.","avgSalary":"4-8 LPA","demand":"Medium"},
    {"index":17,"title":"Mobile Web Developer","fit":62,"reason":"Designing responsive viewports for mobile browsers using flexbox media queries.","avgSalary":"4-7 LPA","demand":"Medium"},
    {"index":18,"title":"Solutions Engineer","fit":60,"reason":"Helping customize and integrate APIs, webhooks, and database configurations.","avgSalary":"5-9 LPA","demand":"Medium"},
    {"index":19,"title":"API Developer","fit":60,"reason":"Designing structured RESTful APIs, routing parameters, and error handlers.","avgSalary":"5-8 LPA","demand":"High"},
    {"index":20,"title":"Technical Writer","fit":60,"reason":"Strong documentation capacity and clear layout formatting capability.","avgSalary":"3-6 LPA","demand":"Medium"}
  ]
}`;

    const result = await generate({ prompt, jsonMode: true });
    res.json(result);
  } catch (err) {
    console.error('[/ats-audit] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// ════════════════════════════════════════════════════════════════
// The 5 unique endpoints are appended below
// ════════════════════════════════════════════════════════════════


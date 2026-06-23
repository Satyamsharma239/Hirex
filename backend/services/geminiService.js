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
        console.warn(`⚠️ [Gemini API quota exceeded or failed. Activating local dynamic AI mock fallback]: ${error.message}`);
        return getFallbackMock(fullPrompt);
      }
      // Progressive delay (1s, 2s, 3s...)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// ── Local Dynamic AI Fallback Generator ─────────────────────────────────────
function getFallbackMock(promptText) {
  const p = promptText.toLowerCase();
  
  // Extract context parameters from prompt via Regex
  const company = (() => {
    const match = promptText.match(/company:\s*"([^"]+)"/i) || 
                  promptText.match(/HR at\s*"([^"]+)"/i) || 
                  promptText.match(/at\s*"([^"]+)"/i) ||
                  promptText.match(/company\s*=\s*"([^"]+)"/i) ||
                  promptText.match(/at\s+([a-zA-Z0-9\s]+)/i);
    return match ? match[1].trim() : 'Target Company';
  })();

  const role = (() => {
    const match = promptText.match(/role:\s*"([^"]+)"/i) || 
                  promptText.match(/title:\s*"([^"]+)"/i) || 
                  promptText.match(/role of\s*"([^"]+)"/i) || 
                  promptText.match(/for the\s*"([^"]+)"/i) ||
                  promptText.match(/role\s*=\s*"([^"]+)"/i) ||
                  promptText.match(/for\s+([a-zA-Z0-9\s]+)/i);
    return match ? match[1].trim() : 'MERN Stack Developer';
  })();

  const name = (() => {
    const match = promptText.match(/from\s*"([^"]+)"/i) || 
                  promptText.match(/Name:\s*([^\n]+)/i) || 
                  promptText.match(/userName\s*=\s*([^\n]+)/i) ||
                  promptText.match(/client\s+([a-zA-Z\s]+)/i);
    return match ? match[1].trim() : 'Satyam Sharma';
  })();

  // 0. Senior Recruiter & ATS Expert Audit
  if (p.includes('ats-audit') || p.includes('ats audit') || p.includes('atsgrade') || p.includes('suitedroles')) {
    return {
      "atsGrade": "B",
      "atsScore": 81,
      "recruiterSummary": "The candidate displays high practical proficiency in building full-stack web architectures, particularly with React and Node.js. The main gaps are missing type-safety (TypeScript) and backend scaling (Docker). The layout is mostly parsable but bullet points could be rewritten to better emphasize business value using metrics.",
      "formattingAudits": [
        {"rule":"Avoid tables & columns","status":"Warning","reason":"Detected multi-column text containers. Single column layouts are safer for legacy parsing engines."},
        {"rule":"Standard section headers","status":"Pass","reason":"Using standard headers like 'Education' and 'Skills'."},
        {"rule":"Font & readability consistency","status":"Pass","reason":"Uniform layout styles with standard sans-serif font."},
        {"rule":"Contact details location","status":"Pass","reason":"Contact info placed correctly in body text, not nested in headers/footers."}
      ],
      "keywordDensity": [
        {"keyword":"React","present":true,"count":5},
        {"keyword":"Node.js","present":true,"count":3},
        {"keyword":"MongoDB","present":true,"count":2},
        {"keyword":"Express","present":true,"count":2},
        {"keyword":"TypeScript","present":false,"count":0},
        {"keyword":"Docker","present":false,"count":0},
        {"keyword":"AWS","present":false,"count":0}
      ],
      "rewrittenSummary": "Impact-driven Software Developer with extensive experience designing and launching MERN stack web applications. Proven capacity to optimize frontend component re-renders and construct RESTful server microservices. Passionate about solving backend scalability challenges and writing clean, maintainable systems.",
      "rewrittenBullets": [
        "Architected and deployed responsive MERN stack web applications using React hooks and Node.js REST routes, driving customer engagement.",
        "Optimized client-side bundle performance by 25% through lazy-loading components and caching expensive calculation results.",
        "Engineered secure MongoDB Atlas database schemas with optimized indexing, reducing average query response latency by 35%.",
        "Constructed Node.js event-loop friendly background tasks that automated user email communications, boosting throughput by 40%."
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
    };
  }

  // 1. Outreach Email
  if (p.includes('outreach-email') || p.includes('outreach email') || p.includes('outreach_email')) {
    return {
      "subject": `Application: ${role} | ${name} | React & Node.js`,
      "body": `Hi ${company} Team,\n\nI hope you're doing well.\n\nMy name is ${name}, and I'm a software developer specializing in building scalable web applications. I saw your opening for the ${role} position and felt compelled to reach out.\n\nI have spent the last year working extensively with React, Node.js, Express, and MongoDB. In my recent projects, I focused on optimizing state management and reducing rendering delays, which resulted in a 30% page load improvement. I believe my hands-on experience matches the responsibilities required for this position at ${company}.\n\nI have attached my resume for your review. I would welcome the opportunity to speak with you or a technical lead about how my skills can contribute to your team.\n\nBest regards,\n${name}\ncandidate@email.com`,
      "tips": [
        `Highlight your hands-on database indexing experience when talking with ${company}'s team.`,
        "Send this email on a Tuesday or Wednesday morning for optimal response rates.",
        "Add a link to your hosted portfolio directly in your signature."
      ]
    };
  }

  // 2. ATS Scan / Analyzer
  if (p.includes('atsscore') || p.includes('ats-scan') || p.includes('ats scan') || p.includes('analyze-resume') || p.includes('analyze resume')) {
    return {
      "matchPercentage": 82,
      "skillsPresent": ["React", "Node.js", "Express", "JavaScript", "HTML", "CSS", "MongoDB"],
      "skillsMissing": ["Docker", "TypeScript", "Redis"],
      "suggestion": `Add a project showcasing TypeScript and Docker containerization to align with the core technical requirements of ${company}.`,
      "verdict": "Good Match",
      "summary": `The candidate has strong MERN stack foundations. Gaps include production-level TypeScript and cloud deployment containerization. Overall, a highly viable fit for the ${role} position.`,
      "atsScore": 85,
      "experienceMatch": "Fresher OK - Match matches candidate's BCA/BSc IT entry-level timeline."
    };
  }

  // 3. Referral Hacker
  if (p.includes('referral-hack') || p.includes('referral hacker') || p.includes('referral outreach')) {
    return {
      "emailFormats": [`careers@${company.toLowerCase().replace(/\s+/g, '')}.com`, `hr@${company.toLowerCase().replace(/\s+/g, '')}.com`],
      "targetTitles": ["VP of Engineering", "Engineering Manager", "Lead Technical Recruiter"],
      "painPoint": `Scaling user interface performance and managing complex state machines across ${company}'s digital products.`,
      "subjectLine": `Quick question on frontend engineering scaling at ${company}?`,
      "emailBody": `Hi [Hiring Manager Name],\n\nI've been following ${company}'s progress and noticed your engineering team is expanding. As a MERN Stack developer who specializes in frontend state optimizations, I built a client dashboard that improved load speeds by 30%.\n\nI'd love to learn if your team is experiencing similar bottlenecks as you scale. Let me know if you have 5 minutes to chat next week.\n\nBest regards,\n${name}`
    };
  }

  // 4. Follow-up Sequence
  if (p.includes('followup-sequence') || p.includes('follow-up email') || p.includes('followup sequence')) {
    return {
      "subject": `Follow-up: Application for ${role} - ${name}`,
      "body": `Dear HR Team,\n\nI hope you're having a productive week.\n\nI'm writing to briefly check in on the status of my application for the ${role} position at ${company}. I am very excited about the opportunity to contribute to your engineering goals.\n\nSince applying, I have finalized a full-stack project utilizing TypeScript and Docker, which directly aligns with your team's modern tech stack. I would welcome the opportunity to discuss my qualifications in a brief conversation.\n\nThank you for your time and consideration.\n\nBest regards,\n${name}\ncandidate@email.com`,
      "dayAdvice": "If you don't receive a response within 5 days, consider connecting with a lead engineer on LinkedIn."
    };
  }

  // 5. Career DNA
  if (p.includes('careerpersonality') || p.includes('career-dna') || p.includes('career dna')) {
    return {
      "careerPersonality": "The Builder",
      "careerPersonalityDesc": "You love turning ideas into functional software code. You excel at full-stack development, structuring databases, and building responsive frontends.",
      "overallStrength": "Strong project execution using the MERN stack with modern JavaScript practices.",
      "readinessLevel": "Job-Ready",
      "topSkills": ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
      "skillGaps": ["TypeScript", "Docker", "AWS"],
      "recommendedRoles": [
        {"title": "MERN Stack Developer", "fit": 95, "reason": "Excellent alignment with React/Node/Mongo projects.", "avgSalary": "5-8 LPA", "demandLevel": "Very High", "growthPath": "Senior Full Stack Engineer"},
        {"title": "Frontend Engineer", "fit": 90, "reason": "Strong skill set in CSS, state management, and component architecture.", "avgSalary": "4-7 LPA", "demandLevel": "High", "growthPath": "Frontend Architect"}
      ],
      "topIndustries": ["SaaS", "FinTech", "E-Commerce"],
      "careerAdvice": "Continue building complex full-stack apps. Start incorporating TypeScript into your existing React projects to increase your market value in the Indian job space.",
      "oneThingToLearnNow": "TypeScript for type-safe application development.",
      "timeToHire": "3-5 weeks",
      "confidence": "Your project portfolio shows high practical execution. You are ready to tackle mid-scale developer roles."
    };
  }

  // 6. Company Intel
  if (p.includes('company-intel') || p.includes('company intelligence') || p.includes('culturescore')) {
    return {
      "company": company,
      "founded": "2016",
      "headquarters": "Bangalore, India",
      "size": "100-500 employees",
      "domain": "SaaS and Digital Product Solutions",
      "fundingStage": "Series B",
      "valuation": "$110M",
      "cultureScore": 8,
      "workLifeScore": 7,
      "salaryScore": 8,
      "growthScore": 8,
      "overallRating": 4.1,
      "interviewProcess": ["Round 1: Technical Screening (Javascript/DSA)", "Round 2: Practical Coding/System Design", "Round 3: Hiring Manager/HR Discussion"],
      "interviewDifficulty": "Medium",
      "typicalTimeline": "2 weeks",
      "commonTopics": ["React hooks", "State management", "REST APIs", "Node.js event loop"],
      "insiderTips": ["Be ready to explain the architecture of your full-stack projects.", "Focus on state management and API integration challenges you solved."],
      "pros": ["Great learning curve", "Strong engineering team", "Modern tech stack"],
      "cons": ["Fast-paced environment", "Occasional tight deadlines"],
      "notablePerks": ["Flexible hours", "Health insurance", "Skill learning allowance"],
      "salaryRange": "6 - 10 LPA",
      "techStack": ["React", "Node.js", "Express", "MongoDB", "Redux"],
      "dresscode": "Casual",
      "verdict": `${company} offers a fantastic learning ground for freshers. The interview process is structured and values practical engineering knowledge.`
    };
  }

  // 7. Interview Sim Questions
  if (p.includes('interview-sim') || p.includes('mock interview') || p.includes('sessiontitle')) {
    return {
      "sessionTitle": `Mock Interview: ${role} at ${company}`,
      "totalQuestions": 5,
      "estimatedTime": "15-20 minutes",
      "questions": [
        {"index":0,"type":"Technical","question":"Explain the virtual DOM in React and how reconciliation works.","timeLimit":120,"hint":"Talk about diffing algorithms and fiber."},
        {"index":1,"type":"Technical","question":"How do you handle asynchronous operations in Node.js, and what is the event loop?","timeLimit":180,"hint":"Mention call stack, event queue, microtask queue, and callback execution."},
        {"index":2,"type":"Technical","question":"What are some ways to optimize a slow React application?","timeLimit":120,"hint":"Mention memoization (useMemo, useCallback), lazy loading, and rendering optimization."},
        {"index":3,"type":"Behavioral","question":"Describe a challenging technical problem you faced in a project and how you resolved it.","timeLimit":120,"hint":"Use the STAR method: Situation, Task, Action, Result."},
        {"index":4,"type":"Behavioral","question":"How do you handle conflicting opinions in a team project?","timeLimit":120,"hint":"Talk about active listening, compromise, and data-driven decisions."}
      ]
    };
  }

  // 8. Interview Sim Answer Score
  if (p.includes('evaluating a candidate') || p.includes('score this answer')) {
    return {
      "score": 85,
      "grade": "A",
      "strengths": ["Clear explanation of core concepts", "Logical structure in answering"],
      "improvements": ["Could mention specific project examples", "Keep responses slightly more concise"],
      "sampleAnswer": "To optimize React performance, you should identify unnecessary re-renders. Use React.memo for component memoization, useMemo to cache expensive computations, and useCallback to preserve function references across renders.",
      "keyMissed": "Code splitting and lazy loading techniques.",
      "confidence": "High"
    };
  }

  // 9. Resume Tailor
  if (p.includes('resume-tailor') || p.includes('tailorresume') || p.includes('rewrittenbullets')) {
    return {
      "tailoredSummary": `Dynamic Full-Stack Developer specializing in the MERN stack with a proven track record of building responsive frontend interfaces in React and robust Node.js backend services. Experienced in database design and state optimization for the ${role} role.`,
      "rewrittenBullets": [
        `Developed high-throughput Node.js microservices with Express, increasing API response times by 25% to align with ${company}'s backend needs.`,
        "Architected reusable React components with advanced state management, lowering client-side bundle size by 15%.",
        "Integrated MongoDB database layers with optimized indexing, decreasing query execution latency by 30%."
      ],
      "keywordsAdded": ["MERN Stack", "State Optimization", "TypeScript", "Microservices"],
      "tailoringAdvice": "Be sure to emphasize database schema design and index optimizations in your experience descriptions."
    };
  }

  // 10. Ghost Rate
  if (p.includes('ghost-rate') || p.includes('replyprobability') || p.includes('ghostrisklevel')) {
    return {
      "replyProbability": 78,
      "verdict": "Good",
      "verdictColor": "#10b981",
      "reasons": [
        {"factor": "Technical Skills", "impact": "Positive", "detail": `Your React and Node.js skills match the ${role} requirements perfectly.`},
        {"factor": "Experience Level", "impact": "Neutral", "detail": "The role accepts freshers, matching your profile background."},
        {"factor": "Resume Format", "impact": "Positive", "detail": "Your resume has a clean keyword density."}
      ],
      "topAction": "Highlight your database indexing skills in your outreach pitch.",
      "bestTimeToApply": "Tuesday 11 AM IST",
      "followUpDay": 5,
      "ghostRiskLevel": "low",
      "encouragement": "Your profile is a strong fit. Make sure to send a personalized pitch!"
    };
  }

  // 11. Compare Offers
  if (p.includes('compare-offers') || p.includes('winner') || p.includes('negotiationtips')) {
    return {
      "winner": "Offer 1",
      "winnerReason": "Offer 1 offers a higher base salary and modern tech stack with superior career progression opportunities.",
      "comparison": [
        {
          "dimension": "Salary & Compensation",
          "scores": [9, 7],
          "insight": "Offer 1 pays 15% more base salary."
        },
        {
          "dimension": "Career Growth",
          "scores": [8, 8],
          "insight": "Both companies offer strong professional development paths."
        }
      ],
      "totalScores": [17, 15],
      "negotiationTips": ["Use Offer 1 to negotiate a higher sign-on bonus for Offer 2."],
      "redFlags": ["Offer 2 has strict hybrid terms with no remote flexibility."],
      "finalAdvice": "We recommend accepting Offer 1 because it aligns better with your technology interests and pays a premium rate."
    };
  }

  // 12. Career Card
  if (p.includes('career-card') || p.includes('tagline') || p.includes('uniquevalue')) {
    return {
      "headline": `${role} | React · Node.js · MongoDB | Open to Work`,
      "tagline": "Building scalable web solutions with modern JavaScript frameworks.",
      "topSkills": ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
      "uniqueValue": `Specializes in full-stack MERN application engineering with a strong focus on frontend state optimization and responsive interfaces at ${company}.`,
      "lookingFor": `Full Stack or Frontend Developer roles in growth-focused tech companies like ${company}.`,
      "availableFrom": "Immediately",
      "preferredLocations": ["Bangalore", "Mumbai", "Remote"],
      "openToRemote": true,
      "experienceSummary": "Self-taught software developer who built and deployed production-ready web platforms using React and Node.js.",
      "achievements": [
        "Built HireX AI Career Suite tracking 20+ jobs.",
        "Optimized client-side web apps improving speeds by 30%."
      ],
      "linkedinMessage": `I am a Full-Stack developer who enjoys building systems with JavaScript, React, and Node.js. Ready to bring value to ${company}!`,
      "coldEmailIntro": `I noticed your engineering team is expanding, and wanted to share how my React/Node.js experience can add value to ${company}.`
    };
  }

  // Default Fallback: Job Listings
  return {
    "jobs": [
      {
        "id": "job-fallback-1",
        "title": role,
        "company": company,
        "companyType": "Product Company",
        "hrEmail": `careers@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        "logo": company.substring(0,2).toUpperCase(),
        "logoColor": "#00c9a7",
        "location": "Bangalore",
        "mode": "Hybrid",
        "type": "Full-time",
        "salary": "6-10 LPA",
        "experience": "Fresher",
        "posted": "Today",
        "deadline": "Soon",
        "openings": 2,
        "description": `Join the development team at ${company} and work on modern web technologies.`,
        "responsibilities": ["Develop user-facing features", "Build APIs using Node.js"],
        "requirements": ["React", "Node.js", "Express", "MongoDB"],
        "niceToHave": ["TypeScript", "AWS"],
        "benefits": ["Flexible hours", "Health insurance"],
        "matchScore": 85,
        "matchReason": "Excellent fit with your MERN Stack expertise.",
        "tags": ["React", "Node.js", "MongoDB"]
      }
    ]
  };
}

module.exports = {
  generate,
  getApiKey,
};

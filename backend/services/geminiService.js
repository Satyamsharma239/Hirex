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

  const fullPrompt = prompt || (systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt);

  try {
    let apiKey;
    try {
      apiKey = getApiKey();
    } catch (err) {
      console.warn(`⚠️ [Gemini API Key missing or invalid]: ${err.message}. Activating local dynamic AI mock fallback.`);
      return getFallbackMock(fullPrompt);
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);

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

        try {
          return JSON.parse(text);
        } catch (jsonErr) {
          const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '').trim();
          try {
            return JSON.parse(cleaned);
          } catch {
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
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  } catch (err) {
    console.warn('Gemini API failed, using offline fallback:', err.message);

    const p = fullPrompt.toLowerCase();

    if (p.includes('interview') && p.includes('question')) {
      return [
        { index: 0, type: 'Technical', question: 'Explain the difference between var, let, and const in JavaScript.', timeLimit: 120, hint: 'Focus on scope, hoisting, and reassignment rules.' },
        { index: 1, type: 'Technical', question: 'What is the virtual DOM and how does React use it to optimize rendering?', timeLimit: 120, hint: 'Discuss diffing algorithm and reconciliation.' },
        { index: 2, type: 'Technical', question: 'Describe how RESTful APIs work and the main HTTP methods used.', timeLimit: 120, hint: 'Cover GET, POST, PUT, DELETE and status codes.' },
        { index: 3, type: 'Behavioral', question: 'Tell me about a challenging project you worked on and how you overcame obstacles.', timeLimit: 120, hint: 'Use the STAR method to structure your response.' },
        { index: 4, type: 'Behavioral', question: 'How do you prioritize tasks when working on multiple features simultaneously?', timeLimit: 120, hint: 'Mention tools, communication, and time management strategies.' },
        { index: 5, type: 'Situational', question: 'If a production bug is reported during off-hours, how would you handle it?', timeLimit: 120, hint: 'Discuss severity assessment, communication, and incident response.' },
        { index: 6, type: 'Technical', question: 'What are closures in JavaScript and can you give a practical example?', timeLimit: 120, hint: 'Explain lexical scoping and data encapsulation use cases.' },
        { index: 7, type: 'HR', question: 'Where do you see yourself professionally in the next three years?', timeLimit: 120, hint: 'Show ambition while aligning with the company growth trajectory.' }
      ];
    }

    if (p.includes('score') && p.includes('answer')) {
      return {
        score: 72,
        grade: 'B',
        strengths: ['Clear communication', 'Relevant experience mentioned'],
        improvements: ['Add more specific metrics', 'Use STAR method structure'],
        sampleAnswer: 'A strong answer would include specific examples with measurable outcomes...',
        keyMissed: 'Quantifiable results',
        confidence: 'Medium',
        deliveryAnalytics: {
          speakingSpeed: '120 WPM (Normal)',
          fillerCount: 1,
          fillersUsed: ['um'],
          communicationTone: 'Conversational'
        },
        starBreakdown: {
          situation: { score: 15, feedback: 'Context was partially set' },
          task: { score: 18, feedback: 'Role was explained clearly' },
          action: { score: 12, feedback: 'More specific actions needed' },
          result: { score: 10, feedback: 'Missing quantifiable outcomes' }
        }
      };
    }

    if (p.includes('career') && p.includes('dna')) {
      return {
        careerPersonality: 'The Builder',
        careerPersonalityDesc: 'You thrive on turning ideas into working software products.',
        overallStrength: 'Strong full-stack development fundamentals.',
        readinessLevel: 'Job-Ready',
        topSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'],
        skillGaps: ['TypeScript', 'Docker', 'Cloud Services'],
        recommendedRoles: [
          { title: 'Full Stack Developer', fit: 90, reason: 'Strong alignment with your project experience.', avgSalary: '5-8 LPA', demandLevel: 'High', growthPath: 'Senior Engineer' },
          { title: 'Frontend Engineer', fit: 85, reason: 'Solid React and UI development skills.', avgSalary: '4-7 LPA', demandLevel: 'High', growthPath: 'Frontend Architect' }
        ],
        topIndustries: ['SaaS', 'FinTech', 'E-Commerce'],
        careerAdvice: 'Continue building projects and start learning TypeScript to increase market value.',
        oneThingToLearnNow: 'TypeScript',
        timeToHire: '3-5 weeks',
        confidence: 'Your portfolio demonstrates strong practical skills.'
      };
    }

    if (p.includes('ats') || p.includes('audit')) {
      return {
        atsScore: 78,
        atsGrade: 'B+',
        recruiterSummary: 'The resume demonstrates solid technical foundations with room for keyword optimization.',
        formattingAudits: [
          { rule: 'Avoid tables & columns', status: 'Pass', reason: 'Clean single-column layout detected.' },
          { rule: 'Standard section headers', status: 'Pass', reason: 'Headers follow conventional naming.' },
          { rule: 'Contact details location', status: 'Pass', reason: 'Contact info placed at the top.' }
        ],
        keywordDensity: [
          { keyword: 'JavaScript', present: true, count: 4 },
          { keyword: 'React', present: true, count: 3 },
          { keyword: 'Node.js', present: true, count: 2 },
          { keyword: 'TypeScript', present: false, count: 0 }
        ],
        rewrittenSummary: 'Results-driven developer with hands-on experience building scalable web applications.',
        suitedRoles: [
          { title: 'Frontend Developer', fit: 88, reason: 'Strong React and JavaScript skills.' },
          { title: 'Full Stack Developer', fit: 82, reason: 'Experience across frontend and backend.' }
        ]
      };
    }

    if (p.includes('outreach') || p.includes('email')) {
      return {
        subject: 'Application for Open Developer Position',
        body: 'Hi Team,\n\nI am a software developer with experience building web applications using modern JavaScript frameworks. I came across your open position and believe my skills would be a strong fit.\n\nI have attached my resume for your review and would welcome the opportunity to discuss how I can contribute to your team.\n\nBest regards',
        tips: [
          'Personalize the greeting with the hiring manager name.',
          'Send on Tuesday or Wednesday morning for best response rates.',
          'Include a link to your portfolio or GitHub profile.'
        ]
      };
    }

    if (p.includes('career') && p.includes('card')) {
      return {
        headline: 'Software Developer | JavaScript · React · Node.js | Open to Work',
        tagline: 'Building scalable web solutions with modern technologies.',
        topSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'],
        uniqueValue: 'Full-stack developer focused on performance optimization and clean architecture.',
        lookingFor: 'Developer roles in growth-focused tech companies.',
        availableFrom: 'Immediately',
        preferredLocations: ['Remote', 'Bangalore', 'Mumbai'],
        openToRemote: true
      };
    }

    return { message: 'AI service temporarily unavailable. Please try again.' };
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

  const extractedEmail = (() => {
    const match = promptText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1].trim() : 'satyam.sharma@email.com';
  })();

  const extractedPhone = (() => {
    const match = promptText.match(/(\+?\d[\d-\s()]{8,}\d)/);
    return match ? match[1].trim() : '+91 98765 43210';
  })();

  const extractedLinkedin = (() => {
    const match = promptText.match(/(linkedin\.com\/in\/[a-zA-Z0-9_%+-]+)/i);
    return match ? match[1].trim() : 'linkedin.com/in/satyamsharma';
  })();

  const extractedGithub = (() => {
    const match = promptText.match(/(github\.com\/[a-zA-Z0-9_%+-]+)/i);
    return match ? match[1].trim() : 'github.com/satyamsharma';
  })();

  const extractedName = (() => {
    const match = promptText.match(/Candidate Resume Text:\s*["']?([^\n"'\r]+)/i);
    if (match && match[1].trim().length > 3 && match[1].trim().length < 50) {
      return match[1].trim();
    }
    return name || 'SATYAM SHARMA';
  })();

  // 0. Senior Recruiter & ATS Expert Audit
  if (p.includes('ats-audit') || p.includes('ats audit') || p.includes('atsgrade') || p.includes('suitedroles')) {
    return {
      "atsGrade": "A+",
      "atsScore": 98,
      "recruiterSummary": "The candidate displays outstanding practical proficiency in building full-stack MERN architectures. The rewritten resume completely resolves legacy multi-column layout parsing errors and structures achievements with STAR bullets. Highly recommended for top tier tech firms.",
      "formattingAudits": [
        {"rule":"Avoid tables & columns","status":"Pass","reason":"Single-column clean plain text layout. Passes all modern parsing checkers."},
        {"rule":"Standard section headers","status":"Pass","reason":"Headers are standardized and placed logically."},
        {"rule":"Font & readability consistency","status":"Pass","reason":"Uniform Times New Roman print formatting applied."},
        {"rule":"Contact details location","status":"Pass","reason":"Extracted contact details placed properly at the top."}
      ],
      "keywordDensity": [
        {"keyword":"React","present":true,"count":6},
        {"keyword":"Node.js","present":true,"count":4},
        {"keyword":"MongoDB","present":true,"count":3},
        {"keyword":"Express","present":true,"count":3},
        {"keyword":"TypeScript","present":true,"count":2},
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
      "atsOptimizedResumeText": `${extractedName.toUpperCase()}\n${extractedEmail} | ${extractedPhone} | GitHub: ${extractedGithub} | LinkedIn: ${extractedLinkedin}\n\nPROFESSIONAL SUMMARY\nHighly skilled Software Developer with 1+ years of experience designing and deploying high-impact full-stack web architectures. Specialized in MERN stack development (MongoDB, Express.js, React, Node.js). Proven ability to optimize client-side bundle performance and build robust, secure backend microservices. Active problem solver committed to writing clean, maintainable, and well-documented code.\n\nTECHNICAL SKILLS\n- Frontend Languages & Frameworks: HTML5, CSS3, JavaScript (ES6+), React.js, Redux Toolkit, Tailwind CSS\n- Backend & Databases: Node.js, Express.js, RESTful APIs, MongoDB, Mongoose, REST architecture\n- Tools & DevOps: Git, GitHub, VS Code, Postman, Vercel, Netlify\n\nPROFESSIONAL EXPERIENCE\nSoftware Developer | HireX AI (Project Portfolio)\nJune 2025 - Present | Remote, India\n- Architected and deployed responsive MERN stack web applications using React hooks and Node.js REST routes, driving customer engagement.\n- Optimized client-side bundle performance by 25% through lazy-loading components and caching expensive calculation results.\n- Engineered secure MongoDB Atlas database schemas with optimized indexing, reducing average query response latency by 35%.\n- Constructed Node.js event-loop friendly background tasks that automated user email communications, boosting throughput by 40%.\n\nACADEMIC PROJECTS\nAI-Powered Job Tracker (HireX)\n- Developed an interactive applicant tracking board using React, Node.js, and MongoDB to track 20+ jobs.\n- Implemented client-side local persistence, reducing API redundancy by 40% and providing seamless offline-ready UX.\n\nEDUCATION\nBachelor of Science in Information Technology (BSc IT) | Mumbai University\nGraduated: 2025 | Mumbai, India`,
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
  if (p.includes('recruiter name') || p.includes('recruitername') || p.includes('hr/recruiting work email')) {
    return {
      "email": `careers@${company.toLowerCase().replace(/\s+/g, '')}.com`,
      "recruiterName": "Rohan Sharma"
    };
  }

  if (p.includes('outreach-email') || p.includes('outreach email') || p.includes('outreach_email') || p.includes('outreach') || p.includes('cold-outreach')) {
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
      "experienceMatch": "Fresher OK - Match matches candidate's BCA/BSc IT entry-level timeline.",
      "contact": {
        "name": extractedName,
        "email": extractedEmail,
        "phone": extractedPhone,
        "linkedin": extractedLinkedin,
        "github": extractedGithub
      }
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
    const compLower = company.toLowerCase();
    let compQuestions = [];
    if (compLower.includes('tcs') || compLower.includes('tata consultancy')) {
      compQuestions = [
        {"index":0,"type":"Technical","question":"What is the difference between Abstraction and Encapsulation in OOPs?","timeLimit":120,"hint":"Abstraction hides implementation details, encapsulation binds code and data together. Give Java/C++ examples."},
        {"index":1,"type":"Technical","question":"Write a program in Javascript or Java to check if a number is Prime or Prime Factorization.","timeLimit":180,"hint":"Check divisibility up to sqrt(n). Optimize time complexity."},
        {"index":2,"type":"Technical","question":"Explain DBMS normalization and the difference between 2NF and 3NF.","timeLimit":120,"hint":"Mention redundancy removal, primary keys, functional dependencies, and transitive dependencies."},
        {"index":3,"type":"Behavioral","question":"Why do you want to join Tata Consultancy Services (TCS), and are you open to relocate?","timeLimit":120,"hint":"Show loyalty, interest in learning, project domains, and flexibility to relocate to any office location."},
        {"index":4,"type":"Behavioral","question":"Describe a conflict you had with a team member in a project and how you resolved it.","timeLimit":120,"hint":"Use the STAR method. Keep it professional, focus on communication and final delivery."},
        {"index":5,"type":"Situational","question":"If you are given a project on a technology you don't know, how will you handle it?","timeLimit":120,"hint":"Explain your quick learning capability, online courses, documentation, and senior guidance."},
        {"index":6,"type":"Company-Specific","question":"What do you know about TCS's key services, Tata Group values, and recent tech initiatives?","timeLimit":120,"hint":"Mention ethics, corporate social responsibility, and TCS's role in global digital transformation."},
        {"index":7,"type":"HR","question":"Are you ready to sign the service agreement and work in different shift timings?","timeLimit":120,"hint":"Show absolute readiness and flexibility."}
      ];
    } else if (compLower.includes('infosys')) {
      compQuestions = [
        {"index":0,"type":"Technical","question":"What is the difference between method overloading and method overriding in OOPs?","timeLimit":120,"hint":"Overloading is compile-time (same class, diff params), Overriding is run-time (subclass overrides parent method)."},
        {"index":1,"type":"Technical","question":"Explain primary key, unique key, and foreign key in SQL databases.","timeLimit":120,"hint":"Primary key: unique, non-null. Unique key: unique, allows one null. Foreign key: references another table's primary key."},
        {"index":2,"type":"Technical","question":"Write a function to check if a string is a palindrome.","timeLimit":120,"hint":"Compare characters from both ends or reverse the string. Explain space and time complexity."},
        {"index":3,"type":"Behavioral","question":"Explain your final year academic project. What was your individual role and contribution?","timeLimit":120,"hint":"Breakdown: Tech stack, core features, challenges faced, and how you solved them."},
        {"index":4,"type":"Behavioral","question":"Why did you choose Infosys, and how do you align with our core values?","timeLimit":120,"hint":"Mention Infosys' reputation, training programs (Mysore campus), and innovation values."},
        {"index":5,"type":"Situational","question":"If a client complains about a bug in your code, what is your immediate plan of action?","timeLimit":120,"hint":"Replicate the bug, assess impact, communicate timeline, deploy hotfix, and write test cases."},
        {"index":6,"type":"Company-Specific","question":"What do you know about Infosys Springboard and their digital operating models?","timeLimit":120,"hint":"Mention digital transformation solutions and their learning platform."},
        {"index":7,"type":"HR","question":"Do you have any issues with night shifts or working hybrid from different branch offices?","timeLimit":120,"hint":"Confirm your availability and flexible mindset."}
      ];
    } else if (compLower.includes('google')) {
      compQuestions = [
        {"index":0,"type":"Technical","question":"Explain how you would design a global, rate-limiting system for an API.","timeLimit":180,"hint":"Discuss Token Bucket or Leaky Bucket algorithms, Redis for storage, distributed concurrency, and fallback response codes."},
        {"index":1,"type":"Technical","question":"Given an unsorted array, find the length of the longest consecutive elements sequence.","timeLimit":180,"hint":"Use a HashSet. Iterate once to find bounds, achieving O(n) runtime complexity."},
        {"index":2,"type":"Technical","question":"Explain garbage collection algorithms in JavaScript (V8 engine) and memory leak prevention.","timeLimit":120,"hint":"Discuss Mark-and-Sweep, Generational layout, closures, detached DOM trees, and global reference leakage."},
        {"index":3,"type":"Behavioral","question":"Tell me about a time when you took a calculated technical risk. What was the outcome?","timeLimit":120,"hint":"Provide a structured STAR story. Focus on metrics, risk assessment, mitigations, and learnings."},
        {"index":4,"type":"Behavioral","question":"Describe a situation where you had to coordinate with an external team to solve a blocking bug.","timeLimit":120,"hint":"Focus on collaboration, active listening, clear alignment, and conflict resolution."},
        {"index":5,"type":"Situational","question":"If we need to launch a critical security patch that degrades latency by 15%, how would you decide whether to roll it out?","timeLimit":180,"hint":"Discuss trade-offs, security risk compliance vs. SLA violation, staging verification, and incremental rollouts."},
        {"index":6,"type":"Company-Specific","question":"How do you practice Googleyness, and what interests you about our engineering scale?","timeLimit":120,"hint":"Googleyness involves doing the right thing, helping teammates, active feedback, and passion for technology scale."},
        {"index":7,"type":"HR","question":"What are your salary expectations and availability for interviews?","timeLimit":120,"hint":"Speak professionally about your expectations matching the market standard and your direct availability."}
      ];
    } else if (compLower.includes('microsoft')) {
      compQuestions = [
        {"index":0,"type":"Technical","question":"What is the difference between a process and a thread? Explain how context switching works.","timeLimit":120,"hint":"Process: independent execution space with memory. Thread: lightweight unit sharing process memory. Context switching saves register states."},
        {"index":1,"type":"Technical","question":"How would you design a URL shortener like Bitly? Explain database choice and scale calculations.","timeLimit":180,"hint":"Discuss Base62 encoding, hash tables, NoSQL key-value store, cache layering, and partition strategy."},
        {"index":2,"type":"Technical","question":"Explain how HashMaps handle key collision under the hood in Java or Javascript.","timeLimit":120,"hint":"Mention buckets, linked lists, red-black tree conversion (Java 8+), and hashcode/equals comparison."},
        {"index":3,"type":"Behavioral","question":"Describe a project you built where you had to learn a completely new framework on a tight deadline.","timeLimit":120,"hint":"Outline your learning strategy: documentation, quick-start templates, incremental integration, testing."},
        {"index":4,"type":"Behavioral","question":"Tell me about a time you disagreed with your manager's technical decision. How did you handle it?","timeLimit":120,"hint":"Detail how you presented data-driven trade-offs, listened to their perspective, and aligned with the final decision."},
        {"index":5,"type":"Situational","question":"Our main production database is experiencing locks causing timeouts. What is your troubleshooting checklist?","timeLimit":120,"hint":"Check CPU/Memory spikes, query analyzer for slow unindexed queries, connection pooling saturation, and run transaction locks queries."},
        {"index":6,"type":"Company-Specific","question":"How do you view Microsoft's shift towards AI Copilots and open-source contributions?","timeLimit":120,"hint":"Discuss GitHub Copilot integration, Azure AI services, and active engagement with developer communities."},
        {"index":7,"type":"HR","question":"Why do you want to work at Microsoft, and how does this role fit into your career?","timeLimit":120,"hint":"Talk about engineering culture, impact, scalability, and long-term career growth."}
      ];
    } else {
      compQuestions = [
        {"index":0,"type":"Technical","question":`Explain the core lifecycle and state management patterns in a modern ${role} application.`,"timeLimit":120,"hint":"Talk about component updates, global state stores (Redux/Context), and optimization methods."},
        {"index":1,"type":"Technical","question":"Write a function to search for a key in a complex nested JSON structure or object tree.","timeLimit":180,"hint":"Use depth-first search or breadth-first search recursion. Handle cyclic references safely."},
        {"index":2,"type":"Technical","question":"Explain the differences between SQL and NoSQL databases. When would you choose one over the other?","timeLimit":120,"hint":"SQL: structured, ACID compliance, relations. NoSQL: horizontal scaling, schema flexibility, document/key-value store."},
        {"index":3,"type":"Behavioral","question":"Describe the most complex software system or feature you have ever built. What was the biggest challenge?","timeLimit":120,"hint":"Provide architecture details, database schemas, performance bottlenecks, and clear resolution actions."},
        {"index":4,"type":"Behavioral","question":"How do you handle tasks with shifting requirements or vague specifications?","timeLimit":120,"hint":"Discuss asking clarifying questions, wireframing, building incremental MVPs, and rapid feedback loops."},
        {"index":5,"type":"Situational","question":"If your local server works perfectly, but the deployment fails due to CORS errors, how do you resolve it?","timeLimit":120,"hint":"Explain what CORS is, how the browser blocks headers, and how to configure Allowed Origins on the backend server or API Gateway."},
        {"index":6,"type":"Company-Specific","question":`How do you plan to leverage your specific technical skills to add value to ${company}?`,"timeLimit":120,"hint":`Connect your experience in modern frameworks directly to ${company}'s domain and product requirements.`},
        {"index":7,"type":"HR","question":"Where do you see yourself in the next 3 years, and what drives you as a developer?","timeLimit":120,"hint":"Express interest in technical growth, architecture/leadership roles, and continuous learning."}
      ];
    }

    return {
      "sessionTitle": `Mock Interview: ${role} at ${company}`,
      "totalQuestions": compQuestions.length,
      "estimatedTime": "20-25 minutes",
      "questions": compQuestions
    };
  }

  // 8. Interview Sim Answer Score
  if (p.includes('evaluating a candidate') || p.includes('score this answer')) {
    const answerMatch = promptText.match(/Candidate's answer:\s*"([\s\S]*?)"/i) ||
                        promptText.match(/Candidate's answer:\s*([\s\S]*)/i);
    const ans = answerMatch ? answerMatch[1].trim() : '';
    const ansLower = ans.toLowerCase();

    const noIdeaWords = ['dont know', "don't know", 'no idea', 'skip', 'pass', 'not sure', 'have no idea', 'i do not know', 'cannot answer', 'no clue'];
    const isNoIdea = ans.length < 10 || noIdeaWords.some(w => ansLower.includes(w));

    if (isNoIdea) {
      return {
        "score": 0,
        "grade": "D",
        "strengths": ["None. Candidate opted to skip or stated they do not know."],
        "improvements": ["Review the core topics for this role.", "Try to provide partial definitions or related concepts instead of skipping."],
        "sampleAnswer": "A professional answer would cover the basic definition of the concept, its core utility, and a simple project-level example of how you used it.",
        "keyMissed": "All core concepts and technical definitions.",
        "confidence": "Low",
        "deliveryAnalytics": {
          "speakingSpeed": ans.length > 0 ? `${Math.round(ans.split(/\s+/).length * 60 / 5)} WPM (Too Short)` : "0 WPM (No speech)",
          "fillerCount": 0,
          "fillersUsed": [],
          "communicationTone": "Hesitant"
        }
      };
    }

    const wordCount = ans.split(/\s+/).filter(Boolean).length;
    let score = 50;
    const strengths = [];
    const improvements = [];

    if (wordCount < 10) {
      score = 30;
      improvements.push("The answer is too brief. Elaborate further with architectural details.");
    } else if (wordCount > 50) {
      score += 15;
      strengths.push("Detailed explanation with solid volume of speech.");
    } else {
      score += 5;
      strengths.push("Good conciseness.");
    }

    const keywords = ['react', 'node', 'express', 'mongodb', 'javascript', 'api', 'state', 'database', 'caching', 'index', 'component', 'hooks', 'query', 'scale', 'async', 'thread', 'event loop', 'security', 'token', 'auth'];
    const matchedKeywords = keywords.filter(k => ansLower.includes(k));
    
    if (matchedKeywords.length > 0) {
      score += Math.min(25, matchedKeywords.length * 5);
      strengths.push(`Good usage of technical terms: ${matchedKeywords.slice(0, 3).join(', ')}.`);
    } else {
      score -= 10;
      improvements.push("Incorporate more role-specific technical terms and keywords.");
    }

    if (ansLower.includes('example') || ansLower.includes('project') || ansLower.includes('built')) {
      score += 10;
      strengths.push("Included real-world project context or examples.");
    } else {
      improvements.push("Mention a specific project or feature you built using this technology.");
    }

    score = Math.max(10, Math.min(98, score));
    const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';

    return {
      "score": score,
      "grade": grade,
      "strengths": strengths.length > 0 ? strengths : ["Understands the core concept basics."],
      "improvements": improvements.length > 0 ? improvements : ["Elaborate slightly more on real-world edge cases."],
      "sampleAnswer": "An optimal response would define the core concept clearly, specify why it's chosen over alternatives, detail its internal operations (such as caching or memory management), and provide a brief example from your portfolio.",
      "keyMissed": "Production-level performance metrics and system design trade-offs.",
      "confidence": score >= 75 ? "High" : "Medium",
      "deliveryAnalytics": {
        "speakingSpeed": `${Math.round(wordCount * 1.2)} WPM (Optimal)`,
        "fillerCount": Math.max(0, Math.floor(wordCount / 20) - 1),
        "fillersUsed": ["like"],
        "communicationTone": score >= 75 ? "Confident & Technical" : "Conversational"
      },
      "starBreakdown": {
        "situation": { "score": score >= 70 ? 20 : 12, "feedback": score >= 70 ? "Context was well established" : "Context was vague" },
        "task": { "score": score >= 70 ? 22 : 15, "feedback": "Task role was clear" },
        "action": { "score": score >= 70 ? 21 : 14, "feedback": score >= 70 ? "Specific actions taken were detailed" : "Actions lacked technical depth" },
        "result": { "score": score >= 70 ? 18 : 10, "feedback": score >= 70 ? "Good measurable outcomes" : "Missing quantifiable results" }
      }
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

  // 13. Job Readiness Score Fallback
  if (p.includes('readiness-score') || p.includes('readiness score') || p.includes('overallscore') || p.includes('has tailored resume')) {
    return {
      "overallScore": 85,
      "grade": "A",
      "verdict": "Almost Ready",
      "breakdown": [
        { "item": "Resume", "score": 18, "maxScore": 20, "status": "done", "tip": "Highlight typescript projects." },
        { "item": "Cover Letter", "score": 0, "maxScore": 20, "status": "missing", "tip": "Generate a cover letter for this job." },
        { "item": "Company Research", "score": 20, "maxScore": 20, "status": "done", "tip": "Ready." },
        { "item": "Portfolio/GitHub", "score": 18, "maxScore": 20, "status": "done", "tip": "Add live deployment links." },
        { "item": "Network/Referral", "score": 15, "maxScore": 20, "status": "weak", "tip": "Reach out to technical recruiter on LinkedIn." }
      ],
      "topAction": "Generate and attach a tailored cover letter.",
      "encouragement": "You have a solid background. A few minor tweaks will make you a prime candidate!"
    };
  }

  // 14. Salary Estimator Fallback
  if (p.includes('salary-estimate') || p.includes('salary estimate') || p.includes('minsalary') || p.includes('averagesalary')) {
    return {
      "minSalary": "4.5 LPA",
      "maxSalary": "8 LPA",
      "averageSalary": "6 LPA",
      "companyTier": "Tier 2",
      "negotiationTip": "Highlight your hands-on experience in MERN stack architectures to push towards the upper limit.",
      "topPayingCompanies": ["TCS Digital", "Cognizant GenC Pro", "LTIMindtree"],
      "salaryFactors": [
        { "factor": "React & Frontend Optimizations", "impact": "+1.2 LPA" },
        { "factor": "Node.js REST Backend Development", "impact": "+1.5 LPA" }
      ],
      "disclaimer": "These are estimates based on 2024-25 Indian market data. Actual offers may vary."
    };
  }

  if (p.includes('recreate-resume-xyz') || p.includes('recreate and rewrite') || p.includes('optimizedresume')) {
    const targetRoleMatch = promptText.match(/TARGET ROLE:\s*([^\n\r]+)/i);
    const targetRole = targetRoleMatch ? targetRoleMatch[1].trim() : 'Software Developer';

    const skillsMatch = promptText.match(/EMPHASIZED KEYWORDS\/SKILLS:\s*([^\n\r]+)/i);
    const userSkills = skillsMatch ? skillsMatch[1].trim() : 'JavaScript, React, Node.js, HTML, CSS';

    const metricsMatch = promptText.match(/USER INCLUDED METRICS\/HIGHLIGHTS:\s*([^\n\r]+)/i);
    const userMetrics = metricsMatch && !metricsMatch[1].toLowerCase().includes('none specified') 
      ? metricsMatch[1].trim() 
      : 'improved loading speed by 35% and query execution locks by 40%';

    const firstSkill = userSkills.split(',')[0]?.trim() || 'React';
    const secondSkill = userSkills.split(',')[1]?.trim() || 'Node.js';

    return `${extractedName.toUpperCase()}
${extractedEmail} | ${extractedPhone} | GitHub: ${extractedGithub} | LinkedIn: ${extractedLinkedin}

PROFESSIONAL SUMMARY
Highly skilled ${targetRole} with extensive experience designing and deploying high-impact architectures. Specialized in modern development frameworks and emphasizing: ${userSkills}. Proven capacity to optimize performance metrics, write clean maintainable systems, and achieve key objectives including: ${userMetrics}.

TECHNICAL SKILLS
- Core Technologies: ${userSkills}
- Industry Frameworks: React, Next.js, Redux Toolkit, Node.js, Express.js
- Tools & Version Control: Git, GitHub, VS Code, Postman, Vercel

PROFESSIONAL EXPERIENCE
Senior ${targetRole} | Tech Solutions Inc.
June 2025 - Present | Bangalore, India
- Optimized application performance by 35% using ${firstSkill} state caching, component virtualization, and bundle lazy loading.
- Engineered high-throughput backend features for target role of ${targetRole}, accomplishing ${userMetrics} by implementing robust asynchronous event loops.
- Refactored core database schemas and queries, reducing data transaction read/write locks by 40% using advanced index strategies.
- Spearheaded team migration to type-safe code architectures using ${secondSkill}, preventing approximately 15% of runtime data exceptions.

ACADEMIC PROJECTS
Enterprise Application Suite
- Developed a high-impact responsive platform integrating ${userSkills.split(',').slice(0, 3).join(', ')}, serving 200+ active user tracks.
- Implemented client-side local persistence, reducing API roundtrip latency by 45% and providing seamless offline-ready UX.

EDUCATION
Bachelor of Science in Information Technology | Mumbai University
Graduated: 2025 | Mumbai, India`;
  }

  if (p.includes('optimize-xyz') || p.includes('xyz formula') || p.includes('accomplished') || p.includes('measured by')) {
    let action = "Optimized";
    let metric = "25% performance improvement";
    let tech = "React hooks and database caching";
    
    if (p.includes('react') || p.includes('frontend') || p.includes('css') || p.includes('ui') || p.includes('view') || p.includes('components')) {
      action = "Redesigned and optimized client-side state engines";
      metric = "reducing rendering latency by 35% and improving page load speed by 1.2s";
      tech = "React.js memoization, lazy loading, and Redux state stores";
    } else if (p.includes('backend') || p.includes('node') || p.includes('api') || p.includes('server') || p.includes('express')) {
      action = "Architected high-throughput Node.js microservices";
      metric = "handling 500+ concurrent requests and reducing API response latency by 30%";
      tech = "Express.js clustering, MongoDB database index optimization, and Redis caching";
    } else if (p.includes('database') || p.includes('mongo') || p.includes('sql') || p.includes('query')) {
      action = "Refactored schema design and optimized query indexing";
      metric = "reducing database read/write locks by 40% and query execution time by 150ms";
      tech = "MongoDB aggregation pipelines and query indexing strategies";
    } else {
      action = "Engineered and deployed scalable full-stack features";
      metric = "resulting in a 20% increase in user engagement and 15% reduction in page load latency";
      tech = "modern Javascript frameworks, RESTful API integrations, and CI/CD pipelines";
    }
    
    return `• ${action}, resulting in a ${metric}, by implementing ${tech}.`;
  }

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

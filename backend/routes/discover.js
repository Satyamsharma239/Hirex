const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');
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

function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function inferExperience(title, description, requestedExperience) {
  const text = (title + " " + description).toLowerCase();
  const yrRegex = /(\d+)\s*(?:-|to|\+)\s*(\d+)?\s*(?:years?|yrs?)/i;
  const match = text.match(yrRegex);
  if (match) {
    const min = parseInt(match[1], 10);
    const max = match[2] ? parseInt(match[2], 10) : min + 3;
    if (min === 0 || min === 1) {
      return "0-1 year";
    }
    return `${min}-${max} years`;
  }
  if (text.includes("intern") || text.includes("trainee") || text.includes("fresher") || text.includes("graduate")) {
    return "Fresher (0 yr)";
  }
  if (text.includes("junior") || text.includes("jr") || text.includes("associate")) {
    return "0-1 year";
  }
  if (text.includes("senior") || text.includes("sr.") || text.includes("lead") || text.includes("staff") || text.includes("principal") || text.includes("architect")) {
    return "4+ years";
  }
  const titleLower = title.toLowerCase();
  const isSeniorTitle = titleLower.includes("senior") || titleLower.includes("lead") || titleLower.includes("staff") || titleLower.includes("principal") || titleLower.includes("architect") || titleLower.includes("manager");
  const isJuniorTitle = titleLower.includes("junior") || titleLower.includes("intern") || titleLower.includes("associate") || titleLower.includes("fresher");
  if (isSeniorTitle) {
    return "4+ years";
  }
  if (isJuniorTitle) {
    return text.includes("intern") ? "Fresher (0 yr)" : "0-1 year";
  }
  if (requestedExperience) {
    return requestedExperience;
  }
  return "1-2 years";
}

function isExperienceCompatible(jobExp, reqExp) {
  if (!reqExp) return true;
  const req = reqExp.toLowerCase();
  const job = jobExp.toLowerCase();
  if (req.includes('fresher') || req.includes('0-1')) {
    if (job.includes('4+') || job.includes('senior') || job.includes('lead') || job.includes('principal') || job.includes('architect') || job.includes('manager')) {
      return false;
    }
    if (job.includes('2-4') || job.includes('3-5') || job.includes('5-8') || job.includes('5-9')) {
      return false;
    }
    return true;
  }
  if (req.includes('4+')) {
    if (job.includes('fresher') || job.includes('0-1') || job.includes('intern')) {
      return false;
    }
    return true;
  }
  if (req.includes('1-2') || req.includes('2-4')) {
    if (job.includes('intern') || job.includes('lead') || job.includes('principal') || job.includes('architect')) {
      return false;
    }
    return true;
  }
  return true;
}

function scrubAdzuna(job) {
  const clean = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/adzuna/gi, 'HireX Partner');
  };
  if (job.title) job.title = clean(job.title);
  if (job.company) job.company = clean(job.company);
  if (job.description) job.description = clean(job.description);
  if (job.tags && Array.isArray(job.tags)) {
    job.tags = job.tags.map(t => clean(t));
  }
  if (job.responsibilities && Array.isArray(job.responsibilities)) {
    job.responsibilities = job.responsibilities.map(r => clean(r));
  }
  if (job.requirements && Array.isArray(job.requirements)) {
    job.requirements = job.requirements.map(r => clean(r));
  }
  if (job.niceToHave && Array.isArray(job.niceToHave)) {
    job.niceToHave = job.niceToHave.map(n => clean(n));
  }
  if (job.benefits && Array.isArray(job.benefits)) {
    job.benefits = job.benefits.map(b => clean(b));
  }
  if (job.matchReason) job.matchReason = clean(job.matchReason);
  return job;
}

function getRelativeTime(dateStr) {
  if (!dateStr) return "Today";
  const date = new Date(dateStr);
  const diffMs = Math.abs(new Date() - date);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs <= 0) return "Just now";
    return `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 30) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function parseRelativeDate(postedText) {
  if (!postedText) return Date.now();
  const text = postedText.toLowerCase();
  if (text.includes('hour')) {
    const hours = parseInt(text.match(/\d+/) || [1]);
    return Date.now() - hours * 60 * 60 * 1000;
  }
  if (text.includes('day')) {
    const days = parseInt(text.match(/\d+/) || [1]);
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }
  if (text.includes('week')) {
    const weeks = parseInt(text.match(/\d+/) || [1]);
    return Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
  }
  if (text.includes('month')) {
    const months = parseInt(text.match(/\d+/) || [1]);
    return Date.now() - months * 30 * 24 * 60 * 60 * 1000;
  }
  return Date.now();
}

async function resolveRedirect(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      redirect: 'follow',
      timeout: 8000
    });
    const finalUrl = res.url;

    const brokenDomains = ['kxcdn.com', 'zunastatic', 'cdn.adzuna', 'doubleclick', 'googlesyndication'];
    const isBroken = (u) => brokenDomains.some(d => u.includes(d));

    if (isBroken(finalUrl)) {
      return url;
    }

    if (finalUrl.includes('adzuna.')) {
      const html = await res.text();
      const scriptRegex = /location(?:\.href|\.replace)?\s*(?:=|\()\s*["'](https?:\/\/[^"']+)["']/i;
      const scriptMatch = html.match(scriptRegex);
      if (scriptMatch && !scriptMatch[1].includes('adzuna.') && !isBroken(scriptMatch[1])) {
        return scriptMatch[1].replace(/&amp;/g, '&');
      }
      const metaRegex = /http-equiv=["']refresh["']\s*content=["']\d+;\s*url=(https?:\/\/[^"']+)["']/i;
      const metaMatch = html.match(metaRegex);
      if (metaMatch && !metaMatch[1].includes('adzuna.') && !isBroken(metaMatch[1])) {
        return metaMatch[1].replace(/&amp;/g, '&');
      }
      const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
      let match;
      while ((match = hrefRegex.exec(html)) !== null) {
        const targetUrl = match[1];
        if (!targetUrl.includes('adzuna.') && !isBroken(targetUrl) && !targetUrl.includes('google') && !targetUrl.includes('facebook')) {
          return targetUrl.replace(/&amp;/g, '&');
        }
      }
    }
    return finalUrl || url;
  } catch (err) {
    return url;
  }
}

async function findRealHREmail(companyName) {
  const apolloKey = process.env.APOLLO_API_KEY;
  const hunterKey = process.env.HUNTER_API_KEY;
  const domain = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  if (apolloKey && apolloKey !== 'your_apollo_api_key') {
    try {
      const url = 'https://api.apollo.io/v1/people/match';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apolloKey,
          organization_domain: domain,
          titles: ["talent acquisition", "technical recruiter", "recruiting", "hr manager", "human resources"]
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.person && data.person.email) {
          const recruiterName = data.person.name || (data.person.first_name ? `${data.person.first_name} ${data.person.last_name || ''}`.trim() : 'Recruitment Team');
          return { email: data.person.email, recruiterName };
        }
      }
    } catch (err) {}
  }
  if (hunterKey && hunterKey !== 'your_hunter_api_key') {
    try {
      const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.emails && data.data.emails.length > 0) {
          const hrMail = data.data.emails.find(e => 
            e.value.includes('recruiting') || 
            e.value.includes('careers') || 
            e.value.includes('hr') || 
            e.value.includes('talent')
          );
          const email = hrMail ? hrMail.value : data.data.emails[0].value;
          const recruiterName = hrMail && hrMail.first_name ? `${hrMail.first_name} ${hrMail.last_name || ''}`.trim() : 'Recruitment Team';
          return { email, recruiterName };
        }
      }
    } catch (err) {}
  }
  try {
    const prompt = `Suggest a realistic recruiter name and HR/recruiting work email address for a company named "${companyName}". Return a JSON object with exactly the keys "email" and "recruiterName". No extra text.`;
    const geminiRes = await generate({
      userPrompt: prompt,
      jsonMode: true
    });
    if (geminiRes && geminiRes.email && geminiRes.recruiterName) {
      return {
        email: geminiRes.email,
        recruiterName: geminiRes.recruiterName
      };
    }
  } catch (err) {}
  const names = ['Rohan Sharma', 'Ananya Iyer', 'Vikram Malhotra', 'Sneha Patel', 'Amit Verma', 'Neha Gupta', 'Rahul Das', 'Pooja Reddy'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  return {
    email: `careers@${domain}`,
    recruiterName: randomName
  };
}

async function fetchSerpApiJobs(role, location, experience, page = 1) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey || apiKey === 'your_serpapi_api_key') return [];
  try {
    const query = `${role} in ${location || 'India'}`;
    const start = (page - 1) * 10;
    const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&start=${start}&api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.jobs_results || [];
    return results.map((j, index) => {
      const companyName = j.company_name || "Target Company";
      const tags = [role.split(' ')[0], "Google Jobs", location].filter(Boolean);
      return {
        id: j.job_id || `serp-${index}-${Math.floor(Math.random()*1000)}`,
        title: j.title || role,
        company: companyName,
        companyType: "Product / Tech Company",
        hrEmail: `careers@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`,
        logo: companyName.substring(0, 2).toUpperCase(),
        logoColor: getRandomColor(),
        location: j.location || location || "India",
        mode: (j.description || "").toLowerCase().includes("remote") ? "Remote" : "Full-time",
        type: "Full-time",
        salary: "Competitive Salary",
        experience: inferExperience(j.title || role, j.description || '', experience),
        posted: j.detected_extensions?.posted_at || "Today",
        createdTime: parseRelativeDate(j.detected_extensions?.posted_at),
        deadline: "Soon",
        openings: 1,
        description: j.description || `Exciting opportunity for a ${role} at ${companyName}.`,
        responsibilities: [
          "Develop high-quality features and clean code.",
          "Collaborate with engineering teams to resolve architecture blocks.",
          "Ensure performance tuning and unit test compliance."
        ],
        requirements: [
          "Strong knowledge of modern software development practices.",
          "Hands-on experience with the target technology stack.",
          "Good communication and collaborative problem-solving skills."
        ],
        niceToHave: ["Familiarity with cloud hosting (AWS/GCP).", "Prior experience working in agile environments."],
        benefits: ["Flexible working hours", "Competitive compensation", "Health insurance benefits"],
        matchScore: Math.floor(Math.random() * 20) + 78,
        matchReason: `High demand for ${role} skills at ${companyName}.`,
        tags: tags,
        applicationLink: j.share_link || ""
      };
    });
  } catch (err) {
    return [];
  }
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
const LOGO_COLORS = ['#00c9a7', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#10b981', '#06b6d4'];
function getRandomColor() {
  return LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)];
}

async function fetchAdzunaJobs(role, location, experience, page = 1) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || appId === 'your_adzuna_app_id' || !appKey || appKey === 'your_adzuna_app_key') {
    throw new Error('Adzuna credentials not configured');
  }

  const url = `https://api.adzuna.com/v1/api/jobs/in/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=15&what=${encodeURIComponent(role)}&where=${encodeURIComponent(location)}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Adzuna API returned status ${res.status}`);
  }

  const data = await res.json();
  const results = data.results || [];

  return results.map(j => {
    const companyName = j.company?.display_name || "Target Company";
    
    let salaryText = "6 - 12 LPA";
    if (j.salary_min) {
      const minLpa = Math.round(j.salary_min / 100000);
      const maxLpa = j.salary_max ? Math.round(j.salary_max / 100000) : Math.round((j.salary_min * 1.5) / 100000);
      if (minLpa > 0) {
        salaryText = `${minLpa} - ${maxLpa} LPA`;
      }
    }

    let cleanDesc = (j.description || "")
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleanDesc.length > 250) {
      cleanDesc = cleanDesc.slice(0, 247) + "...";
    }

    const tags = [role.split(' ')[0], "Openings", "India"].filter(Boolean);

    return {
      id: String(j.id),
      title: j.title.replace(/<\/?[^>]+(>|$)/g, "").trim(),
      company: companyName,
      companyType: "Product / Tech Company",
      hrEmail: `careers@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`,
      logo: companyName.substring(0, 2).toUpperCase(),
      logoColor: getRandomColor(),
      location: j.location?.display_name || location || "India",
      mode: j.contract_time === "contract" ? "Contract" : "Full-time",
      type: j.contract_time === "contract" ? "Contract" : "Full-time",
      salary: salaryText,
      experience: inferExperience(j.title, j.description || '', experience),
      posted: getRelativeTime(j.created),
      createdTime: j.created ? new Date(j.created).getTime() : Date.now(),
      deadline: "Soon",
      openings: 2,
      description: cleanDesc || `Exciting opportunity for a ${role} at ${companyName}.`,
      responsibilities: [
        "Develop high-quality features and clean code.",
        "Collaborate with engineering teams to resolve architecture blocks.",
        "Ensure performance tuning and unit test compliance."
      ],
      requirements: [
        "Strong knowledge of modern software development practices.",
        "Hands-on experience with the target technology stack.",
        "Good communication and collaborative problem-solving skills."
      ],
      niceToHave: ["Familiarity with cloud hosting (AWS/GCP).", "Prior experience working in agile environments."],
      benefits: ["Flexible working hours", "Competitive compensation", "Health insurance benefits"],
      matchScore: Math.floor(Math.random() * 20) + 78,
      matchReason: `High demand for ${role} skills at ${companyName}.`,
      tags: tags,
      applicationLink: j.redirect_url || ""
    };
  });
}

async function fetchHimalayasJobs(role, location, experience, page = 1) {
  try {
    const limit = 20;
    const offset = (page - 1) * limit;
    const url = `https://himalayas.app/jobs/api/search?q=${encodeURIComponent(role)}&limit=${limit}&offset=${offset}`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Himalayas API returned status ${res.status}`);
    }

    const data = await res.json();
    const results = data.jobs || [];

    return results.map(j => {
      const companyName = j.companyName || "Target Company";
      
      let salaryText = "Competitive Salary";
      if (j.minSalary) {
        const currencySym = j.currency === 'USD' ? '$' : j.currency || '';
        salaryText = `${currencySym}${j.minSalary.toLocaleString()}`;
        if (j.maxSalary) {
          salaryText += ` - ${currencySym}${j.maxSalary.toLocaleString()}`;
        }
        if (j.salaryPeriod === 'annual') {
          salaryText += ' / year';
        } else if (j.salaryPeriod === 'hourly') {
          salaryText += ' / hour';
        }
      }

      let cleanDesc = (j.excerpt || j.description || "")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (cleanDesc.length > 250) {
        cleanDesc = cleanDesc.slice(0, 247) + "...";
      }

      const listItems = (j.description || "").match(/<li>(.*?)<\/li>/gi)?.map(li => 
        li.replace(/<\/?[^>]+(>|$)/g, "").trim()
      ).filter(Boolean) || [];

      const responsibilities = listItems.slice(0, Math.ceil(listItems.length / 2));
      const requirements = listItems.slice(Math.ceil(listItems.length / 2));

      if (responsibilities.length === 0) {
        responsibilities.push(
          "Collaborate with the cross-functional product and engineering teams.",
          "Write clean, maintainable, and high-performance production code.",
          "Debug and troubleshoot application issues and customer bug reports."
        );
      }
      if (requirements.length === 0) {
        requirements.push(
          `Strong proficiency with technologies related to ${role}.`,
          "Excellent written and verbal communication skills.",
          "Ability to work effectively in a fully remote environment."
        );
      }

      const postDate = j.pubDate ? new Date(j.pubDate * 1000) : new Date();
      const diffTime = Math.abs(new Date() - postDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const postedText = diffDays <= 1 ? "Today" : `${diffDays} days ago`;

      return {
        id: String(j.guid || j.id || Math.random().toString(36).substr(2, 9)),
        title: j.title || role,
        company: companyName,
        companyType: "Technology Company",
        hrEmail: `careers@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`,
        logo: companyName.substring(0, 2).toUpperCase(),
        logoColor: getRandomColor(),
        location: j.locationRestrictions && j.locationRestrictions.length ? j.locationRestrictions.join(', ') : 'Remote',
        mode: "Remote",
        type: j.employmentType || "Full-time",
        salary: salaryText,
        experience: inferExperience(j.title || role, (j.description || '') + ' ' + (j.seniority || []).join(' '), experience),
        posted: getRelativeTime(j.pubDate ? j.pubDate * 1000 : null),
        createdTime: j.pubDate ? j.pubDate * 1000 : Date.now(),
        deadline: "Open until filled",
        openings: 1,
        description: cleanDesc,
        responsibilities: responsibilities.slice(0, 5),
        requirements: requirements.slice(0, 5),
        niceToHave: ["Familiarity with modern deployment stacks.", "Prior experience in remote startup teams."],
        benefits: ["Remote work flexibility", "Competitive stock/equity options", "Flexible paid time off"],
        matchScore: Math.floor(Math.random() * 20) + 78,
        matchReason: `High demand for your skills in ${role} development.`,
        tags: j.categories || [],
        applicationLink: j.applicationLink || j.guid || ""
      };
    });
  } catch (err) {
    return [];
  }
}

async function fetchArbeitnowJobs(role, location, experience, page = 1) {
  try {
    const url = `https://www.arbeitnow.com/api/job-board-api?page=${page}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Arbeitnow API returned status ${res.status}`);
    }

    const data = await res.json();
    const results = data.data || [];

    const roleTerms = role.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    const filtered = results.filter(j => {
      const title = (j.title || "").toLowerCase();
      const desc = (j.description || "").toLowerCase();
      const tags = (j.tags || []).map(t => t.toLowerCase()).join(' ');
      return roleTerms.every(term => title.includes(term) || desc.includes(term) || tags.includes(term));
    });

    return filtered.map(j => {
      const companyName = j.company_name || "Target Company";
      let cleanDesc = (j.description || "")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (cleanDesc.length > 250) {
        cleanDesc = cleanDesc.slice(0, 247) + "...";
      }

      const listItems = (j.description || "").match(/<li>(.*?)<\/li>/gi)?.map(li => 
        li.replace(/<\/?[^>]+(>|$)/g, "").trim()
      ).filter(Boolean) || [];

      const responsibilities = listItems.slice(0, Math.ceil(listItems.length / 2));
      const requirements = listItems.slice(Math.ceil(listItems.length / 2));

      if (responsibilities.length === 0) {
        responsibilities.push(
          "Collaborate with engineering teams to deploy scalable features.",
          "Write clean, maintainable, and highly unit-tested source code.",
          "Optimize browser rendering cycles and client side performance."
        );
      }
      if (requirements.length === 0) {
        requirements.push(
          `Hands-on experience with modern technologies matching ${role}.`,
          "Good understanding of version control systems and collaborative workflows.",
          "Strong communication skills and analytical problem-solving mindset."
        );
      }

      return {
        id: String(j.slug || Math.random().toString(36).substr(2, 9)),
        title: j.title || role,
        company: companyName,
        companyType: "Technology Company",
        hrEmail: `recruiting@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`,
        logo: companyName.substring(0, 2).toUpperCase(),
        logoColor: getRandomColor(),
        location: j.location || "Remote",
        mode: j.remote ? "Remote" : "Hybrid",
        type: "Full-time",
        salary: "Competitive Salary",
        experience: inferExperience(j.title || role, j.description || '', experience),
        posted: getRelativeTime(j.created_at),
        createdTime: j.created_at ? new Date(j.created_at).getTime() : Date.now(),
        deadline: "Open",
        openings: 1,
        description: cleanDesc,
        responsibilities: responsibilities.slice(0, 5),
        requirements: requirements.slice(0, 5),
        niceToHave: ["Familiarity with containerization and cloud orchestration.", "Experience in agile product development."],
        benefits: ["Comprehensive medical plan", "Flexible work schedule", "Learning and development budget"],
        matchScore: Math.floor(Math.random() * 20) + 78,
        matchReason: `High keyword alignment with your tech stack for ${role}.`,
        tags: j.tags || [],
        applicationLink: j.url || ""
      };
    });
  } catch (err) {
    return [];
  }
}

async function fetchRemotiveJobs(role, location, experience, page = 1) {
  try {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=20`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Remotive API returned status ${res.status}`);
    }
    const data = await res.json();
    const results = data.jobs || [];
    return results.map(j => {
      const companyName = j.company_name || "Target Company";
      let cleanDesc = (j.description || "")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (cleanDesc.length > 250) {
        cleanDesc = cleanDesc.slice(0, 247) + "...";
      }
      const listItems = (j.description || "").match(/<li>(.*?)<\/li>/gi)?.map(li => 
        li.replace(/<\/?[^>]+(>|$)/g, "").trim()
      ).filter(Boolean) || [];
      const responsibilities = listItems.slice(0, Math.ceil(listItems.length / 2));
      const requirements = listItems.slice(Math.ceil(listItems.length / 2));
      if (responsibilities.length === 0) {
        responsibilities.push(
          "Collaborate with the cross-functional product and engineering teams.",
          "Write clean, maintainable, and high-performance production code.",
          "Debug and troubleshoot application issues and customer bug reports."
        );
      }
      if (requirements.length === 0) {
        requirements.push(
          `Strong proficiency with technologies related to ${role}.`,
          "Excellent written and verbal communication skills.",
          "Ability to work effectively in a fully remote environment."
        );
      }
      return {
        id: String(j.id || Math.random().toString(36).substr(2, 9)),
        title: j.title || role,
        company: companyName,
        companyType: "Technology Company",
        hrEmail: `careers@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`,
        logo: companyName.substring(0, 2).toUpperCase(),
        logoColor: getRandomColor(),
        location: j.candidate_required_location || "Remote",
        mode: "Remote",
        type: j.job_type === "full_time" ? "Full-time" : "Contract",
        salary: j.salary || "Competitive Salary",
        experience: inferExperience(j.title || role, j.description || '', experience),
        posted: getRelativeTime(j.publication_date),
        createdTime: j.publication_date ? new Date(j.publication_date).getTime() : Date.now(),
        deadline: "Open",
        openings: 1,
        description: cleanDesc,
        responsibilities: responsibilities.slice(0, 5),
        requirements: requirements.slice(0, 5),
        niceToHave: ["Familiarity with modern deployment stacks.", "Prior experience in remote startup teams."],
        benefits: ["Remote work flexibility", "Competitive compensation", "Flexible paid time off"],
        matchScore: Math.floor(Math.random() * 20) + 78,
        matchReason: `High demand for ${role} skills at ${companyName}.`,
        tags: j.tags || [],
        applicationLink: j.url || ""
      };
    });
  } catch (err) {
    return [];
  }
}

router.post('/jobs', async (req, res) => {
  try {
    const { role = '', location = 'Bangalore', skills = [], experience = 'Fresher', page = 1 } = req.body;
    if (!role.trim()) return res.status(400).json({ error: 'Role is required' });

    const skillStr = Array.isArray(skills) ? skills.join(', ') : String(skills);
    const cacheKey = `jobs:${role}:${location}:${experience}:p${page}`.toLowerCase().replace(/\s+/g,'-');
    const hit = getCache(cacheKey);
    if (hit) return res.json(hit);

    let jobs = [];

    const apiResults = await Promise.allSettled([
      fetchAdzunaJobs(role, location, experience, page),
      fetchHimalayasJobs(role, location, experience, page),
      fetchArbeitnowJobs(role, location, experience, page),
      fetchSerpApiJobs(role, location, experience, page),
      fetchRemotiveJobs(role, location, experience, page)
    ]);

    const adzunaJobs = apiResults[0].status === 'fulfilled' ? apiResults[0].value : [];
    const himalayasJobs = apiResults[1].status === 'fulfilled' ? apiResults[1].value : [];
    const arbeitnowJobs = apiResults[2].status === 'fulfilled' ? apiResults[2].value : [];
    const serpJobs = apiResults[3].status === 'fulfilled' ? apiResults[3].value : [];
    const remotiveJobs = apiResults[4].status === 'fulfilled' ? apiResults[4].value : [];

    jobs = [...adzunaJobs, ...himalayasJobs, ...arbeitnowJobs, ...serpJobs, ...remotiveJobs];

    jobs = jobs.filter(j => isExperienceCompatible(j.experience, experience));

    const seen = new Set();
    jobs = jobs.filter(j => {
      const key = `${j.title.toLowerCase()}:${j.company.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (jobs.length === 0) {
      try {
        const pageSize = 20;
        const batchSize = 10;
        const [result1, result2] = await Promise.all([
          generate({ prompt: buildJobPrompt(role, location, experience, skillStr, batchSize), temperature: 0.9, maxOutputTokens: 8192 }),
          generate({ prompt: buildJobPrompt(role, location, experience, skillStr, batchSize), temperature: 0.9, maxOutputTokens: 8192 }),
        ]);
        
        const gJobs = [...toArr(result1), ...toArr(result2)];
        const isFallback = gJobs.length > 0 && gJobs.some(j => j.id === 'job-fallback-1');
        
        if (!isFallback) {
          jobs = gJobs;
        }
      } catch (apiErr) {
      }
    }

    if (jobs.length === 0) {
      const searchTerms = role.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      
      let filteredLocalJobs = JOBS_DATABASE.filter(j => {
        const title = j.title.toLowerCase();
        const desc = j.description.toLowerCase();
        const tags = j.tags.map(t => t.toLowerCase()).join(' ');
        return searchTerms.some(term => title.includes(term) || desc.includes(term) || tags.includes(term));
      });

      if (filteredLocalJobs.length === 0) {
        filteredLocalJobs = JOBS_DATABASE;
      }

      jobs = filteredLocalJobs.map((j, index) => ({
        ...j,
        id: `${j.id}-customized-${index}-${Math.floor(Math.random()*1000)}`,
        title: j.title.toLowerCase().includes(role.toLowerCase()) ? j.title : `${role}`,
        location: location || j.location,
        experience: experience || j.experience,
        posted: `${index + 1} day${index === 0 ? '' : 's'} ago`,
        createdTime: Date.now() - (index + 1) * 24 * 60 * 60 * 1000,
      }));
    }

    jobs.sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0));
    jobs = jobs.map(j => scrubAdzuna(j));
    const hasMore = page < 3;
    const out = { jobs, total: jobs.length, role, location, page, hasMore };
    if (jobs.length > 5) setCache(cacheKey, out);
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/resolve-apply', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL is required');
    const finalUrl = await resolveRedirect(url);
    res.redirect(finalUrl);
  } catch (err) {
    res.redirect(req.query.url || '/');
  }
});

router.post('/find-hr-email', async (req, res) => {
  try {
    const { company } = req.body;
    if (!company) return res.status(400).json({ error: 'Company is required' });
    const result = await findRealHREmail(company);
    res.json(result);
  } catch (err) {
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
      recruiterName       = '',
    } = req.body;

    if (!job) return res.status(400).json({ error: 'Job details required' });

    let name = userName?.trim();
    if (!name || name === 'Job Applicant' || name === 'Alex Jensen' || name === 'Priya Sharma') {
      if (resumeText && resumeText.trim().length > 30) {
        const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0 && lines[0].length < 40 && !lines[0].toLowerCase().includes('resume') && !lines[0].toLowerCase().includes('cv')) {
          name = lines[0];
        }
      }
    }
    if (!name || name.trim() === '') {
      name = 'Satyam Sharma';
    }

    let email = userEmail?.trim();
    if (!email || email === 'alex@jensen.com' || email === 'priya@sharma.com') {
      if (resumeText && resumeText.trim().length > 30) {
        const emailMatch = resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          email = emailMatch[1];
        }
      }
    }
    if (!email || email.trim() === '') {
      email = 'satyam.sharma@email.com';
    }

    const skillStr  = Array.isArray(userSkills) ? userSkills.join(', ') : String(userSkills);
    const hasResume = resumeSkillsPresent.length > 0 || resumeText.length > 100;
    const matched   = resumeSkillsPresent.length > 0 ? resumeSkillsPresent.slice(0, 5).join(', ') : skillStr;
    const jobReqs   = (job.requirements || []).join(', ');

    const companyType = (job.companyType || '').toLowerCase();
    const firstRecruiter = recruiterName?.trim() && recruiterName !== 'Recruitment Team' && recruiterName !== 'Hiring Team' ? recruiterName.split(' ')[0] : '';
    let tone, greeting, style;
    if (companyType.includes('startup') || companyType.includes('studio') || companyType.includes('ai ') || companyType.includes('agency')) {
      tone    = 'casual and energetic — like one builder talking to another. Use "I\'m excited", "love what you\'re building", etc.';
      greeting= firstRecruiter ? `Hi ${firstRecruiter},` : `Hi ${job.company} Team,`;
      style   = 'Lead with what excites them about the startup\'s specific mission. Be direct and punchy.';
    } else if (companyType.includes('it services') || companyType.includes('it consulting') || companyType.includes('consulting')) {
      tone    = 'formal and structured. Use "Dear", "I wish to apply", "I would welcome the opportunity"';
      greeting= recruiterName?.trim() && recruiterName !== 'Recruitment Team' && recruiterName !== 'Hiring Team' ? `Dear ${recruiterName},` : `Dear ${job.company} Recruitment Team,`;
      style   = 'Lead with qualifications and reliability. Emphasize process, teamwork, and domain knowledge.';
    } else if (companyType.includes('unicorn') || companyType.includes('giant') || companyType.includes('fintech')) {
      tone    = 'warm-professional — ambitious but respectful. Use "I\'ve admired", "genuinely excited", "would love to contribute"';
      greeting= recruiterName?.trim() && recruiterName !== 'Recruitment Team' && recruiterName !== 'Hiring Team' ? `Dear ${recruiterName},` : `Dear ${job.company} Hiring Team,`;
      style   = 'Lead with a specific thing you admire about the company\'s product or growth. Then pivot to skills.';
    } else {
      tone    = 'professional yet personable';
      greeting= recruiterName?.trim() && recruiterName !== 'Recruitment Team' && recruiterName !== 'Hiring Team' ? `Dear ${recruiterName},` : `Dear ${job.company} Recruitment Team,`;
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
- Email: ${email}
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
8. Sign off: "Best regards,\\n${name}\\n${email}"
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
    const jobs      = toArr(raw).map(j => scrubAdzuna(j));
    const out       = { jobs, total: jobs.length, role };
    if (jobs.length) setCache(key, out);
    res.json(out);
  } catch (err) {
    console.error('[/role-jobs] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/ats-audit', async (req, res) => {
  try {
    const { resumeText = '', skills = [], contact = {} } = req.body;
    if (!resumeText.trim() || resumeText.length < 30) {
      return res.status(400).json({ error: 'Resume text too short or empty' });
    }

    const skillStr = Array.isArray(skills) ? skills.join(', ') : String(skills);
    
    const prompt = `You are a Senior Recruiter and ATS (Applicant Tracking System) Expert with years of hiring experience in the tech sector.
Analyze this candidate's resume text and generate a comprehensive ATS Audit Report, customized suggestions, and a Suited Roles directory containing exactly 20 suited tech job titles they are qualified for based on their profile.

Candidate Resume Text:
"${resumeText.slice(0, 4500)}"

Additional skills: ${skillStr}

VERIFIED CONTACT INFORMATION TO USE AT THE TOP OF THE RESUME (IF PROVIDED):
Name: ${contact.name || ''}
Email: ${contact.email || ''}
Phone: ${contact.phone || ''}
LinkedIn: ${contact.linkedin || ''}
GitHub: ${contact.github || ''}

CRITICAL INSTRUCTIONS FOR CANDIDATE INFO EXTRACTION:
1. Scan the "Candidate Resume Text" carefully to extract the candidate's actual Full Name, Mobile/Phone Number, Email Address, LinkedIn URL, and GitHub URL if they are not already provided in the verified contact section above.
2. In the "atsOptimizedResumeText" property, you MUST write the full rewritten resume text. At the very top, place the verified contact details (Name, Email, Phone, LinkedIn, GitHub) if provided, or the extracted ones. DO NOT use generic mock placeholders (like "Satyam Sharma" or generic phone numbers) if actual details are provided or present in the text.
3. Restructure the entire resume into a single-column, clean layout: Contact Info -> Professional Summary -> Technical Skills (categorized) -> Professional Experience (using STAR bullets with action verbs and metrics) -> Academic/Personal Projects -> Education.
4. Optimize this resume so it is 100% compliant with standard Applicant Tracking Systems, ensuring the candidate achieves a 95-100% ATS score rating.

Return a single JSON object (with no markdown wrappers, no arrays outside fields):
{
  "atsGrade": "<A+, A, or B+ depending on the optimized resume>",
  "atsScore": <integer 95-100 representing the score of this newly optimized resume version>,
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
    "<High-impact resume experience bullet point 1 using STAR/AIM format (Accomplished Action as measured by Impact by doing Method)>",
    "<High-impact resume experience bullet point 2 using STAR/AIM format>",
    "<High-impact resume experience bullet point 3 using STAR/AIM format>",
    "<High-impact resume experience bullet point 4 using STAR/AIM format>"
  ],
  "atsOptimizedResumeText": "<Full, professional, rewritten single-column resume starting with the candidate's ACTUAL extracted contact details at the top, followed by Summary, Technical Skills, Experience, Projects, and Education sections, fully formatted with clean whitespace and ready for professional recruitment evaluation.>",
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


const JOBS_DATABASE = [
  // ── TECH ROLES ─────────────────────────────────────────────────────────────
  {
    id: "tech-001",
    title: "MERN Stack Developer",
    company: "Zomato",
    companyType: "Product Startup",
    hrEmail: "careers.tech@zomato.com",
    logo: "ZO",
    logoColor: "#f43f5e",
    location: "Gurugram",
    mode: "Hybrid",
    type: "Full-time",
    salary: "12 - 18 LPA",
    experience: "1-2 years",
    posted: "1 day ago",
    deadline: "30 June 2026",
    openings: 3,
    description: "Join Zomato's core logistics team to build high-performance web applications. You will work on optimizing restaurant partner dashboards and real-time tracking portals.",
    responsibilities: [
      "Develop clean, modular React components for our partner portal.",
      "Build high-throughput Node.js microservices with Express and MongoDB.",
      "Optimize real-time state management using Redux and WebSockets."
    ],
    requirements: [
      "Hands-on experience with MongoDB, Express, React, and Node.js.",
      "Familiarity with Redis caching and RESTful API optimization.",
      "Good understanding of Git workflows and code reviews."
    ],
    niceToHave: ["Experience with Docker and Kubernetes.", "Prior startup experience."],
    benefits: ["Free daily meals", "Comprehensive medical insurance", "Flexible work hours"],
    matchScore: 94,
    matchReason: "Matches your React and Node.js development background perfectly.",
    tags: ["MERN", "React", "NodeJS", "MongoDB"]
  },
  {
    id: "tech-002",
    title: "React Developer",
    company: "Razorpay",
    companyType: "FinTech Startup",
    hrEmail: "recruiting@razorpay.com",
    logo: "RA",
    logoColor: "#3b82f6",
    location: "Bangalore",
    mode: "Remote",
    type: "Full-time",
    salary: "14 - 20 LPA",
    experience: "2-4 years",
    posted: "Today",
    deadline: "15 July 2026",
    openings: 2,
    description: "Looking for an ambitious frontend developer to build the next generation of merchant payment interfaces. You will be responsible for creating accessible and fast checkout forms.",
    responsibilities: [
      "Craft highly interactive dashboards with React and TypeScript.",
      "Ensure web accessibility (WCAG 2.1) and semantic HTML practices.",
      "Collaborate with product designers to implement the Razorpay Design System."
    ],
    requirements: [
      "Strong proficiency in JavaScript, React, and CSS/SCSS.",
      "Experience with state management tools like Zustand or Redux Toolkit.",
      "Strong understanding of browser rendering cycles and caching mechanisms."
    ],
    niceToHave: ["Familiarity with TailwindCSS.", "Contributions to open-source UI libraries."],
    benefits: ["Home office setup allowance", "Mental health wellness programs", "Quarterly team offsites"],
    matchScore: 89,
    matchReason: "Strong fit based on your modern React capabilities.",
    tags: ["React", "TypeScript", "Frontend"]
  },
  {
    id: "tech-003",
    title: "Full Stack Developer",
    company: "Swiggy",
    companyType: "On-demand Delivery Giant",
    hrEmail: "tech-hiring@swiggy.in",
    logo: "SW",
    logoColor: "#f59e0b",
    location: "Bangalore",
    mode: "Hybrid",
    type: "Full-time",
    salary: "16 - 22 LPA",
    experience: "2-4 years",
    posted: "2 days ago",
    deadline: "05 July 2026",
    openings: 4,
    description: "Be part of Swiggy Instamart's core platform scaling backend services and building seamless checkout experiences on web portals.",
    responsibilities: [
      "Design and construct reusable frontend modules using React.",
      "Create scalable backends with Node.js and PostgreSQL.",
      "Work closely with DevOps to deploy and monitor systems on AWS."
    ],
    requirements: [
      "Proficient in React, Node.js, and SQL databases.",
      "Experience with RESTful and GraphQL API designs.",
      "Good understanding of microservice architectures."
    ],
    niceToHave: ["Familiarity with Redis and Kafka.", "Knowledge of Go or Java."],
    benefits: ["Unlimited snacks and drinks", "Gym membership", "Annual learning stipend"],
    matchScore: 88,
    matchReason: "Perfect fit for full-stack developers looking to scale product applications.",
    tags: ["React", "NodeJS", "PostgreSQL", "AWS"]
  },
  {
    id: "tech-004",
    title: "Python Developer",
    company: "TCS",
    companyType: "MNC IT Services",
    hrEmail: "tcs.recruitment@tcs.com",
    logo: "TC",
    logoColor: "#10b981",
    location: "Pune",
    mode: "On-site",
    type: "Full-time",
    salary: "6 - 10 LPA",
    experience: "1-2 years",
    posted: "3 days ago",
    deadline: "20 July 2026",
    openings: 5,
    description: "Looking for Python Developers to build automation tools and analytics engines for international banking clients.",
    responsibilities: [
      "Write clean, maintainable Python scripts for ETL pipelines.",
      "Develop REST APIs using Django or FastAPI framework.",
      "Integrate database queries and optimize performance."
    ],
    requirements: [
      "Strong Python knowledge and experience with Django/Flask/FastAPI.",
      "Familiarity with MySQL or PostgreSQL database.",
      "Basic understanding of HTML/CSS and frontend integration."
    ],
    niceToHave: ["Familiarity with AWS services.", "Understanding of Docker."],
    benefits: ["Health insurance", "Paid leaves", "On-campus training facilities"],
    matchScore: 80,
    matchReason: "Good fit for Python automation and web developers.",
    tags: ["Python", "FastAPI", "ETL", "SQL"]
  },
  {
    id: "tech-005",
    title: "Data Analyst",
    company: "Paytm",
    companyType: "FinTech Giant",
    hrEmail: "analytics.hiring@paytm.com",
    logo: "PA",
    logoColor: "#0ea5e9",
    location: "Noida",
    mode: "On-site",
    type: "Full-time",
    salary: "8 - 12 LPA",
    experience: "0-1 year",
    posted: "1 day ago",
    deadline: "08 July 2026",
    openings: 2,
    description: "Looking for an analytical mind to gather data insights, create BI dashboards, and help product managers optimize merchant onboarding funnel.",
    responsibilities: [
      "Analyze massive customer transaction datasets using SQL and Python.",
      "Build live visual reports and dashboards on Tableau/PowerBI.",
      "Present metric summaries and drop-off reports to stakeholders."
    ],
    requirements: [
      "Excellent SQL skills and python packages like Pandas, NumPy.",
      "Strong command over Excel and dashboarding tools (Tableau/PowerBI).",
      "Good communication skills and storytelling with data."
    ],
    niceToHave: ["Familiarity with Google Analytics.", "Basic statistics background."],
    benefits: ["Corporate discounts", "Comprehensive health coverage", "Flexible leaves"],
    matchScore: 83,
    matchReason: "Great option for freshers with strong SQL and analytics skills.",
    tags: ["SQL", "Python", "Tableau", "PowerBI"]
  },
  {
    id: "tech-006",
    title: "Android Developer",
    company: "PhonePe",
    companyType: "Payments Tech MNC",
    hrEmail: "careers@phonepe.com",
    logo: "PH",
    logoColor: "#8b5cf6",
    location: "Bangalore",
    mode: "Hybrid",
    type: "Full-time",
    salary: "15 - 24 LPA",
    experience: "2-4 years",
    posted: "Today",
    deadline: "12 July 2026",
    openings: 2,
    description: "Help us build consumer-facing applications that process millions of transactions per second. Focus on modular app architectures and Kotlin development.",
    responsibilities: [
      "Develop new features in Kotlin following MVVM architecture.",
      "Optimize application performance, memory footprint, and network latency.",
      "Maintain offline-first caching structures for low-bandwidth networks."
    ],
    requirements: [
      "Solid knowledge of Android SDK and Kotlin development.",
      "Experience with Jetpack Compose, Coroutines, and Flow.",
      "Prior experience implementing security and encryption layers."
    ],
    niceToHave: ["Familiarity with Flutter or React Native.", "Published apps in Play Store."],
    benefits: ["Excellent equity package (ESOPs)", "Full medical coverage", "Yearly vacation allowance"],
    matchScore: 82,
    matchReason: "Kotlin developers with UI capabilities fit this role.",
    tags: ["Android", "Kotlin", "JetpackCompose"]
  },

  // ── MARKETING ROLES ─────────────────────────────────────────────────────────
  {
    id: "mkt-001",
    title: "Social Media Manager",
    company: "Ogilvy India",
    companyType: "Ad Agency Network",
    hrEmail: "careers.india@ogilvy.com",
    logo: "OG",
    logoColor: "#f43f5e",
    location: "Mumbai",
    mode: "On-site",
    type: "Full-time",
    salary: "7 - 11 LPA",
    experience: "1-2 years",
    posted: "Today",
    deadline: "28 June 2026",
    openings: 2,
    description: "Manage leading FMCG brands' social media footprint. Create, curate, and schedule daily organic social campaigns that drive conversation.",
    responsibilities: [
      "Design creative content plans for Instagram, LinkedIn, and YouTube.",
      "Coordinate with designers, video editors, and copywriters for asset delivery.",
      "Monitor engagement and write weekly analytical reports on reach."
    ],
    requirements: [
      "Proven history of managing business pages on Instagram/LinkedIn.",
      "Strong copywriting skills and aesthetic sense.",
      "Active understanding of social trends and meme marketing."
    ],
    niceToHave: ["Familiarity with Canva, Photoshop, or CapCut.", "Short-form video editing."],
    benefits: ["Creative work environment", "Corporate medical insurance", "Quarterly team lunches"],
    matchScore: 90,
    matchReason: "Perfect fit for digital marketers and creative managers.",
    tags: ["Marketing", "SocialMedia", "ContentStrategy"]
  },
  {
    id: "mkt-002",
    title: "SEO Specialist",
    company: "Mamaearth",
    companyType: "D2C Startup",
    hrEmail: "seo.hiring@mamaearth.in",
    logo: "MA",
    logoColor: "#10b981",
    location: "Gurugram",
    mode: "Hybrid",
    type: "Full-time",
    salary: "8 - 13 LPA",
    experience: "2-4 years",
    posted: "2 days ago",
    deadline: "10 July 2026",
    openings: 1,
    description: "Drive organic search traffic to Mamaearth's product catalog. Focus on technical SEO, site speed audits, and link building campaigns.",
    responsibilities: [
      "Conduct keyword research to discover high-intent transactional queries.",
      "Audit web vital metrics and work with backend devs to optimize structure.",
      "Execute white-hat outreach backlink strategies."
    ],
    requirements: [
      "Expertise in Google Search Console, Ahrefs, SEMrush, and Screaming Frog.",
      "Good understanding of Schema markup and on-page optimization.",
      "Analytical mindset to track user behavior via Google Analytics."
    ],
    niceToHave: ["Basic HTML/CSS/JS knowledge.", "E-commerce SEO experience."],
    benefits: ["Product discounts", "Flexible work arrangements", "Health insurance"],
    matchScore: 86,
    matchReason: "Fits analytical marketers with technical search optimization backgrounds.",
    tags: ["SEO", "GoogleAnalytics", "Ahrefs", "D2C"]
  },
  {
    id: "mkt-003",
    title: "Content Writer",
    company: "UpGrad",
    companyType: "EdTech Unicorn",
    hrEmail: "content@upgrad.com",
    logo: "UP",
    logoColor: "#f43f5e",
    location: "Mumbai",
    mode: "Remote",
    type: "Contract",
    salary: "45,000 - 65,000 Per Month",
    experience: "Fresher (0 yr)",
    posted: "3 days ago",
    deadline: "05 July 2026",
    openings: 3,
    description: "Write high-quality SEO-optimized blogs, email newsletters, and landing page content for upGrad's masterclass courses.",
    responsibilities: [
      "Write engaging articles on technology, management, and data science.",
      "Write copy for email marketing flows and promotional banners.",
      "Ensure proofreading, grammar compliance, and plagiarism-free quality."
    ],
    requirements: [
      "Excellent written English and vocabulary.",
      "Basic understanding of SEO blog writing conventions.",
      "Ability to research tech subjects and explain them simply."
    ],
    niceToHave: ["Familiarity with WordPress.", "Active personal blog/Medium page."],
    benefits: ["Remote work flexibility", "Mentorship from senior editors", "Work completion certificate"],
    matchScore: 92,
    matchReason: "Highly recommended for freshers looking for full-time writing roles.",
    tags: ["ContentWriting", "Copywriting", "Blogging", "EdTech"]
  },

  // ── SALES ROLES ────────────────────────────────────────────────────────────
  {
    id: "sls-001",
    title: "Business Development Associate",
    company: "Byju's",
    companyType: "EdTech Platform",
    hrEmail: "bda.talent@byjus.com",
    logo: "BY",
    logoColor: "#8b5cf6",
    location: "Bangalore",
    mode: "On-site",
    type: "Full-time",
    salary: "5 - 8 LPA + Incentives",
    experience: "Fresher (0 yr)",
    posted: "1 day ago",
    deadline: "20 July 2026",
    openings: 15,
    description: "Drive sales of our digital learning curriculum. Pitch courses to parents and students through online calls and home demo sessions.",
    responsibilities: [
      "Reach out to potential leads through phone cold calls.",
      "Demonstrate course apps and close admissions targets.",
      "Handle customer queries and support onboarding."
    ],
    requirements: [
      "Excellent verbal communication in English and Hindi/Regional language.",
      "Highly motivated with target-driven mindset.",
      "Willingness to travel for client pitches if required."
    ],
    niceToHave: ["Prior sales internship experience.", "Negotiation training."],
    benefits: ["Unlimited high sales incentives", "Fast-track promotions", "Health insurance"],
    matchScore: 85,
    matchReason: "Great career start for freshers with great speaking skills.",
    tags: ["Sales", "ColdCalling", "EdTech", "BDA"]
  },
  {
    id: "sls-002",
    title: "Inside Sales Executive",
    company: "Zoho Corporation",
    companyType: "SaaS Enterprise",
    hrEmail: "sales-jobs@zoho.com",
    logo: "ZO",
    logoColor: "#3b82f6",
    location: "Chennai",
    mode: "Hybrid",
    type: "Full-time",
    salary: "8 - 12 LPA",
    experience: "1-2 years",
    posted: "2 days ago",
    deadline: "12 July 2026",
    openings: 5,
    description: "Manage inbound product sales queries. Qualify prospective businesses and pitch CRM and enterprise products to international leads.",
    responsibilities: [
      "Conduct Zoho product demos to business owners online.",
      "Maintain active leads pipeline and handle pricing negotiations.",
      "Provide feedback on product requirements to engineers."
    ],
    requirements: [
      "Prior experience in B2B SaaS or IT inside sales.",
      "Strong presentation skills and high technical confidence.",
      "Fluency in speaking English and professional writing."
    ],
    niceToHave: ["Familiarity with CRM platforms.", "Knowledge of global markets."],
    benefits: ["Free meals and refreshments", "Corporate bus shuttle services", "Premium healthcare"],
    matchScore: 87,
    matchReason: "SaaS inside sales role that fits energetic sales consultants.",
    tags: ["InsideSales", "SaaS", "B2B", "Zoho"]
  },

  // ── FINANCE ROLES ──────────────────────────────────────────────────────────
  {
    id: "fin-001",
    title: "Financial Analyst",
    company: "HDFC Bank",
    companyType: "Banking Institution",
    hrEmail: "recruiting@hdfcbank.com",
    logo: "HD",
    logoColor: "#3b82f6",
    location: "Mumbai",
    mode: "On-site",
    type: "Full-time",
    salary: "9 - 14 LPA",
    experience: "2-4 years",
    posted: "1 day ago",
    deadline: "05 July 2026",
    openings: 2,
    description: "Conduct financial modeling, forecast profitability metrics, and evaluate loan risk sheets for large corporate applications.",
    responsibilities: [
      "Develop financial projection sheets and models in Excel.",
      "Audit quarterly balance sheets and asset sheets.",
      "Produce written market risk summaries for directors."
    ],
    requirements: [
      "Degree in Commerce, Finance (MBA/CA/CFA preferred).",
      "Expert skills in MS Excel formulas and macro structures.",
      "Clear knowledge of corporate finance principles and audits."
    ],
    niceToHave: ["Experience with SAP or Oracle Finance.", "Understanding of corporate banking rules."],
    benefits: ["Banking employee allowances", "Gratuity and PF", "Comprehensive health coverage"],
    matchScore: 82,
    matchReason: "Fits professionals with CA/CFA/MBA background.",
    tags: ["Finance", "Excel", "FinancialModeling"]
  },

  // ── MEDICAL / HEALTHCARE ───────────────────────────────────────────────────
  {
    id: "med-001",
    title: "General Physician",
    company: "Apollo Hospitals",
    companyType: "Hospital Group",
    hrEmail: "apollo.hr@apollohospitals.com",
    logo: "AP",
    logoColor: "#10b981",
    location: "Chennai",
    mode: "On-site",
    type: "Full-time",
    salary: "15 - 22 LPA",
    experience: "2-4 years",
    posted: "Today",
    deadline: "25 July 2026",
    openings: 3,
    description: "Manage OPD and emergency medical consultations. Looking for dedicated MD/MBBS doctor with a empathetic patient focus.",
    responsibilities: [
      "Diagnose and treat medical conditions in corporate OPD settings.",
      "Provide diagnostic guidance and write medicine scripts.",
      "Collaborate with specialized doctors for emergency transfers."
    ],
    requirements: [
      "MBBS degree with MCI/State Registration (MD General Medicine is a plus).",
      "Excellent diagnostic capabilities and emergency management.",
      "Patient-first soft skills and warm disposition."
    ],
    niceToHave: ["Knowledge of telemedicine portals.", "ACLS/BLS certification."],
    benefits: ["Accommodation support", "Medical malpractice insurance cover", "Annual medical conferences allowance"],
    matchScore: 92,
    matchReason: "Perfect medical career advancement for doctors.",
    tags: ["Medical", "Doctor", "MBBS", "OPD"]
  },
  {
    id: "med-002",
    title: "Staff Nurse",
    company: "Fortis Healthcare",
    companyType: "Healthcare Group",
    hrEmail: "hr@fortishealthcare.com",
    logo: "FO",
    logoColor: "#0ea5e9",
    location: "Delhi NCR",
    mode: "On-site",
    type: "Full-time",
    salary: "3.5 - 5.5 LPA",
    experience: "1-2 years",
    posted: "2 days ago",
    deadline: "15 July 2026",
    openings: 8,
    description: "Provide patient care in ICU/Ward environments. Ensure continuous monitoring of vital metrics and maintain documentation compliance.",
    responsibilities: [
      "Administer medicines and IV solutions as directed.",
      "Observe patient vital signs and report anomalies.",
      "Prepare patients for scans and medical surgeries."
    ],
    requirements: [
      "B.Sc Nursing or GNM certification.",
      "State Nursing Council active license.",
      "Prior clinical training in hospital wards."
    ],
    niceToHave: ["Experience in ICU or Critical Care ward.", "Immediate joining availability."],
    benefits: ["Hospital canteen meals", "Overtime allowance", "Nurse housing quarters"],
    matchScore: 88,
    matchReason: "Matches clinical nursing graduates.",
    tags: ["Healthcare", "Nursing", "ICU", "GNM"]
  },

  // ── EDUCATION ROLES ────────────────────────────────────────────────────────
  {
    id: "edu-001",
    title: "Primary School Teacher",
    company: "Delhi Public School",
    companyType: "Education Group",
    hrEmail: "hiring@dpsindia.org",
    logo: "DP",
    logoColor: "#eab308",
    location: "Jaipur",
    mode: "On-site",
    type: "Full-time",
    salary: "4.5 - 6.5 LPA",
    experience: "1-2 years",
    posted: "3 days ago",
    deadline: "30 June 2026",
    openings: 2,
    description: "Delhi Public School Jaipur is looking for primary school teachers to manage elementary classes and teach General Subjects.",
    responsibilities: [
      "Plan daily lesson topics and conduct creative class sessions.",
      "Evaluate student assignment sheets and schedule monthly parent calls.",
      "Organize school annual cultural events."
    ],
    requirements: [
      "Bachelor of Education (B.Ed) with graduate degree.",
      "Fluent English speaking and writing skills.",
      "Passionate about teaching and child care."
    ],
    niceToHave: ["Knowledge of digital teaching tools.", "CTET certified."],
    benefits: ["School bus transport facility", "Quarterly holidays", "Children fee concession"],
    matchScore: 90,
    matchReason: "Matches children teaching aspirants with B.Ed certification.",
    tags: ["Education", "Teacher", "BEd", "School"]
  }
];

module.exports = JOBS_DATABASE;

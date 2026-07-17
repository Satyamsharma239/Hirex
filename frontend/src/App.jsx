import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import { Menu, Compass, ChevronRight, CheckCircle2 } from 'lucide-react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const ResumeProfile = lazy(() => import('./components/ResumeProfile'));
const JobDiscovery = lazy(() => import('./components/JobDiscovery'));
const PublicProfile = lazy(() => import('./components/PublicProfile'));
const OnboardingPortal = lazy(() => import('./components/OnboardingPortal'));
const ConsoleOverview = lazy(() => import('./components/ConsoleOverview'));
const InterviewPrep = lazy(() => import('./components/InterviewPrep'));

// Premium Loading Fallback Component
const PageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh', gap: 16 }}>
    <div style={{
      width: 48, height: 48, borderRadius: 14,
      background: 'linear-gradient(135deg, rgba(0, 201, 167, 0.15), rgba(139, 92, 246, 0.1))',
      border: '1.5px solid var(--border-teal)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(0, 201, 167, 0.1)',
      animation: 'pulse 2s infinite'
    }}>
      <div className="spinner spinner-teal" style={{ width: 24, height: 24, borderWidth: 3 }}></div>
    </div>
    <div className="skeleton-shimmer" style={{ width: 100, height: 6, borderRadius: 4 }}></div>
  </div>
);

const defaultBrand = {
  name: "Satyam Sharma",
  headline: "MERN Stack Developer | React · Node.js · MongoDB | Open to Work",
  tagline: "Building scalable web solutions with modern JavaScript frameworks.",
  topSkills: ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
  uniqueValue: "Specializes in full-stack MERN application engineering with a strong focus on frontend state optimization and responsive interfaces.",
  lookingFor: "Full Stack or Frontend Developer roles in growth-focused tech companies.",
  availableFrom: "Immediately",
  preferredLocations: ["Bangalore", "Mumbai", "Remote"],
  openToRemote: true,
  experienceSummary: "Self-taught software developer who built and deployed production-ready web platforms using React and Node.js.",
  achievements: [
    "Built HireX AI Career Suite tracking 20+ jobs.",
    "Optimized client-side web apps improving speeds by 30%."
  ],
  linkedinMessage: "I am a Full-Stack developer who enjoys building systems with JavaScript, React, and Node.js. Ready to bring value!",
  coldEmailIntro: "I noticed your engineering team is expanding, and wanted to share how my React/Node.js experience can add value."
};

const defaultDna = {
  careerPersonality: "The Builder",
  careerPersonalityDesc: "You love turning ideas into functional software code. You excel at full-stack development, structuring databases, and building responsive frontends.",
  overallStrength: "Strong project execution using the MERN stack with modern JavaScript practices.",
  readinessLevel: "Job-Ready",
  topSkills: ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
  skillGaps: ["TypeScript", "Docker", "AWS"],
  recommendedRoles: [
    {title: "MERN Stack Developer", fit: 95, reason: "Excellent alignment with React/Node/Mongo projects.", avgSalary: "5-8 LPA", demandLevel: "Very High", growthPath: "Senior Full Stack Engineer"},
    {title: "Frontend Engineer", fit: 90, reason: "Strong skill set in CSS, state management, and component architecture.", avgSalary: "4-7 LPA", demandLevel: "High", growthPath: "Frontend Architect"}
  ],
  topIndustries: ["SaaS", "FinTech", "E-Commerce"],
  careerAdvice: "Continue building complex full-stack apps. Start incorporating TypeScript into your existing React projects to increase your market value in the Indian job space.",
  oneThingToLearnNow: "TypeScript for type-safe application development.",
  timeToHire: "3-5 weeks",
  confidence: "Your project portfolio shows high practical execution. You are ready to tackle mid-scale developer roles."
};

const defaultAudit = {
  atsGrade: "A+",
  atsScore: 98,
  recruiterSummary: "The candidate displays outstanding practical proficiency in building full-stack MERN architectures. The rewritten resume completely resolves legacy multi-column layout parsing errors and structures achievements with STAR bullets.",
  formattingAudits: [
    {rule:"Avoid tables & columns",status:"Pass",reason:"Single-column clean plain text layout. Passes all modern parsing checkers."},
    {rule:"Standard section headers",status:"Pass",reason:"Headers are standardized and placed logically."},
    {rule:"Font & readability consistency",status:"Pass",reason:"Uniform Times New Roman print formatting applied."},
    {rule:"Contact details location",status:"Pass",reason:"Extracted contact details placed properly at the top."}
  ],
  keywordDensity: [
    {keyword:"React",present:true,count:6},
    {keyword:"Node.js",present:true,count:4},
    {keyword:"MongoDB",present:true,count:3},
    {keyword:"Express",present:true,count:3}
  ],
  suitedRoles: [
    {index:1,title:"React Developer",fit:98,reason:"Excellent match with your frontend state and component framework projects.",avgSalary:"6-10 LPA",demand:"Very High"},
    {index:2,title:"Frontend Engineer",fit:95,reason:"Strong JavaScript logic and responsive web interface background.",avgSalary:"5-9 LPA",demand:"Very High"},
    {index:3,title:"MERN Stack Developer",fit:94,reason:"Full-stack project experience spanning MongoDB, Express, React, and Node.js.",avgSalary:"6-9 LPA",demand:"High"},
    {index:4,title:"Node.js Developer",fit:90,reason:"Solid backend API construction and asynchronous logic understanding.",avgSalary:"5-8 LPA",demand:"High"},
    {index:5,title:"JavaScript Developer",fit:90,reason:"Deep knowledge of JavaScript ES6+, closures, and asynchronous flow control.",avgSalary:"5-8 LPA",demand:"High"},
    {index:6,title:"Web Developer",fit:88,reason:"General capability to design and implement client-side websites.",avgSalary:"4-7 LPA",demand:"Medium"},
    {index:7,title:"Associate Software Engineer",fit:85,reason:"Foundational computer science concepts and coding ability for entry roles.",avgSalary:"6-10 LPA",demand:"High"},
    {index:8,title:"Junior Backend Developer",fit:82,reason:"Familiarity with server architectures, routing, and databases.",avgSalary:"4-7 LPA",demand:"Medium"},
    {index:9,title:"UI Developer",fit:80,reason:"Expertise in CSS, flexbox, grid, and converting designs to pixel-perfect layouts.",avgSalary:"4-6 LPA",demand:"Medium"},
    {index:10,title:"Full Stack Developer",fit:80,reason:"Versatile experience on both client-side interfaces and database models.",avgSalary:"5-8 LPA",demand:"High"},
    {index:11,title:"Software Developer",fit:78,reason:"Ability to write modular code, resolve bugs, and build features.",avgSalary:"5-9 LPA",demand:"High"},
    {index:12,title:"Data Analyst",fit:75,reason:"Capability to handle structured database queries (SQL/MongoDB) and clean JSON data.",avgSalary:"4-7 LPA",demand:"Medium"},
    {index:13,title:"QA Automation Engineer",fit:72,reason:"Logical mindset suitable for writing test scripts and verifying interface inputs.",avgSalary:"4-8 LPA",demand:"Medium"},
    {index:14,title:"Technical Support Engineer",fit:70,reason:"Deep technical knowledge to diagnose user issues, review logs, and fix bugs.",avgSalary:"3-6 LPA",demand:"Medium"},
    {index:15,title:"DevOps Junior Associate",fit:68,reason:"Foundational skills in hosting backend routes and configuring CORS or proxy headers.",avgSalary:"5-8 LPA",demand:"Medium"},
    {index:16,title:"Product Analyst",fit:65,reason:"Strong combination of coding understanding and product features analysis.",avgSalary:"4-8 LPA",demand:"Medium"},
    {index:17,title:"Mobile Web Developer",fit:62,reason:"Designing responsive viewports for mobile browsers using flexbox media queries.",avgSalary:"4-7 LPA",demand:"Medium"},
    {index:18,title:"Solutions Engineer",fit:60,reason:"Helping customize and integrate APIs, webhooks, and database configurations.",avgSalary:"5-9 LPA",demand:"Medium"},
    {index:19,title:"API Developer",fit:60,reason:"Designing structured RESTful APIs, routing parameters, and error handlers.",avgSalary:"5-8 LPA",demand:"High"},
    {index:20,title:"Technical Writer",fit:60,reason:"Strong documentation capacity and clear layout formatting capability.",avgSalary:"3-6 LPA",demand:"Medium"}
  ],
  atsOptimizedResumeText: `SATYAM SHARMA\nsatyam.sharma@email.com | +91 98765 43210 | GitHub: github.com/satyamsharma | LinkedIn: linkedin.com/in/satyamsharma\n\nPROFESSIONAL SUMMARY\nHighly skilled Software Developer with 1+ years of experience designing and deploying high-impact full-stack web architectures. Specialized in MERN stack development (MongoDB, Express.js, React, Node.js). Proven ability to optimize client-side bundle performance and build robust, secure backend microservices. Active problem solver committed to writing clean, maintainable, and well-documented code.\n\nTECHNICAL SKILLS\n- Frontend Frameworks: React.js, Redux Toolkit, Tailwind CSS\n- Backend: Node.js, Express.js, MongoDB\n\nPROFESSIONAL EXPERIENCE\nSoftware Developer | HireX AI\n- Architected and deployed responsive MERN stack web applications using React hooks and Node.js REST routes.`
};

export default function App() {
  const [page, setPage]               = useState('console');
  const [prepPrefill, setPrepPrefill] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPublicRoute, setIsPublicRoute] = useState(false);

  useEffect(() => {
    if (window.location.pathname.startsWith('/u/')) {
      setIsPublicRoute(true);
    }
  }, []);

  const [resumeText, setResumeText] = useState(() => localStorage.getItem('hirex_resume_text') || '');
  const [resumeData, setResumeData] = useState(() => {
    try {
      const saved = localStorage.getItem('hirex_resume_data');
      if (saved && saved !== 'null') return JSON.parse(saved);
      return localStorage.getItem('hirex_resume_text') ? defaultBrand : null;
    } catch { return null; }
  });
  const [dnaData, setDnaData] = useState(() => {
    try {
      const saved = localStorage.getItem('hirex_dna_data');
      if (saved && saved !== 'null') return JSON.parse(saved);
      return localStorage.getItem('hirex_resume_text') ? defaultDna : null;
    } catch { return null; }
  });
  const [auditData, setAuditData] = useState(() => {
    try {
      const saved = localStorage.getItem('hirex_audit_data');
      if (saved && saved !== 'null') return JSON.parse(saved);
      return localStorage.getItem('hirex_resume_text') ? defaultAudit : null;
    } catch { return null; }
  });

  const handleUpdateProfile = (text, brand, dna, audit) => {
    const finalBrand = brand || defaultBrand;
    const finalDna = dna || defaultDna;
    const finalAudit = audit || defaultAudit;
    setResumeText(text);
    setResumeData(finalBrand);
    setDnaData(finalDna);
    setAuditData(finalAudit);
    localStorage.setItem('hirex_resume_text', text);
    localStorage.setItem('hirex_resume_data', JSON.stringify(finalBrand));
    localStorage.setItem('hirex_dna_data', JSON.stringify(finalDna));
    localStorage.setItem('hirex_audit_data', JSON.stringify(finalAudit));
    setPage('dashboard');
  };

  // Job Discovery params (set when coming from Career DNA)
  const [discoverParams, setDiscoverParams] = useState({ role: '', skills: [] });

  const handleDiscoverJobs = (role, skills) => {
    setDiscoverParams({ role, skills });
    setPage('discover');
  };

  const PAGE_META = {
    console:   'Console Overview',
    profile:   'Resume Optimizer',
    discover:  'Job Discovery',
    prep:      'Interview Prep',
    dashboard: 'Job Tracker',
  };

  const renderPage = () => {
    switch (page) {
      case 'console': return (
        <ConsoleOverview
          onNavigate={setPage}
          resumeData={resumeData}
          dnaData={dnaData}
          auditData={auditData}
        />
      );

      case 'dashboard': return (
        <Dashboard
          onNavigate={setPage}
          resumeText={resumeText}
          resumeData={resumeData}
          onSimulateInterview={(c, r, d) => {
            setPrepPrefill({ company: c, role: r, description: d });
            setPage('prep');
          }}
        />
      );

      case 'prep': return (
        <InterviewPrep
          resumeData={resumeData}
          prefillData={prepPrefill}
          onClearPrefill={() => setPrepPrefill(null)}
        />
      );

      case 'profile': return (
        <ResumeProfile
          onDiscoverJobs={handleDiscoverJobs}
          resumeText={resumeText}
          resumeData={resumeData}
          dnaData={dnaData}
          auditData={auditData}
          onUpdateProfile={handleUpdateProfile}
        />
      );

      case 'discover': return (
        <JobDiscovery
          initialRole={discoverParams.role}
          initialSkills={discoverParams.skills}
          resumeAnalyzed={!!resumeText}
          resumeData={resumeData}
          resumeText={resumeText}
          onSimulateInterview={(c, r, d) => {
            setPrepPrefill({ company: c, role: r, description: d });
            setPage('prep');
          }}
        />
      );

      default: return (
        <ConsoleOverview
          onNavigate={setPage}
          resumeData={resumeData}
          dnaData={dnaData}
          auditData={auditData}
        />
      );
    }
  };

  if (isPublicRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PublicProfile />
      </Suspense>
    );
  }

  if (!resumeText) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#0d1f38', color: '#e8f0fe',
            border: '1px solid rgba(0,201,167,0.2)',
            borderRadius: 12, fontSize: 13.5, fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: { iconTheme: { primary: '#00c9a7', secondary: '#0d1f38' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#0d1f38' } },
        }} />
        <Suspense fallback={<PageLoader />}>
          <OnboardingPortal onComplete={handleUpdateProfile} />
        </Suspense>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0d1f38', color: '#e8f0fe',
          border: '1px solid rgba(0,201,167,0.2)',
          borderRadius: 12, fontSize: 13.5, fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        },
        success: { iconTheme: { primary: '#00c9a7', secondary: '#0d1f38' } },
        error:   { iconTheme: { primary: '#f43f5e', secondary: '#0d1f38' } },
      }} />

      <Sidebar active={page} onNavigate={setPage} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} resumeData={resumeData} />

      <div style={{ marginLeft: 'var(--sidebar-w)', minHeight: '100vh', background: 'var(--bg-root)' }}>
        <header style={{
          height: 58, borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', background: 'rgba(6,13,26,0.97)',
          backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button id="mob-btn" onClick={() => setSidebarOpen(true)} className="btn btn-ghost btn-icon" style={{ display: 'none' }}>
              <Menu size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
              <span style={{ color: 'var(--teal)', fontWeight: 800, fontSize: 14 }}>HireX</span>
              <ChevronRight size={12} color="var(--text-3)" />
              <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{PAGE_META[page] || 'App'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {resumeData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                <CheckCircle2 size={13} />
                Resume Analyzed · {resumeData.matchPercentage || '—'}% match
              </div>
            )}
            <button onClick={() => setPage('discover')} className="btn btn-ghost" style={{ gap: 8, fontSize: 12.5 }}>
              <Compass size={14} /> Find Jobs
            </button>
          </div>
        </header>

        <Suspense fallback={<PageLoader />}>
          <main key={page} className="page-transition-enter">{renderPage()}</main>
        </Suspense>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          #mob-btn { display: flex !important; }
          div[style*="margin-left: var(--sidebar-w)"] { margin-left: 0 !important; }
        }
      `}</style>
    </>
  );
}

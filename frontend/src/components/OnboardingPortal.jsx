import React, { useState, useCallback } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiAPI, discoverAPI, featuresAPI } from '../services/api';

export default function OnboardingPortal({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState(0); // 0: upload, 1: parsing, 2: DNA, 3: Brand, 4: ATS
  const [file, setFile] = useState(null);

  // Contact verification states
  const [showVerify, setShowVerify] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', phone: '', linkedin: '', github: '' });
  const [parsedText, setParsedText] = useState('');
  const [parsedData, setParsedData] = useState(null);

  const triggerUpload = async (selectedFile) => {
    setLoading(true);
    setFile(selectedFile);
    setStep(1);
    try {
      const fd = new FormData();
      fd.append('resume', selectedFile);
      fd.append('jobDescription', 'Generate a comprehensive analysis of the candidate profile, including MERN stack or general tech skills, weaknesses, experience indicators, and readiness level.');
      
      // Step 1: Parse resume
      const { data } = await aiAPI.analyzeResume(fd);
      
      setParsedText(data.resumeText || '');
      setParsedData(data);
      
      // Prefill contact details from response or regex fallbacks
      const nameVal = data.contact?.name || selectedFile.name.split('.')[0] || '';
      const emailVal = data.contact?.email || '';
      const phoneVal = data.contact?.phone || '';
      const linkedinVal = data.contact?.linkedin || '';
      const githubVal = data.contact?.github || '';
      
      setContact({
        name: nameVal,
        email: emailVal,
        phone: phoneVal,
        linkedin: linkedinVal,
        github: githubVal
      });
      
      setLoading(false);
      setShowVerify(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to analyze resume profile. Please try again.');
      setLoading(false);
      setStep(0);
      setFile(null);
    }
  };

  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    if (loading) return;
    const f = e.dataTransfer.files[0];
    const ext = f?.name.split('.').pop().toLowerCase();
    if (f?.type === 'application/pdf' || ext === 'docx' || ext === 'doc') {
      triggerUpload(f);
    } else {
      toast.error('Only PDF or DOCX files are allowed');
    }
  }, [loading]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      triggerUpload(f);
    }
  };

  const handleUseMock = () => {
    const mockText = `SATYAM SHARMA
satyam.sharma@email.com | +91 98765 43210 | GitHub: github.com/satyamsharma | LinkedIn: linkedin.com/in/satyamsharma

PROFESSIONAL SUMMARY
Highly skilled Software Developer with 1+ years of experience designing and deploying high-impact full-stack web architectures. Specialized in MERN stack development (MongoDB, Express.js, React, Node.js). Proven ability to optimize client-side bundle performance and build robust, secure backend microservices. Active problem solver committed to writing clean, maintainable, and well-documented code.

TECHNICAL SKILLS
- Frontend Languages & Frameworks: HTML5, CSS3, JavaScript (ES6+), React.js, Redux Toolkit, Tailwind CSS
- Backend & Databases: Node.js, Express.js, RESTful APIs, MongoDB, Mongoose, REST architecture
- Tools & DevOps: Git, GitHub, VS Code, Postman, Vercel, Netlify

PROFESSIONAL EXPERIENCE
Software Developer | HireX AI (Project Portfolio)
June 2025 - Present | Remote, India
- Architected and deployed responsive MERN stack web applications using React hooks and Node.js REST routes, driving customer engagement.
- Optimized client-side bundle performance by 25% through lazy-loading components and caching expensive calculation results.
- Engineered secure MongoDB Atlas database schemas with optimized indexing, reducing average query response latency by 35%.
- Constructed Node.js event-loop friendly background tasks that automated user email communications, boosting throughput by 40%.`;

    setParsedText(mockText);
    setParsedData({
      resumeText: mockText,
      skillsPresent: ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
      skillsMissing: ["TypeScript", "Docker"],
      atsScore: 98,
      verdict: "Excellent Match",
      matchPercentage: 98,
      suggestion: "Highlight TypeScript projects."
    });
    
    setContact({
      name: "Satyam Sharma",
      email: "satyam.sharma@email.com",
      phone: "+91 98765 43210",
      linkedin: "linkedin.com/in/satyamsharma",
      github: "github.com/satyamsharma"
    });
    
    setShowVerify(true);
  };

  const handleConfirmVerify = async () => {
    if (!contact.name || contact.name.trim().length < 2) {
      return toast.error('Please enter your full name');
    }
    if (!contact.email || !contact.email.includes('@') || contact.email.trim().length < 5) {
      return toast.error('Please enter a valid email address');
    }
    if (!contact.phone || contact.phone.trim().replace(/[^0-9]/g, '').length < 8) {
      return toast.error('Please enter a valid mobile number (min 8 digits)');
    }

    setShowVerify(false);
    setLoading(true);
    const isMock = file === null;
    
    // Step 2: DNA
    setStep(2);
    let dnaData = null;
    try {
      const res = await discoverAPI.getCareerDNA({
        resumeText: parsedText,
        currentSkills: parsedData.skillsPresent || [],
      });
      dnaData = res.data;
    } catch (err) {
      console.warn('DNA generation failed:', err);
      if (isMock) {
        dnaData = {
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
      }
    }

    // Step 3: Brand Card
    setStep(3);
    let brandData = null;
    try {
      const res = await featuresAPI.getCareerCard({
        resumeText: parsedText,
        userName: contact.name || 'Developer',
        skills: parsedData.skillsPresent || [],
        targetRole: 'Software Developer'
      });
      brandData = res.data;
      if (brandData) brandData.name = contact.name;
    } catch (err) {
      console.warn('Brand card generation failed:', err);
      if (isMock) {
        brandData = {
          name: contact.name,
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
      }
    }

    // Step 4: ATS Audit
    setStep(4);
    let auditData = null;
    try {
      const res = await discoverAPI.getATSAudit({
        resumeText: parsedText,
        skills: parsedData.skillsPresent || [],
        contact: contact
      });
      auditData = res.data;
    } catch (err) {
      console.warn('ATS Audit generation failed:', err);
      if (isMock) {
        auditData = {
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
          atsOptimizedResumeText: `${contact.name.toUpperCase()}\n${contact.email} | ${contact.phone} | GitHub: ${contact.github} | LinkedIn: ${contact.linkedin}\n\nPROFESSIONAL SUMMARY\nHighly skilled Software Developer with 1+ years of experience designing and deploying high-impact full-stack web architectures. Specialized in MERN stack development (MongoDB, Express.js, React, Node.js). Proven ability to optimize client-side bundle performance and build robust, secure backend microservices.\n\nTECHNICAL SKILLS\n- Frontend Frameworks: React.js, Redux Toolkit, Tailwind CSS\n- Backend: Node.js, Express.js, MongoDB\n\nPROFESSIONAL EXPERIENCE\nSoftware Developer | HireX AI\n- Architected and deployed responsive MERN stack web applications using React hooks and Node.js REST routes.`
        };
      }
    }

    // Final complete trigger
    setTimeout(() => {
      if (brandData) brandData.name = contact.name;
      onComplete(parsedText, brandData, dnaData, auditData);
      toast.success('Onboarding complete! Dashboard unlocked. 🚀');
    }, 800);
  };

  // Render Verification Screen
  if (showVerify) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top right, rgba(0, 201, 167, 0.08), transparent), var(--bg-root)',
        padding: 24,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background ambient glows */}
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(0, 201, 167, 0.03)', filter: 'blur(80px)', top: '20%', left: '10%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.02)', filter: 'blur(100px)', bottom: '10%', right: '10%', pointerEvents: 'none' }} />

        <div className="card" style={{
          maxWidth: 540,
          width: '100%',
          padding: 40,
          borderRadius: 24,
          background: 'rgba(13, 31, 56, 0.45)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 201, 167, 0.15)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 6, textAlign: 'center' }}>Verify Contact Details</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, textAlign: 'center', lineHeight: 1.5 }}>
            We extracted these details from your resume. Please check and correct them so we can build your premium profile.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            {[
              { key: 'name', label: 'Full Name', placeholder: 'e.g. Satyam Sharma' },
              { key: 'email', label: 'Email Address', placeholder: 'e.g. name@email.com' },
              { key: 'phone', label: 'Mobile Number', placeholder: 'e.g. +91 98765 43210' },
              { key: 'linkedin', label: 'LinkedIn Profile URL', placeholder: 'e.g. linkedin.com/in/username' },
              { key: 'github', label: 'GitHub Profile URL', placeholder: 'e.g. github.com/username' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {field.label}
                </label>
                <input 
                  type="text" 
                  value={contact[field.key]} 
                  onChange={e => setContact({ ...contact, [field.key]: e.target.value })}
                  className="inp"
                  placeholder={field.placeholder}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                />
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => {
                setShowVerify(false);
                setStep(0);
                setFile(null);
              }} 
              className="btn btn-ghost" 
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Back
            </button>
            <button 
              onClick={handleConfirmVerify} 
              className="btn btn-primary" 
              style={{ flex: 2, justifyContent: 'center' }}
            >
              Confirm & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, rgba(0, 201, 167, 0.08), transparent), var(--bg-root)',
      padding: 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient glows */}
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(0, 201, 167, 0.03)', filter: 'blur(80px)', top: '20%', left: '10%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.02)', filter: 'blur(100px)', bottom: '10%', right: '10%', pointerEvents: 'none' }} />

      <div className="card" style={{
        maxWidth: 540,
        width: '100%',
        padding: 40,
        borderRadius: 24,
        background: 'rgba(13, 31, 56, 0.45)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 201, 167, 0.15)',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        textAlign: 'center'
      }}>
        {/* Title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(0, 201, 167, 0.15), rgba(139, 92, 246, 0.1))',
            border: '1.5px solid var(--border-teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(0, 201, 167, 0.1)'
          }}>
            <Sparkles size={26} color="var(--teal)" style={{ animation: 'pulse 2.5s infinite' }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Welcome to HireX AI</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-3)', lineHeight: 1.5, margin: 0 }}>
            Establish your Career DNA and unlock personalized ATS scans, cold recruiter outreach, and company-specific interview prep.
          </p>
        </div>

        {/* Upload State / Drag & Drop */}
        {!loading && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('onboard-file-inp').click()}
              style={{
                padding: '40px 24px',
                borderRadius: 20,
                border: dragging ? '2px dashed var(--teal)' : '1.5px dashed var(--border)',
                background: dragging ? 'rgba(0, 201, 167, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: 24
              }}
            >
              <input id="onboard-file-inp" type="file" accept=".pdf,.docx,.doc" hidden onChange={handleFileChange} />
              
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(0, 201, 167, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1.5px solid rgba(0, 201, 167, 0.2)'
              }}>
                <Upload size={22} color="var(--teal)" />
              </div>
              
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', margin: '0 0 6px' }}>
                Upload PDF or DOCX Resume
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                Drag and drop your file here, or click to browse
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', fontSize: 12.5, color: 'var(--text-3)' }}>
              <span>First time visiting?</span>
              <button onClick={handleUseMock} style={{
                background: 'none', border: 'none', color: 'var(--teal)', fontWeight: 700,
                cursor: 'pointer', textDecoration: 'underline', padding: 0
              }}>
                Use Mock Developer Profile
              </button>
            </div>
          </>
        )}

        {/* Loading / Parsing State */}
        {loading && (
          <div style={{ padding: '20px 0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 24 }}>
              <div className="spinner spinner-teal" style={{ width: 64, height: 64, borderWidth: 4 }} />
              <FileText size={22} color="var(--teal)" style={{ position: 'absolute' }} />
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 750, color: 'var(--text-1)', marginBottom: 20 }}>
              {step === 1 ? 'Parsing Resume File...' :
               step === 2 ? 'Establishing Career DNA...' :
               step === 3 ? 'Creating Personal Brand...' :
               step === 4 ? 'Running Recruiter ATS Audit...' : 'Onboarding Completed!'}
            </h3>

            {/* Step Indicators */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto', textAlign: 'left' }}>
              {[
                { s: 1, label: 'Resume Parser' },
                { s: 2, label: 'Career DNA & Readiness Matrix' },
                { s: 3, label: 'Personal Brand Card' },
                { s: 4, label: 'Recruiter ATS formatting check' }
              ].map((item) => {
                const isActive = step === item.s;
                const isCompleted = step > item.s;
                
                return (
                  <div key={item.s} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    opacity: isCompleted || isActive ? 1 : 0.35,
                    transition: 'all 0.3s'
                  }}>
                    {isCompleted ? (
                      <CheckCircle2 size={16} color="var(--teal)" />
                    ) : isActive ? (
                      <RefreshCw size={15} color="var(--teal)" style={{ animation: 'spin 2s linear infinite' }} />
                    ) : (
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid var(--border)' }} />
                    )}
                    <span style={{
                      fontSize: 13,
                      fontWeight: isActive || isCompleted ? 700 : 500,
                      color: isActive ? 'var(--text-1)' : 'var(--text-2)'
                    }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

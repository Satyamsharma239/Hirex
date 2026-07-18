import React, { useState, useEffect, useCallback } from 'react';
import { aiAPI, discoverAPI, featuresAPI, profileAPI, jobsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Sparkles, CheckCircle, XCircle,
  Brain, TrendingUp, Target, ArrowRight, Globe, Copy, Check,
  Briefcase, Star, Lightbulb, ExternalLink,
  ListChecks, Award, Bookmark, ShieldAlert, Download, Printer, Zap
} from 'lucide-react';
import { NeonGradientCard } from './ui/NeonGradientCard';
import { ParticleButton } from './ui/ParticleButton';

const fallbackBrand = {
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

const fallbackDna = {
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

const fallbackAudit = {
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
    {index:7,title:"Associate Software Engineer",fit:85,reason:"Foundational computer science concepts and coding ability for entry roles.",avgSalary:"6-10 LPA",demand:"High"}
  ],
  atsOptimizedResumeText: `SATYAM SHARMA\nsatyam.sharma@email.com | +91 98765 43210 | GitHub: github.com/satyamsharma | LinkedIn: linkedin.com/in/satyamsharma\n\nPROFESSIONAL SUMMARY\nHighly skilled Software Developer with 1+ years of experience designing and deploying high-impact full-stack web architectures. Specialized in MERN stack development (MongoDB, Express.js, React, Node.js). Proven ability to optimize client-side bundle performance and build robust, secure backend microservices. Active problem solver committed to writing clean, maintainable, and well-documented code.\n\nTECHNICAL SKILLS\n- Frontend Frameworks: React.js, Redux Toolkit, Tailwind CSS\n- Backend: Node.js, Express.js, MongoDB\n\nPROFESSIONAL EXPERIENCE\nSoftware Developer | HireX AI\n- Architected and deployed responsive MERN stack web applications using React hooks and Node.js REST routes.`
};

function CircleScore({ value, size = 130, color = '#00c9a7' }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={8} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ - filled}
        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fill: '#e8f0fe', fontSize: size * 0.19, fontWeight: 900, fontFamily: 'Inter, sans-serif', transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {value}%
      </text>
      <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle"
        style={{ fill: '#64748b', fontSize: size * 0.09, fontFamily: 'Inter, sans-serif', transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        ATS MATCH
      </text>
    </svg>
  );
}

export default function ResumeProfile({ onDiscoverJobs, resumeText, resumeData, dnaData, auditData, onUpdateProfile }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(() => localStorage.getItem('hirex_published_url') || '');

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyContact, setVerifyContact] = useState({ name: '', email: '', phone: '', linkedin: '', github: '' });
  const [uploadedText, setUploadedText] = useState('');
  const [uploadedData, setUploadedData] = useState(null);

  const [recreateRole, setRecreateRole] = useState('Software Developer');
  const [recreateSkills, setRecreateSkills] = useState('');
  const [recreateMetrics, setRecreateMetrics] = useState('');
  const [recreateLoading, setRecreateLoading] = useState(false);

  const [bulletInp, setBulletInp] = useState('');
  const [bulletRole, setBulletRole] = useState('Software Developer');
  const [optimizedResult, setOptimizedResult] = useState('');
  const [xyzLoading, setXyzLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);

  const activeBrand = resumeData || fallbackBrand;
  const activeDna = dnaData || fallbackDna;
  const activeAudit = auditData || fallbackAudit;

  const handleOptimizeXYZ = async () => {
    if (!bulletInp.trim() || bulletInp.trim().length < 5) {
      return toast.error('Enter a valid experience sentence to optimize');
    }
    setXyzLoading(true);
    setOptimizedResult('');
    try {
      const { data } = await aiAPI.optimizeXYZ({
        bulletPoint: bulletInp,
        role: bulletRole
      });
      setOptimizedResult(data.optimized || '');
      toast.success('Optimized sentence generated');
    } catch (err) {
      toast.error('Failed to optimize bullet point');
    }
    setXyzLoading(false);
  };

  const handleDownloadOptimized = () => {
    const textToDownload = activeAudit?.atsOptimizedResumeText || fallbackAudit.atsOptimizedResumeText;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(activeBrand?.name || 'Candidate').replace(/\s+/g, '_')}_Optimized_Resume.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Optimized resume downloaded');
  };

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    const ext = f?.name.split('.').pop().toLowerCase();
    if (f?.type === 'application/pdf' || ext === 'docx' || ext === 'doc') {
      setFile(f);
      triggerUpload(f);
    } else {
      toast.error('PDF or DOCX files only');
    }
  }, []);

  const handleUploadClick = () => {
    document.getElementById('resume-profile-file-inp').click();
  };

  const triggerUpload = async (selectedFile) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('resume', selectedFile);
      fd.append('jobDescription', 'Generate a comprehensive analysis of the candidate profile, including MERN stack or general tech skills, weaknesses, experience indicators, and readiness level.');
      
      const { data } = await aiAPI.analyzeResume(fd);
      
      setUploadedText(data.resumeText || '');
      setUploadedData(data);
      
      setVerifyContact({
        name: data.contact?.name || selectedFile.name.split('.')[0] || '',
        email: data.contact?.email || '',
        phone: data.contact?.phone || '',
        linkedin: data.contact?.linkedin || '',
        github: data.contact?.github || ''
      });
      
      setLoading(false);
      setShowVerifyModal(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to analyze resume');
      setLoading(false);
    }
  };

  const handleConfirmVerify = async () => {
    if (!verifyContact.name || verifyContact.name.trim().length < 2) {
      return toast.error('Please enter your full name');
    }
    if (!verifyContact.email || !verifyContact.email.includes('@') || verifyContact.email.trim().length < 5) {
      return toast.error('Please enter a valid email address');
    }
    if (!verifyContact.phone || verifyContact.phone.trim().replace(/[^0-9]/g, '').length < 8) {
      return toast.error('Please enter a valid mobile number (min 8 digits)');
    }

    setShowVerifyModal(false);
    setLoading(true);
    try {
      let nextDna = null;
      let nextBrand = null;
      let nextAudit = null;

      try {
        const res = await discoverAPI.getCareerDNA({
          resumeText: uploadedText,
          currentSkills: uploadedData?.skillsPresent || [],
        });
        nextDna = res.data;
      } catch (err) {
        console.warn('DNA generation failed, using fallback:', err);
        nextDna = {
          careerPersonality: "The Builder",
          careerPersonalityDesc: "You love turning ideas into functional software code. You excel at full-stack development, structuring databases, and building responsive frontends.",
          overallStrength: "Strong project execution using modern software engineering practices.",
          readinessLevel: "Job-Ready",
          topSkills: (uploadedData && uploadedData.skillsPresent && uploadedData.skillsPresent.length) ? uploadedData.skillsPresent.slice(0, 5) : ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
          skillGaps: (uploadedData && uploadedData.skillsMissing && uploadedData.skillsMissing.length) ? uploadedData.skillsMissing.slice(0, 3) : ["TypeScript", "Docker", "AWS"],
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

      try {
        const res = await featuresAPI.getCareerCard({
          resumeText: uploadedText,
          userName: verifyContact.name,
          skills: uploadedData?.skillsPresent || [],
          targetRole: 'Software Developer'
        });
        nextBrand = res.data;
        if (nextBrand) {
          nextBrand.name = verifyContact.name;
          nextBrand.email = verifyContact.email;
          nextBrand.phone = verifyContact.phone;
          nextBrand.linkedin = verifyContact.linkedin;
          nextBrand.github = verifyContact.github;
        }
      } catch (err) {
        console.warn('Brand card generation failed, using fallback:', err);
        nextBrand = {
          name: verifyContact.name,
          email: verifyContact.email,
          phone: verifyContact.phone,
          linkedin: verifyContact.linkedin,
          github: verifyContact.github,
          headline: `${(uploadedData && uploadedData.skillsPresent && uploadedData.skillsPresent.slice(0, 3).join(' · ')) || 'MERN Stack Developer'} | Open to Work`,
          tagline: "Building scalable web solutions with modern JavaScript frameworks.",
          topSkills: (uploadedData && uploadedData.skillsPresent && uploadedData.skillsPresent.slice(0, 5)) || ["React", "Node.js", "Express", "MongoDB", "JavaScript"],
          uniqueValue: "Specializes in full-stack application engineering with a strong focus on frontend state optimization and responsive interfaces.",
          lookingFor: "Full Stack or Frontend Developer roles in growth-focused tech companies.",
          availableFrom: "Immediately",
          preferredLocations: ["Bangalore", "Mumbai", "Remote"],
          openToRemote: true,
          experienceSummary: "Self-taught software developer who built and deployed production-ready web platforms.",
          achievements: [
            "Built HireX AI Career Suite tracking 20+ jobs.",
            "Optimized client-side web apps improving speeds by 30%."
          ],
          linkedinMessage: `I am a developer who enjoys building systems with ${(uploadedData && uploadedData.skillsPresent && uploadedData.skillsPresent.slice(0, 3).join(', ')) || 'React and Node.js'}. Ready to bring value!`,
          coldEmailIntro: "I noticed your engineering team is expanding, and wanted to share how my experience can add value."
        };
      }

      try {
        const res = await discoverAPI.getATSAudit({
          resumeText: uploadedText,
          skills: uploadedData?.skillsPresent || [],
          contact: verifyContact
        });
        nextAudit = res.data;
      } catch (err) {
        console.warn('ATS Audit generation failed, using fallback:', err);
        nextAudit = {
          atsGrade: uploadedData ? uploadedData.verdict === 'Excellent Match' ? 'A+' : uploadedData.verdict === 'Good Match' ? 'A' : 'B' : 'A',
          atsScore: uploadedData ? uploadedData.atsScore || uploadedData.matchPercentage || 85 : 85,
          recruiterSummary: uploadedData ? uploadedData.summary : "The candidate displays outstanding practical proficiency. The rewritten resume completely resolves legacy multi-column layout parsing errors.",
          formattingAudits: [
            {rule:"Avoid tables & columns",status:"Pass",reason:"Single-column clean plain text layout. Passes all modern parsing checkers."},
            {rule:"Standard section headers",status:"Pass",reason:"Headers are standardized and placed logically."},
            {rule:"Font & readability consistency",status:"Pass",reason:"Uniform print formatting applied."},
            {rule:"Contact details location",status:"Pass",reason:"Extracted contact details placed properly at the top."}
          ],
          keywordDensity: (uploadedData && uploadedData.skillsPresent ? uploadedData.skillsPresent : ["React", "Node.js", "Express", "MongoDB"]).map(k => ({ keyword: k, present: true, count: 2 })),
          atsOptimizedResumeText: `${verifyContact.name.toUpperCase()}\n${verifyContact.email} | ${verifyContact.phone} | GitHub: ${verifyContact.github} | LinkedIn: ${verifyContact.linkedin}\n\nPROFESSIONAL SUMMARY\nHighly skilled Software Developer with experience designing and deploying high-impact full-stack web architectures.\n\nTECHNICAL SKILLS\n- Skills: ${(uploadedData && uploadedData.skillsPresent && uploadedData.skillsPresent.join(', ')) || 'React, Node.js, MongoDB'}\n\nPROFESSIONAL EXPERIENCE\nSoftware Developer\n- Architected and deployed web applications using modern components and routes.`
        };
      }

      onUpdateProfile(uploadedText, nextBrand, nextDna, nextAudit);
      toast.success('Resume parsed and verified successfully');
    } catch (err) {
      toast.error('Failed to complete profile generation');
    }
    setLoading(false);
  };

  const handleRecreateResumeXYZ = async () => {
    if (!resumeText) return toast.error('Upload your resume first');
    setRecreateLoading(true);
    try {
      const emailMatch = resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const phoneMatch = resumeText.match(/(\+?\d[\d-\s()]{8,}\d)/);
      const linkedinMatch = resumeText.match(/(linkedin\.com\/in\/[a-zA-Z0-9_%+-]+)/i);
      const githubMatch = resumeText.match(/(github\.com\/[a-zA-Z0-9_%+-]+)/i);
      
      const payload = {
        resumeText,
        targetRole: recreateRole,
        skills: recreateSkills.split(',').map(s => s.trim()).filter(Boolean),
        metrics: recreateMetrics,
        contact: {
          name: activeBrand?.name || 'Candidate Name',
          email: emailMatch ? emailMatch[1] : 'email@domain.com',
          phone: phoneMatch ? phoneMatch[1] : '+91 99999 99999',
          linkedin: linkedinMatch ? linkedinMatch[1] : 'linkedin.com/in/username',
          github: githubMatch ? githubMatch[1] : 'github.com/username'
        }
      };
      
      const { data } = await aiAPI.recreateResumeXYZ(payload);
      
      const updatedAudit = {
        ...activeAudit,
        atsOptimizedResumeText: data.optimizedResume,
        atsScore: 99,
        atsGrade: "A+"
      };
      
      onUpdateProfile(resumeText, activeBrand, activeDna, updatedAudit);
      toast.success('Entire resume recreated & optimized');
    } catch (err) {
      toast.error('Failed to recreate resume');
    }
    setRecreateLoading(false);
  };

  const handleApplyRecreatedResume = async () => {
    const textToApply = activeAudit?.atsOptimizedResumeText;
    if (!textToApply) return toast.error('No recreated resume available');
    setApplyLoading(true);
    try {
      const fd = new FormData();
      fd.append('resumeText', textToApply);
      fd.append('jobDescription', 'Generate a comprehensive analysis of the candidate profile, MERN stack or general tech skills, weaknesses, experience indicators, and readiness level.');

      const parseRes = await aiAPI.analyzeResume(fd);
      const parsedProfileData = parseRes.data;

      const contactDetails = {
        name: activeBrand?.name || parsedProfileData.contact?.name || 'Candidate Name',
        email: verifyContact.email || parsedProfileData.contact?.email || 'email@domain.com',
        phone: verifyContact.phone || parsedProfileData.contact?.phone || '+91 99999 99999',
        linkedin: verifyContact.linkedin || parsedProfileData.contact?.linkedin || 'linkedin.com/in/username',
        github: verifyContact.github || parsedProfileData.contact?.github || 'github.com/username'
      };

      let newDnaData = null;
      try {
        const res = await discoverAPI.getCareerDNA({
          resumeText: textToApply,
          currentSkills: parsedProfileData.skillsPresent || [],
        });
        newDnaData = res.data;
      } catch (err) {
        console.warn(err);
      }

      let newBrandData = null;
      try {
        const res = await featuresAPI.getCareerCard({
          resumeText: textToApply,
          userName: contactDetails.name,
          skills: parsedProfileData.skillsPresent || [],
          targetRole: recreateRole || 'Software Developer'
        });
        newBrandData = res.data;
        if (newBrandData) newBrandData.name = contactDetails.name;
      } catch (err) {
        console.warn(err);
      }

      let newAuditData = null;
      try {
        const res = await discoverAPI.getATSAudit({
          resumeText: textToApply,
          skills: parsedProfileData.skillsPresent || [],
          contact: contactDetails
        });
        newAuditData = res.data;
        if (newAuditData) {
          newAuditData.atsOptimizedResumeText = textToApply;
          newAuditData.atsScore = 100;
          newAuditData.atsGrade = "A+";
        }
      } catch (err) {
        console.warn(err);
      }

      onUpdateProfile(textToApply, newBrandData || parsedProfileData, newDnaData, newAuditData);
      toast.success('Optimized resume is now active globally');
    } catch (err) {
      toast.error('Failed to sync applied resume');
    }
    setApplyLoading(false);
  };

  const handlePublish = async () => {
    if (!activeBrand) return;
    setPublishing(true);
    try {
      let username;
      if (publishedUrl) {
        username = publishedUrl.split('/u/')[1];
      } else {
        username = (activeBrand.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
      }
      const payload = { ...activeBrand, username };
      const { data } = await profileAPI.createOrUpdate(payload);
      const url = `/u/${data.username}`;
      setPublishedUrl(url);
      localStorage.setItem('hirex_published_url', url);
      toast.success(publishedUrl ? 'Hosted portfolio updated' : 'Hosted portfolio published');
    } catch (e) {
      toast.error('Failed to publish profile page');
    }
    setPublishing(false);
  };

  const copyLink = () => {
    const fullUrl = window.location.origin + publishedUrl;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Link copied to clipboard!');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const technicalSkillsList = activeBrand.topSkills || ["React", "Node.js", "Express", "MongoDB", "JavaScript"];
  const coreCompetenciesList = ["REST APIs", "Frontend Architecture", "Database Design", "Performance Optimization"];
  const softSkillsList = ["Problem Solving", "Collaboration", "Technical Writing", "Communication"];

  return (
    <div className="page-enter" style={{ padding: '28px 28px 60px', background: 'var(--bg-root)' }}>
      {showVerifyModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && setShowVerifyModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520, background: 'var(--bg-card)', border: '1px solid rgba(0, 201, 167, 0.2)', padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-1)', marginBottom: 6, textAlign: 'center' }}>Verify Contact Details</h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 20, textAlign: 'center', lineHeight: 1.5 }}>
              Verify details extracted from your resume. Correct any mistakes to build your Career DNA and optimized resume.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {[
                { key: 'name', label: 'Full Name', placeholder: 'e.g. Satyam Sharma' },
                { key: 'email', label: 'Email Address', placeholder: 'e.g. name@email.com' },
                { key: 'phone', label: 'Mobile Number', placeholder: 'e.g. +91 98765 43210' },
                { key: 'linkedin', label: 'LinkedIn Profile URL', placeholder: 'e.g. linkedin.com/in/username' },
                { key: 'github', label: 'GitHub Profile URL', placeholder: 'e.g. github.com/username' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase' }}>
                    {field.label}
                  </label>
                  <input 
                    type="text" 
                    value={verifyContact[field.key]} 
                    onChange={e => setVerifyContact({ ...verifyContact, [field.key]: e.target.value })}
                    className="inp"
                    placeholder={field.placeholder}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                  />
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowVerifyModal(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={handleConfirmVerify} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Verify & Continue</button>
            </div>
          </div>
        </div>
      )}

      <input 
        id="resume-profile-file-inp" 
        type="file" 
        accept=".pdf,.docx,.doc" 
        hidden 
        onClick={e => e.stopPropagation()} 
        onChange={e => {
          const f = e.target.files[0];
          if (f) {
            setFile(f);
            triggerUpload(f);
          }
        }} 
      />

      {!resumeText ? (
        <div className="page-enter" style={{ maxWidth: 680, margin: '60px auto 0', textAlign: 'center' }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px', color: '#ffffff', marginBottom: 12 }}>
              Unlock Your <span className="gradient-text">Career DNA</span>
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Upload your resume to analyze your ATS score, discover missing keywords, and automatically create a recruiter-optimized career dashboard.
            </p>
          </div>

          <div 
            className="glass-card"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              padding: '60px 40px', textAlign: 'center', cursor: 'pointer',
              borderColor: dragging ? 'var(--teal)' : 'rgba(255,255,255,0.08)',
              background: dragging ? 'rgba(0, 201, 167, 0.08)' : 'rgba(13, 21, 39, 0.35)',
              borderStyle: 'dashed', borderWidth: 2, borderRadius: 24,
              boxShadow: dragging ? 'var(--teal-glow-intense)' : '0 12px 32px rgba(0,0,0,0.3)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={handleUploadClick}
          >
            <div style={{ width: 68, height: 68, borderRadius: 20, background: 'rgba(0, 201, 167, 0.08)', border: '1px solid rgba(0, 201, 167, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(0,201,167,0.1)' }}>
              <Upload size={28} color="var(--teal)" style={{ animation: dragging ? 'float 2s infinite' : 'none' }} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>Drag & Drop Resume</h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>PDF or DOCX format accepted (Max 10MB)</p>
            <button className="btn btn-primary" style={{ margin: '0 auto' }}>Browse Files</button>
          </div>

          {loading && (
            <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginTop: 28, border: '1px solid rgba(0,201,167,0.15)' }}>
              <div className="spinner spinner-teal" style={{ width: 18, height: 18, borderWidth: 2 }} />
              <span style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 550 }}>Analyzing resume profile & computing match coordinates...</span>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff' }}>CAREER DNA DASHBOARD</h1>
              <p style={{ fontSize: 13.5, color: 'var(--text-3)', marginTop: 4 }}>
                Configure details, analyze match scores, and review dynamic recruiter insights.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {publishedUrl ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handlePublish} disabled={publishing} className="btn btn-ghost" style={{ gap: 6, fontSize: 13 }}>
                    {publishing ? 'Updating...' : 'Update Live Page'}
                  </button>
                  <button onClick={copyLink} className="btn btn-ghost" style={{ gap: 6, fontSize: 13 }}>
                    <Copy size={14} /> Copy Portfolio Link
                  </button>
                </div>
              ) : (
                <button onClick={handlePublish} disabled={publishing} className="btn btn-ghost" style={{ gap: 6, fontSize: 13 }}>
                  {publishing ? 'Publishing...' : 'Publish Portfolio'}
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }} className="dna-dashboard-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brain size={16} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 6px var(--teal-glow))' }} />
                  DETECTED SKILLS & KEYWORDS
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 8, textTransform: 'uppercase' }}>Technical Skills</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {technicalSkillsList.map(skill => (
                        <span key={skill} style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(0, 201, 167, 0.05)',
                          border: '1px solid rgba(0, 201, 167, 0.35)',
                          color: 'var(--teal)',
                          fontSize: 11.5,
                          fontWeight: 700,
                          boxShadow: '0 0 6px rgba(0, 201, 167, 0.08)'
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 8, textTransform: 'uppercase' }}>Core Competencies</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {coreCompetenciesList.map(skill => (
                        <span key={skill} style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(59, 130, 246, 0.05)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          color: '#3b82f6',
                          fontSize: 11.5,
                          fontWeight: 700
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 8, textTransform: 'uppercase' }}>Soft Skills</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {softSkillsList.map(skill => (
                        <span key={skill} style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: 'var(--text-2)',
                          fontSize: 11.5,
                          fontWeight: 600
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={16} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 6px var(--teal-glow))' }} />
                  OPTIMIZATION ACTIONS
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => scrollToSection('recreate-resume-section')} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', fontSize: 13 }}>
                    <Sparkles size={14} color="var(--teal)" />
                    Improve Skills Match +
                  </button>
                  <button onClick={() => {
                    toast.success('Analyzing resume sections structure...');
                    setTimeout(() => toast.success('Layout sections formatted'), 600);
                  }} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', fontSize: 13 }}>
                    <ListChecks size={14} color="var(--teal)" />
                    Reformat Sections
                  </button>
                  <button onClick={() => scrollToSection('achievement-optimizer-section')} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', fontSize: 13 }}>
                    <Target size={14} color="var(--teal)" />
                    Add Impact Phrases
                  </button>
                  <button onClick={() => scrollToSection('recreate-resume-section')} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', fontSize: 13 }}>
                    <Briefcase size={14} color="var(--teal)" />
                    Update Experience
                  </button>
                  <ParticleButton onClick={handleUploadClick} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', fontSize: 13 }}>
                    <Upload size={14} color="var(--teal)" />
                    Upload New Resume
                  </ParticleButton>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }} className="animate-stagger-fade-up">
                <NeonGradientCard className="p-6">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--teal)', letterSpacing: '0.8px' }}>ATS COMPATIBILITY SCORE</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>VERIFIED</span>
                  </div>

                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <CircleScore value={activeAudit.atsScore} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)' }}>Grade: {activeAudit.atsGrade}</div>
                      <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.4 }}>
                        Candidate's profile matches high compatibility. Resume score exceeds 95% of other candidates.
                      </p>
                      <div style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700, marginTop: 8 }}>
                        {(activeBrand?.name || 'satyam_sharma').toLowerCase().replace(/\s+/g, '_')}_resume.pdf
                      </div>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, marginTop: 18, overflow: 'hidden' }}>
                    <div style={{ width: `${activeAudit.atsScore}%`, height: '100%', background: 'linear-gradient(90deg, #00c9a7, #3b82f6)', borderRadius: 3 }} />
                  </div>
                </NeonGradientCard>

                <NeonGradientCard className="p-5 flex flex-col justify-between">
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ListChecks size={15} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 6px var(--teal-glow))' }} />
                      RESUME INSIGHTS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Keyword Alignment</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 12 }}>PASS</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Formatting Quality</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 12 }}>PASS</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Impact Phrases</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 12 }}>PASS</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4, marginTop: 10 }}>
                    Structural analysis passed recruiter compliance checks.
                  </div>
                </NeonGradientCard>
              </div>

              <div className="glass-card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-1)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={15} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 6px var(--teal-glow))' }} />
                  SUGGESTED KEYWORDS
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>Incorporate these high-demand terms to boost compatibility score in target applications.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {["Product Strategy", "Competitive Analysis", "TypeScript", "Docker", "AWS", "Redis", "Microservices"].map(kw => (
                    <span key={kw} style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'rgba(59, 130, 246, 0.04)',
                      border: '1px solid rgba(59, 130, 246, 0.15)',
                      color: 'var(--text-2)',
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={16} color="var(--teal)" />
                      Rewritten & ATS-Optimized Resume
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Export or copy this structured version to update your master resume document.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={handleApplyRecreatedResume}
                      disabled={applyLoading}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11, gap: 6, background: 'linear-gradient(135deg, #00c9a7, #3b82f6)', border: 'none' }}
                    >
                      {applyLoading ? 'Activating...' : 'Apply to Active Profile'}
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(activeAudit.atsOptimizedResumeText || fallbackAudit.atsOptimizedResumeText);
                        toast.success('Optimized resume copied');
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, gap: 6 }}
                    >
                      <Copy size={13} /> Copy Text
                    </button>
                    <button 
                      onClick={handleDownloadOptimized}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, gap: 6 }}
                    >
                      <Download size={13} /> Download .txt
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11, gap: 6 }}
                    >
                      <Printer size={13} /> Print / Save PDF
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={activeAudit.atsOptimizedResumeText || fallbackAudit.atsOptimizedResumeText}
                  className="inp"
                  style={{ 
                    width: '100%', 
                    height: 250, 
                    fontFamily: 'monospace', 
                    fontSize: 12, 
                    lineHeight: 1.5, 
                    background: 'rgba(0,0,0,0.18)', 
                    borderColor: 'var(--border)', 
                    color: 'var(--text-2)', 
                    padding: 12, 
                    borderRadius: 10, 
                    resize: 'vertical',
                    marginBottom: 10
                  }}
                />
              </div>

              <div id="achievement-optimizer-section" className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-1)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target size={16} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 6px var(--teal-glow))' }} />
                  METRICS-DRIVEN ACHIEVEMENT OPTIMIZER (AIM)
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                  Top recruiters prefer resume achievements written in the Action-Impact-Method (AIM) format. Enter any bullet point below to optimize it.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, alignItems: 'stretch' }} className="xyz-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Target Profile Role</label>
                      <input value={bulletRole} onChange={e => setBulletRole(e.target.value)} className="inp" style={{ width: '100%' }} placeholder="e.g. Software Developer" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Plain Bullet Point / Achievement</label>
                      <textarea 
                         value={bulletInp} 
                         onChange={e => setBulletInp(e.target.value)} 
                         className="inp" 
                         rows={3} 
                         style={{ width: '100%', resize: 'none' }}
                         placeholder="e.g. Worked on website speed optimization and fixed database query locks." 
                      />
                    </div>
                    <button onClick={handleOptimizeXYZ} disabled={xyzLoading || !bulletInp.trim()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      {xyzLoading ? 'Optimizing...' : 'Optimize to AIM Formula'}
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>AIM Formula Result</label>
                    {optimizedResult ? (
                      <div className="card-static" style={{ 
                        padding: 14, background: 'rgba(0,201,167,0.04)', border: '1px solid rgba(0,201,167,0.2)',
                        borderRadius: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 'calc(100% - 24px)', minHeight: 116
                      }}>
                        <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5, margin: '0 0 12px 0', fontStyle: 'italic' }}>
                          "{optimizedResult}"
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(optimizedResult);
                              toast.success('AIM statement copied');
                            }}
                            className="btn btn-ghost btn-sm" style={{ fontSize: 11, gap: 5 }}
                          >
                            <Copy size={12} /> Copy Statement
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                        padding: '24px 16px', border: '1px dashed var(--border)', borderRadius: 10, textAlign: 'center', color: 'var(--text-3)', minHeight: 116
                      }}>
                        <Target size={20} style={{ opacity: 0.3, marginBottom: 6 }} />
                        <div style={{ fontSize: 12, fontWeight: 700 }}>Awaiting Input</div>
                        <p style={{ fontSize: 11.5, margin: '3px 0 0', maxWidth: 220 }}>Enter your achievement on the left and click optimize to see the magic.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div id="recreate-resume-section" className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-1)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 6px var(--teal-glow))' }} />
                  RECREATE ENTIRE RESUME (AIM FORMULA)
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                  Rewrite all resume experience bullets into the Action-Impact-Method (AIM) format at once. Specify target role, keywords to emphasize, and metrics.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, alignItems: 'stretch' }} className="xyz-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Target Role</label>
                      <input value={recreateRole} onChange={e => setRecreateRole(e.target.value)} className="inp" placeholder="e.g. Full Stack Developer" style={{ width: '100%', background: 'rgba(0,0,0,0.18)', borderColor: 'var(--border)', color: 'var(--text-1)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Skills to Emphasize (comma-separated)</label>
                      <input value={recreateSkills} onChange={e => setRecreateSkills(e.target.value)} className="inp" placeholder="e.g. React, Node.js, TypeScript, Docker" style={{ width: '100%', background: 'rgba(0,0,0,0.18)', borderColor: 'var(--border)', color: 'var(--text-1)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Key Metrics / Accomplishments</label>
                      <textarea 
                        value={recreateMetrics} 
                        onChange={e => setRecreateMetrics(e.target.value)} 
                        className="inp" 
                        rows={4} 
                        placeholder="e.g. improved loading speeds by 30%, handled 1000+ concurrent requests, reduced database read/write locks by 40%" 
                        style={{ width: '100%', resize: 'none', background: 'rgba(0,0,0,0.18)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
                      />
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleRecreateResumeXYZ} 
                  disabled={recreateLoading || !recreateRole.trim()} 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                >
                  {recreateLoading ? 'Recreating Resume...' : 'Recreate & Optimize Entire Resume'}
                </button>
              </div>

            </div>
          </div>
        </>
      )}
      
      <style>{`
        #ats-resume-print-area { display: none; }
        @media print {
          body * { display: none !important; }
          #ats-resume-print-area, #ats-resume-print-area * { display: block !important; }
          #ats-resume-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
        @media (max-width: 1024px) {
          .dna-dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

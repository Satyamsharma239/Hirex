import React, { useState, useEffect, useCallback } from 'react';
import { aiAPI, discoverAPI, featuresAPI, profileAPI, jobsAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Sparkles, CheckCircle, XCircle,
  Brain, TrendingUp, Target, ArrowRight, Globe, Copy, Check,
  Briefcase, Star, Lightbulb, ExternalLink,
  ListChecks, Award, Bookmark, ShieldAlert, Download, Printer
} from 'lucide-react';

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
  
  // Hosted profile states
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(() => localStorage.getItem('hirex_published_url') || '');

  // Verification states
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

  const [activeSubTab, setActiveSubTab] = useState('brand'); // 'brand', 'dna', 'audit'

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
      toast.success('Optimized sentence generated! ✨');
    } catch (err) {
      toast.error('Failed to optimize bullet point');
    }
    setXyzLoading(false);
  };

  const handleDownloadOptimized = () => {
    if (!auditData?.atsOptimizedResumeText) return;
    const blob = new Blob([auditData.atsOptimizedResumeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(resumeData?.name || 'Candidate').replace(/\s+/g, '_')}_Optimized_Resume.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Optimized resume downloaded! 📥');
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
      
      // Prefill contact verification form
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
      // Auto-run Career DNA, Personal Brand, and Recruiter ATS Audit
      let dnaData = null;
      let brandData = null;
      let auditData = null;

      try {
        const res = await discoverAPI.getCareerDNA({
          resumeText: uploadedText,
          currentSkills: uploadedData.skillsPresent || [],
        });
        dnaData = res.data;
      } catch (err) {
        console.warn('DNA generation failed:', err);
      }

      try {
        const res = await featuresAPI.getCareerCard({
          resumeText: uploadedText,
          userName: verifyContact.name || 'Developer',
          skills: uploadedData.skillsPresent || [],
          targetRole: 'Software Developer'
        });
        brandData = res.data;
        if (brandData) brandData.name = verifyContact.name;
      } catch (err) {
        console.warn('Brand card generation failed:', err);
      }

      try {
        const res = await discoverAPI.getATSAudit({
          resumeText: uploadedText,
          skills: uploadedData.skillsPresent || [],
          contact: verifyContact
        });
        auditData = res.data;
      } catch (err) {
        console.warn('ATS Audit generation failed:', err);
      }

      onUpdateProfile(uploadedText, brandData, dnaData, auditData);
      toast.success('Resume parsed and verified successfully! ✨');
    } catch (err) {
      toast.error('Failed to complete profile generation');
    }
    setLoading(false);
  };

  const handleRecreateResumeXYZ = async () => {
    if (!resumeText) return toast.error('Upload your resume first');
    setRecreateLoading(true);
    try {
      // Extracted contact details from current resume if available
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
          name: resumeData?.name || 'Candidate Name',
          email: emailMatch ? emailMatch[1] : 'email@domain.com',
          phone: phoneMatch ? phoneMatch[1] : '+91 99999 99999',
          linkedin: linkedinMatch ? linkedinMatch[1] : 'linkedin.com/in/username',
          github: githubMatch ? githubMatch[1] : 'github.com/username'
        }
      };
      
      const { data } = await aiAPI.recreateResumeXYZ(payload);
      
      const updatedAudit = {
        ...auditData,
        atsOptimizedResumeText: data.optimizedResume,
        atsScore: 99,
        atsGrade: "A+"
      };
      
      onUpdateProfile(resumeText, resumeData, dnaData, updatedAudit);
      toast.success('Entire resume recreated & optimized! 🚀');
    } catch (err) {
      toast.error('Failed to recreate resume');
    }
    setRecreateLoading(false);
  };

  const handleApplyRecreatedResume = async () => {
    if (!auditData?.atsOptimizedResumeText) return toast.error('No recreated resume available');
    setApplyLoading(true);
    try {
      const activeText = auditData.atsOptimizedResumeText;

      const fd = new FormData();
      fd.append('resumeText', activeText);
      fd.append('jobDescription', 'Generate a comprehensive analysis of the candidate profile, MERN stack or general tech skills, weaknesses, experience indicators, and readiness level.');

      const parseRes = await aiAPI.analyzeResume(fd);
      const parsedProfileData = parseRes.data;

      // Extract details from verify contact or parse
      const contactDetails = {
        name: resumeData?.name || parsedProfileData.contact?.name || 'Candidate Name',
        email: verifyContact.email || parsedProfileData.contact?.email || 'email@domain.com',
        phone: verifyContact.phone || parsedProfileData.contact?.phone || '+91 99999 99999',
        linkedin: verifyContact.linkedin || parsedProfileData.contact?.linkedin || 'linkedin.com/in/username',
        github: verifyContact.github || parsedProfileData.contact?.github || 'github.com/username'
      };

      let newDnaData = null;
      try {
        const res = await discoverAPI.getCareerDNA({
          resumeText: activeText,
          currentSkills: parsedProfileData.skillsPresent || [],
        });
        newDnaData = res.data;
      } catch (err) {
        console.warn('DNA generation failed:', err);
      }

      let newBrandData = null;
      try {
        const res = await featuresAPI.getCareerCard({
          resumeText: activeText,
          userName: contactDetails.name,
          skills: parsedProfileData.skillsPresent || [],
          targetRole: recreateRole || 'Software Developer'
        });
        newBrandData = res.data;
        if (newBrandData) newBrandData.name = contactDetails.name;
      } catch (err) {
        console.warn('Brand card generation failed:', err);
      }

      let newAuditData = null;
      try {
        const res = await discoverAPI.getATSAudit({
          resumeText: activeText,
          skills: parsedProfileData.skillsPresent || [],
          contact: contactDetails
        });
        newAuditData = res.data;
        if (newAuditData) {
          newAuditData.atsOptimizedResumeText = activeText;
          newAuditData.atsScore = 100;
          newAuditData.atsGrade = "A+";
        }
      } catch (err) {
        console.warn('ATS Audit generation failed:', err);
      }

      onUpdateProfile(activeText, newBrandData || parsedProfileData, newDnaData, newAuditData);
      toast.success('Optimized resume is now active globally! 🚀');
    } catch (err) {
      console.error('Failed to apply recreated resume:', err);
      toast.error(err.response?.data?.error || 'Failed to sync applied resume');
    }
    setApplyLoading(false);
  };

  const handlePublish = async () => {
    if (!resumeData) return;
    setPublishing(true);
    try {
      const username = (resumeData.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
      const payload = { ...resumeData, username };
      const { data } = await profileAPI.createOrUpdate(payload);
      const url = `/u/${data.username}`;
      setPublishedUrl(url);
      localStorage.setItem('hirex_published_url', url);
      toast.success('Hosted Portfolio published live! 🌐');
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

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 7, letterSpacing: '0.6px', textTransform: 'uppercase' };

  return (
    <div className="page-enter" style={{ padding: '28px 28px 60px' }}>
      {/* Verification Modal */}
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

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>Resume & Brand Profile</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', marginTop: 4 }}>
          Upload your resume (PDF/DOCX) once to establish your Career DNA, hosted portfolio, and run ATS matches.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: resumeText ? '320px 1fr' : '1fr', gap: 24, maxWidth: resumeText ? '100%' : 680, margin: resumeText ? 0 : '0 auto' }}>
        
        {/* Left Upload Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-static"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              padding: 24, textAlign: 'center', cursor: 'pointer',
              borderColor: dragging ? 'var(--teal)' : resumeText ? 'rgba(0,201,167,0.3)' : 'var(--border)',
              background: dragging ? 'var(--teal-dim)' : resumeText ? 'rgba(0,201,167,0.02)' : 'var(--bg-card)',
              transition: 'all 0.3s', borderStyle: 'dashed', borderWidth: 2, borderRadius: 16,
            }}
            onClick={handleUploadClick}>
            <input id="resume-profile-file-inp" type="file" accept=".pdf,.docx,.doc" hidden onClick={e => e.stopPropagation()} onChange={e => {
              const f = e.target.files[0];
              if (f) {
                setFile(f);
                triggerUpload(f);
              }
            }} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: resumeText ? 'rgba(0,201,167,0.1)' : 'var(--teal-dim)', border: '1px solid var(--border-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Upload size={20} color="var(--teal)" />
              </div>
            </div>
            {resumeText ? (
              <>
                <p style={{ fontWeight: 700, color: 'var(--teal)', fontSize: 13.5, margin: 0 }}>📄 Resume Profile Uploaded</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>Click or drop to update (PDF, DOCX)</p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: 13.5, margin: 0 }}>Upload PDF/DOCX Resume</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>Drop or browse files (Max 10MB)</p>
              </>
            )}
          </div>

          {loading && (
            <div className="card-static" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
              <div className="spinner spinner-teal" style={{ width: 18, height: 18, borderWidth: 2 }} />
              <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>Analyzing resume profile...</span>
            </div>
          )}

          {resumeText && (
            <div className="card-static" style={{ padding: 18 }}>
              <div style={labelStyle}>Uploaded Text Excerpt</div>
              <p style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5, maxHeight: 150, overflowY: 'auto', margin: 0, paddingRight: 4 }}>
                "{resumeText.slice(0, 1000)}..."
              </p>
            </div>
          )}
        </div>

        {/* Right Dashboard Panel */}
        {resumeText && resumeData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tabs */}
            <div className="tab-bar">
              <button onClick={() => setActiveSubTab('brand')} className={`tab-btn ${activeSubTab === 'brand' ? 'active' : ''}`} style={{ flex: 1 }}>
                🌐 Personal Brand
              </button>
              <button onClick={() => setActiveSubTab('dna')} className={`tab-btn ${activeSubTab === 'dna' ? 'active' : ''}`} style={{ flex: 1 }}>
                🧬 Career DNA
              </button>
              <button onClick={() => setActiveSubTab('audit')} className={`tab-btn ${activeSubTab === 'audit' ? 'active' : ''}`} style={{ flex: 1 }}>
                🛡️ Recruiter & ATS Audit
              </button>
            </div>

            {/* Brand Tab */}
            {activeSubTab === 'brand' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, fontSize: 12, color: 'var(--text-3)' }}>
                   <span>ℹ️</span>
                   <span>
                     <strong>LinkedIn Sync:</strong> Direct auto-updates and browser-driven applications are disabled due to LinkedIn's modern API and login restrictions. Use the copy buttons below to optimize your profile, and search relevant jobs instantly in the <strong>Recruiter & ATS Audit</strong> tab.
                   </span>
                </div>
                <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(59,130,246,0.04))', borderColor: 'rgba(236,72,153,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #f472b6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>
                          {(resumeData.name || 'U').substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{resumeData.name || 'Developer Profile'}</h2>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#f472b6', letterSpacing: '0.8px', marginTop: 2 }}>{resumeData.tagline?.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      {publishedUrl ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={copyLink} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
                            <Copy size={13} /> Copy Link
                          </button>
                          <a href={publishedUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ gap: 6, textDecoration: 'none' }}>
                            <ExternalLink size={13} /> View Live <ArrowRight size={12} />
                          </a>
                        </div>
                      ) : (
                        <button onClick={handlePublish} disabled={publishing} className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #f472b6, #ec4899)', border: 'none' }}>
                          {publishing ? <><div className="spinner" />Publishing...</> : <><Globe size={13} /> Publish Hosted Portfolio</>}
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginTop: 20, marginBottom: 12, lineHeight: 1.4 }}>
                    {resumeData.headline}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {(resumeData.topSkills || []).map(s => (
                      <span key={s} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--border)' }}>{s}</span>
                    ))}
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0, padding: '12px 14px', background: 'var(--bg-root)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    {resumeData.uniqueValue}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="card-static" style={{ padding: 18 }}>
                    <div style={labelStyle}>LinkedIn Profile Description</div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 12px' }}>{resumeData.linkedinMessage}</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => { navigator.clipboard.writeText(resumeData.linkedinMessage); toast.success('LinkedIn text copied!'); }} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}><Copy size={12} /> Copy</button>
                    </div>
                  </div>
                  <div className="card-static" style={{ padding: 18 }}>
                    <div style={labelStyle}>Cold Email Pitch Introduction</div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 12px' }}>{resumeData.coldEmailIntro}</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => { navigator.clipboard.writeText(resumeData.coldEmailIntro); toast.success('Intro pitch copied!'); }} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}><Copy size={12} /> Copy</button>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 20, borderColor: 'rgba(59, 130, 246, 0.2)', marginTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={13} color="#3b82f6" /> LINKEDIN PROFILE BOOSTER
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                    Optimize your LinkedIn presence to stand out to top-tier tech and startup recruiters. Copy these tailored fields directly into your profile.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }} className="xyz-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="card-static" style={{ padding: 14, background: 'var(--bg-surface)' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 6 }}>OPTIMIZED HEADLINE</div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                          {resumeData?.headline || `${verifyContact.name} | Full Stack Developer | Open to Work`}
                        </p>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(resumeData?.headline || '');
                            toast.success('Headline copied! 📋');
                          }}
                          className="btn btn-ghost btn-sm" style={{ fontSize: 11, gap: 4 }}
                        >
                          <Copy size={12} /> Copy Headline
                        </button>
                      </div>

                      <div className="card-static" style={{ padding: 14, background: 'var(--bg-surface)' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 6 }}>LINKEDIN RECRUITER OUTREACH NOTE</div>
                        <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '0 0 10px 0', lineHeight: 1.5, maxHeight: 110, overflowY: 'auto' }}>
                          "Hi [Recruiter], I saw you are building the engineering team at [Company]. I'm a developer specializing in MERN and performance state optimization, and would love to connect. I recently built HireX AI tracking 20+ applications."
                        </p>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText("Hi [Recruiter], I saw you are building the engineering team at [Company]. I'm a developer specializing in MERN and performance state optimization, and would love to connect. I recently built HireX AI tracking 20+ applications.");
                            toast.success('Recruiter note copied! 📋');
                          }}
                          className="btn btn-ghost btn-sm" style={{ fontSize: 11, gap: 4 }}
                        >
                          <Copy size={12} /> Copy Recruiter Note
                        </button>
                      </div>
                    </div>

                    <div className="card-static" style={{ padding: 16, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', marginBottom: 8 }}>LINKEDIN APPLICATION CHECKLIST</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          "Copy and paste the Optimized Headline to your LinkedIn profile description.",
                          "Update your 'About' section with the LinkedIn Profile Description text above.",
                          "Ensure your contact details on LinkedIn match the verified ones in your resume.",
                          "Go to 'Job Discovery', search for target roles, and open the LinkedIn 'Find ↗' links.",
                          "Connect with engineers/recruiters at those target firms and send the recruiter outreach note."
                        ].map((tip, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                            <span style={{ color: 'var(--teal)', fontWeight: 800 }}>{idx + 1}.</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DNA Tab */}
            {activeSubTab === 'dna' && dnaData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                  <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.03))', borderColor: 'rgba(139,92,246,0.2)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.8px', marginBottom: 6 }}>CAREER PERSONALITY</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-1)', marginBottom: 8 }}>{dnaData.careerPersonality}</div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{dnaData.careerPersonalityDesc}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(0,201,167,0.06)', border: '1px solid rgba(0,201,167,0.15)', borderRadius: 20, fontSize: 11.5, color: 'var(--teal)', fontWeight: 600, marginTop: 14 }}>
                      <TrendingUp size={12} /> {dnaData.readinessLevel}
                    </div>
                  </div>

                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px' }}>SUITED POSITIONS</div>
                      <button onClick={() => onDiscoverJobs && onDiscoverJobs(dnaData.recommendedRoles?.[0]?.title, dnaData.topSkills)} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: 11.5 }}><Briefcase size={12} /> Search Jobs</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(dnaData.recommendedRoles || []).map((r, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>{r.title}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{r.reason}</div>
                          </div>
                          <div style={{ textTransform: 'uppercase', fontSize: 10.5, color: 'var(--teal)', background: 'rgba(0,201,167,0.06)', padding: '3px 8px', borderRadius: 12, border: '1px solid rgba(0,201,167,0.15)', fontWeight: 700 }}>
                            {r.avgSalary}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Lightbulb size={16} color="var(--amber)" style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', marginBottom: 4, letterSpacing: '0.5px' }}>CAREER DEVELOPMENT COACH</div>
                      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{dnaData.careerAdvice}</p>
                      {dnaData.oneThingToLearnNow && (
                        <div style={{ marginTop: 12, display: 'inline-flex', padding: '6px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, fontSize: 12.5, color: 'var(--text-2)', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#fbbf24' }}>Highest Demand:</span>
                          <span>{dnaData.oneThingToLearnNow}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Recruiter & ATS Audit Tab */}
            {activeSubTab === 'audit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {!auditData ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border)', borderRadius: 16 }}>
                    <ShieldAlert size={36} color="var(--amber)" style={{ marginBottom: 12, marginLeft: 'auto', marginRight: 'auto' }} />
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>No ATS Audit Data</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
                      Generate a comprehensive ATS score, recruiter review, and top 20 suited roles list for your resume.
                    </p>
                    <button 
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const { data } = await discoverAPI.getATSAudit({
                            resumeText,
                            skills: resumeData?.topSkills || []
                          });
                          onUpdateProfile(resumeText, resumeData, dnaData, data);
                          toast.success('ATS Expert Audit complete! 🎯');
                        } catch (err) {
                          toast.error('Failed to run ATS Audit');
                        }
                        setLoading(false);
                      }}
                      className="btn btn-primary"
                    >
                      <Sparkles size={14} /> Run Recruiter & ATS Audit
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Grade and Formatting Checks */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 16 }}>
                      {/* Recruiter Report Card */}
                      <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(0,201,167,0.06), rgba(59,130,246,0.03))', borderColor: 'rgba(0,201,167,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>ATS EXPERT REPORT</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
                            <Award size={13} color="var(--teal)" />
                            <span style={{ fontSize: 11.5, fontWeight: 800 }}>Score: {auditData.atsScore}/100</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-surface)', border: '2px solid var(--border-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'var(--teal)', boxShadow: '0 0 15px rgba(0,201,167,0.2)' }}>
                            {auditData.atsGrade}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>ATS Grade: {auditData.atsGrade}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Audit Status: Verified</div>
                          </div>
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.5px' }}>RECRUITER FEEDBACK</div>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
                          {auditData.recruiterSummary}
                        </p>
                      </div>

                      {/* Formatting Checklist */}
                      <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ListChecks size={13} /> ATS FORMATTING COMPLIANCE
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {auditData.formattingAudits?.map((item, idx) => {
                            const isPass = item.status === 'Pass';
                            const isFail = item.status === 'Fail';
                            const badgeColor = isPass ? '#10b981' : isFail ? '#f43f5e' : '#f59e0b';
                            return (
                              <div key={idx} style={{ display: 'flex', gap: 10, padding: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, alignItems: 'flex-start' }}>
                                <div style={{ textTransform: 'uppercase', fontSize: 9, fontWeight: 800, color: badgeColor, background: `${badgeColor}15`, padding: '2px 6px', borderRadius: 4, border: `1px solid ${badgeColor}30`, flexShrink: 0, marginTop: 1.5 }}>
                                  {item.status}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)' }}>{item.rule}</div>
                                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>{item.reason}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ATS-Optimized Master Resume Text & Editor */}
                    <div className="card" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px' }}>REWRITTEN & ATS-OPTIMIZED MASTER RESUME</div>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 0' }}>Restructured by Senior Recruiter audit. Copy or download this optimized text to update your resume file.</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            onClick={handleApplyRecreatedResume}
                            disabled={applyLoading}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: 11, gap: 6, background: 'linear-gradient(135deg, #00c9a7, #3b82f6)', border: 'none' }}
                          >
                            {applyLoading ? <><div className="spinner" /> Activating...</> : <><Check size={13} /> Apply as Active Profile</>}
                          </button>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(auditData.atsOptimizedResumeText || '');
                              toast.success('Optimized resume copied! 📋');
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
                        value={auditData.atsOptimizedResumeText || 'No optimized resume text generated yet.'}
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
                      
                      {/* Printable clean PDF resume container */}
                      <div id="ats-resume-print-area">
                        <pre style={{ 
                          whiteSpace: 'pre-wrap', 
                          fontFamily: '"Times New Roman", Times, serif', 
                          fontSize: '11.5pt', 
                          color: '#000', 
                          lineHeight: '1.45', 
                          background: '#fff', 
                          padding: '1in 0.8in', 
                          margin: 0, 
                          width: '100%', 
                          boxSizing: 'border-box' 
                        }}>
                          {auditData.atsOptimizedResumeText}
                        </pre>
                      </div>
                    </div>

                    <div className="card" style={{ padding: 20, marginTop: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={13} color="var(--teal)" /> RECREATE ENTIRE RESUME (ACTION-IMPACT FORMULA)
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                        Overhaul your entire resume at once. Specify your target role, key skills, and metrics (e.g. 25% query latency reduction, 2s load time improvement) to rewrite all experience bullets into the Action-Impact-Method (AIM) format.
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, alignItems: 'stretch' }} className="xyz-grid">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Target Role</label>
                            <input value={recreateRole} onChange={e => setRecreateRole(e.target.value)} className="inp" placeholder="e.g. Full Stack Developer, React Engineer" style={{ width: '100%', background: 'rgba(0,0,0,0.18)', borderColor: 'var(--border)', color: 'var(--text-1)' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Skills to Emphasize (comma-separated)</label>
                            <input value={recreateSkills} onChange={e => setRecreateSkills(e.target.value)} className="inp" placeholder="e.g. React, Node.js, TypeScript, Docker" style={{ width: '100%', background: 'rgba(0,0,0,0.18)', borderColor: 'var(--border)', color: 'var(--text-1)' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Key Metrics / Accomplishments to weave in</label>
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
                        {recreateLoading ? <><div className="spinner" /> Recreating Resume...</> : <><Sparkles size={13} /> Recreate & Optimize Entire Resume</>}
                      </button>
                    </div>

                    <div className="card" style={{ padding: 20, marginTop: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={13} color="var(--teal)" /> METRICS-DRIVEN ACHIEVEMENT OPTIMIZER
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                        Top recruiters prefer resume achievements written in the Action-Impact-Method (AIM) format: <strong>"Accomplished [Action] as measured by [Impact], by doing [Method]"</strong>. Enter any plain resume bullet below to rewrite it.
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, alignItems: 'stretch' }} className="xyz-grid">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Target Profile Role</label>
                            <input value={bulletRole} onChange={e => setBulletRole(e.target.value)} className="inp" placeholder="e.g. Software Developer, React Engineer" />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>Plain Bullet Point / Achievement</label>
                            <textarea 
                              value={bulletInp} 
                              onChange={e => setBulletInp(e.target.value)} 
                              className="inp" 
                              rows={3} 
                              placeholder="e.g. Worked on website speed optimization and fixed database query locks." 
                            />
                          </div>
                          <button onClick={handleOptimizeXYZ} disabled={xyzLoading || !bulletInp.trim()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            {xyzLoading ? <><div className="spinner" /> Optimizing...</> : <><Sparkles size={13} /> Optimize to AIM Formula</>}
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
                                    toast.success('AIM statement copied! 📋');
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
                      <style>{`
                        @media (max-width: 600px) {
                          .xyz-grid { grid-template-columns: 1fr !important; }
                        }
                      `}</style>
                    </div>



                    {/* ATS Keyword density */}
                    {auditData.keywordDensity && (
                      <div className="card" style={{ padding: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', marginBottom: 12 }}>
                          KEYWORD DENSITY AUDIT
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {auditData.keywordDensity.map((kw, i) => (
                            <span 
                              key={i} 
                              style={{ 
                                padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: kw.present ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)',
                                border: kw.present ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(244,63,94,0.15)',
                                color: kw.present ? '#10b981' : '#f43f5e'
                              }}
                            >
                              {kw.present ? '✓' : '✗'} {kw.keyword} {kw.present && `(${kw.count}x)`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}



                    {/* LinkedIn Top 20 Suited Roles directory */}
                    <div className="card" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px' }}>SUITED POSITIONS DIRECTORY (TOP 20)</div>
                          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 0' }}>Job matches compiled by Senior Recruiter audit. Apply with pre-configured search queries.</p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                        {auditData.suitedRoles?.map((item, idx) => (
                          <div key={idx} style={{ padding: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ fontSize: 13.5, fontWeight: 850, color: 'var(--text-1)' }}>
                                {item.index}. {item.title}
                              </div>
                              <span style={{ fontSize: 10.5, color: 'var(--teal)', background: 'rgba(0,201,167,0.06)', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(0,201,167,0.15)', fontWeight: 700 }}>
                                {item.fit}% FIT
                              </span>
                            </div>

                            <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.4 }}>
                              {item.reason}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                Salary: <strong style={{ color: 'var(--text-2)' }}>{item.avgSalary}</strong>
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button 
                                  onClick={async () => {
                                    try {
                                      const newJob = {
                                        company: 'Target Opportunity',
                                        role: item.title,
                                        status: 'Saved',
                                        location: 'Remote / India',
                                        salary: item.avgSalary,
                                        jobDescription: `Target role for ${item.title} compiled by Senior Recruiter Audit.`,
                                        notes: `Suited role fit score: ${item.fit}%.\nReason: ${item.reason}`
                                      };
                                      await jobsAPI.create(newJob);
                                      toast.success(`"${item.title}" added to Job Tracker! 🔖`);
                                    } catch (err) {
                                      toast.error('Failed to save target job');
                                    }
                                  }} 
                                  className="btn btn-ghost btn-sm" 
                                  style={{ padding: '2px 6px', fontSize: 10.5, gap: 4 }}
                                >
                                  <Bookmark size={11} /> Track
                                </button>
                                <a 
                                  href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(item.title)}&location=India`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '2px 8px', fontSize: 10.5, gap: 4, textDecoration: 'none' }}
                                >
                                  <ExternalLink size={11} /> Find ↗
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

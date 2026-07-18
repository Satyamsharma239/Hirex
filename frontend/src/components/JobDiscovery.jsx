import React, { useState, useEffect } from 'react';
import { discoverAPI, jobsAPI } from '../services/api';
import toast from 'react-hot-toast';
import InterviewSim from './InterviewSim';
import { GhostRatePredictor, FollowupEngine } from './FeatureModals';
import {
  Search, MapPin, Briefcase, Clock, Users, Mail,
  RefreshCw, X, BookmarkPlus, Bookmark, Zap, Filter,
  CheckCircle2, Send, Copy, Check, User,
  ChevronDown, ChevronUp, AlertCircle, Sparkles, Brain, Ghost, Bell, ExternalLink
} from 'lucide-react';
import { ParticleButton } from './ui/ParticleButton';
import { NeonGradientCard } from './ui/NeonGradientCard';
// ── Constants ──────────────────────────────────────────────────────
const CITIES = ['Any Location', 'Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Chennai', 'Delhi NCR', 'Noida', 'Jaipur', 'Ahmedabad', 'Kolkata', 'Remote'];
const EXP_OPTS = ['Fresher (0 yr)', '0-1 year', '1-2 years', '2-4 years', '4+ years'];
const INDUSTRIES = ['Any Industry', 'SaaS', 'FinTech', 'E-Commerce', 'Healthcare', 'EdTech', 'Logistics', 'Marketing', 'Finance'];
const TIME_OPTS = ['Any Time', 'Past 1 Hour', 'Past 24 Hours', 'Past 7 Days', 'Past 30 Days'];
const ROLE_PRESETS = [
  { label: 'MERN Stack Developer', icon: '⚡' },
  { label: 'React Developer', icon: '⚛️' },
  { label: 'Node.js Developer', icon: '🟢' },
  { label: 'Full Stack Developer', icon: '🔥' },
  { label: 'Frontend Developer', icon: '🎨' },
  { label: 'Backend Developer', icon: '⚙️' },
  { label: 'Python Developer', icon: '🐍' },
  { label: 'Data Analyst', icon: '📊' },
  { label: 'DevOps Engineer', icon: '🚀' },
  { label: 'Android Developer', icon: '📱' },
  { label: 'Java Developer', icon: '☕' },
  { label: 'UI/UX Designer', icon: '✏️' },
];

// ── Helper Components ──────────────────────────────────────────────
function CompanyAvatar({ logo, color, size = 46 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.27,
      background: `${color}18`, border: `1.5px solid ${color}35`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: size * 0.32, fontWeight: 900, color,
      letterSpacing: '-0.5px', userSelect: 'none',
    }}>{logo || '?'}</div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
      {copied ? <><Check size={12} color="#10b981" /> Copied!</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

// ── User Profile Modal (collect once, store in localStorage) ───────
function UserProfileModal({ onSave, onClose }) {
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem('hirex_user');
      return saved ? JSON.parse(saved) : { name: '', email: '', background: '', skills: '' };
    } catch {
      return { name: '', email: '', background: '', skills: '' };
    }
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = () => {
    if (!form.name.trim()) return toast.error('Enter your name');
    if (!form.email.trim()) return toast.error('Enter your email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      return toast.error('Please enter a valid email address (e.g. user@example.com)');
    }
    localStorage.setItem('hirex_user', JSON.stringify(form));
    onSave(form);
    toast.success('Profile saved');
  };

  const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 7, letterSpacing: '0.6px', textTransform: 'uppercase' };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 460 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--teal-dim)', border: '1px solid var(--border-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="var(--teal)" />
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Your Details</h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
            We'll use this to write personalized emails to HR. Stored only on your device.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Full Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="inp" placeholder="e.g., Satyam Sharma" /></div>
          <div><label style={lbl}>Your Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="inp" placeholder="e.g., satyam@gmail.com" /></div>
          <div><label style={lbl}>Your Background</label><textarea value={form.background} onChange={e => set('background', e.target.value)} className="inp" rows={3} placeholder="e.g., Final year BCA student from Pune, passionate about web development..." /></div>
          <div><label style={lbl}>Key Skills (comma separated)</label><input value={form.skills} onChange={e => set('skills', e.target.value)} className="inp" placeholder="React, Node.js, MongoDB, Express..." /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Skip for now</button>
          <button onClick={save} className="btn btn-primary" style={{ flex: 2 }}><User size={15} /> Save & Continue</button>
        </div>
      </div>
    </div>
  );
}

function EmailModal({ job, userProfile, resumeData, resumeText, onClose }) {
  const [companyName, setCompanyName] = useState(job.company || '');
  const [recruiter, setRecruiter]     = useState('Sarah Chen');
  const [roleJobId, setRoleJobId]     = useState(`${job.title} | ID #${job.id || '77123'}`);
  const [hrEmail, setHrEmail]         = useState(job.hrEmail || '');
  const [pitchText, setPitchText]     = useState('');
  const [loading, setLoading]         = useState(true);
  const [editMode, setEditMode]       = useState(false);

  useEffect(() => {
    const init = async () => {
      let activeRecruiter = 'Sarah Chen';
      try {
        const { data } = await discoverAPI.findHrEmail({ company: companyName });
        if (data.email) {
          setHrEmail(data.email);
        }
        if (data.recruiterName) {
          setRecruiter(data.recruiterName);
          activeRecruiter = data.recruiterName;
        }
      } catch (err) {}
      generateEmail(activeRecruiter);
    };
    init();
  }, []);

  const generateEmail = async (currentRecruiter) => {
    setLoading(true);
    let name = resumeData?.name || userProfile?.name;
    let email = resumeData?.email || userProfile?.email;
    if (!name || name === 'Alex Jensen' || name === 'Priya Sharma') {
      if (resumeText) {
        const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0 && lines[0].length < 40 && !lines[0].toLowerCase().includes('resume') && !lines[0].toLowerCase().includes('cv')) {
          name = lines[0];
        }
      }
    }
    name = name || 'Satyam Sharma';

    if (!email || email === 'alex@jensen.com') {
      if (resumeText) {
        const emailMatch = resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) email = emailMatch[1];
      }
    }
    email = email || 'satyam.sharma@email.com';

    const recruiterNameForPrompt = currentRecruiter || recruiter;

    try {
      const { data } = await discoverAPI.getOutreachEmail({
        job: { ...job, company: companyName, title: roleJobId.split(' | ')[0] },
        userName:            name,
        userEmail:           email,
        recruiterName:       recruiterNameForPrompt,
        userBackground:      resumeData?.headline    || userProfile?.background || 'Software Developer',
        userSkills:          resumeData?.topSkills   || (userProfile?.skills ? userProfile.skills.split(',').map(s => s.trim()) : []),
        resumeSkillsPresent: resumeData?.topSkills   || [],
        resumeSkillsMissing: resumeData?.skillsMissing || [],
        resumeImprovement:   resumeData?.improvement  || '',
        resumeText:          resumeText || '',
      });
      setPitchText(data.body || '');
    } catch (err) {
      setPitchText(`Subject: Connecting regarding ${roleJobId.split(' | ')[0]} opportunities at ${companyName}\n\nHi ${recruiterNameForPrompt.split(' ')[0]},\n\nI hope you're having a great week!\n\nI've been following ${companyName}'s work and was specifically impressed by your recent developments. Given my background, I was thrilled to see the ${roleJobId.split(' | ')[0]} opening on your team.\n\nI admire ${companyName}'s commitment to visual excellence and technical precision. I am confident my background in crafting scalable web applications would be a strong fit for your current goals.\n\nI would welcome the opportunity to briefly connect to discuss how my expertise aligns with ${companyName}'s product vision. Is there a good time next week for a 15-minute call?\n\nBest regards,\n\n${name}\n${email}\n${resumeData?.linkedin || ''}`);
    }
    setLoading(false);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(pitchText);
    toast.success('Email copied to clipboard');
  };

  const handleLinkedInSearch = () => {
    const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName + ' ' + recruiter)}`;
    window.open(url, '_blank', 'noreferrer');
  };

  const handleAutoFill = (field) => {
    if (field === 'company') {
      setCompanyName(job.company || '');
    } else if (field === 'recruiter') {
      setRecruiter('Sarah Chen');
    } else if (field === 'role') {
      setRoleJobId(`${job.title} | ID #${job.id || '77123'}`);
    } else if (field === 'hrEmail') {
      setHrEmail(job.hrEmail || '');
    }
    toast.success('Auto-filled field!');
  };

  const charCount = pitchText.length;
  const wordCount = pitchText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="modal-box" style={{ maxWidth: 660, width: '95%', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', padding: 0, borderRadius: 16, overflow: 'hidden' }}>
        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 18 }}>🤖</div>
            <h2 style={{ fontSize: 16.5, fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>Compose Personalized Outreach</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0 }}><X size={15} /></button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Company Name', val: companyName, setVal: setCompanyName, field: 'company' },
            { label: 'Target Recruiter', val: recruiter, setVal: setRecruiter, field: 'recruiter' },
            { label: 'Role/Job ID', val: roleJobId, setVal: setRoleJobId, field: 'role' },
            { label: 'HR Email', val: hrEmail, setVal: setHrEmail, field: 'hrEmail' }
          ].map(f => (
            <div key={f.label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>{f.label}</span>
              <input value={f.val} onChange={e => f.setVal(e.target.value)} className="inp" style={{ height: 38, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-1)' }} />
              <button onClick={() => handleAutoFill(f.field)} className="btn btn-ghost btn-sm" style={{ height: 38, fontSize: 11.5, borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-2)', gap: 4 }}>
                🔄 Auto-Fill
              </button>
            </div>
          ))}
        </div>

        {/* Pitch Area */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.8px', marginBottom: 12, textTransform: 'uppercase' }}>Generated Pitch Draft</div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '40px 24px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ height: 16, width: '40%', background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4 }}></div>
              <div style={{ height: 16, width: '90%', background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4 }}></div>
              <div style={{ height: 16, width: '85%', background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4 }}></div>
              <div style={{ height: 16, width: '60%', background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 4 }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <Sparkles size={14} color="var(--teal)" style={{ animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500, fontStyle: 'italic' }}>AI is typing your personalized pitch...</span>
              </div>
            </div>
          ) : (
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.3)', padding: 20 }}>
              <textarea
                value={pitchText}
                onChange={e => setPitchText(e.target.value)}
                readOnly={!editMode}
                rows={12}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: 13.5,
                  color: 'var(--text-2)',
                  lineHeight: 1.7,
                  fontFamily: 'inherit'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
                  {charCount} chars / {wordCount} words
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditMode(!editMode)} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
                    {editMode ? 'Lock Draft' : 'Edit Draft'}
                  </button>
                  <button onClick={generateEmail} className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: 'var(--teal)', borderColor: 'var(--border-teal)' }}>
                    Generate Alternate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a
              href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName + ' ' + recruiter)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                height: 46,
                background: 'linear-gradient(135deg, #0077b5, #005582)',
                color: '#fff',
                fontWeight: 800,
                justifyContent: 'center',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                fontSize: '12.5px',
                width: '100%'
              }}
            >
              LinkedIn Search
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName + ' ' + recruiter)}`);
                toast.success('LinkedIn search link copied');
              }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '4px 0', border: 'none', background: 'transparent', color: 'var(--text-3)' }}
            >
              📋 Copy Link
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a
              href={`mailto:${encodeURIComponent(hrEmail)}?subject=${encodeURIComponent(roleJobId.split(' | ')[0])}&body=${encodeURIComponent(pitchText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                height: 46,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontWeight: 800,
                justifyContent: 'center',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                fontSize: '12.5px',
                width: '100%'
              }}
            >
              Send via Email
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(hrEmail);
                toast.success('HR email copied');
              }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '4px 0', border: 'none', background: 'transparent', color: 'var(--text-3)' }}
            >
              📋 Copy Email
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={copyEmail}
              className="btn btn-primary"
              style={{
                height: 46,
                background: 'linear-gradient(135deg, #00c9a7, #0891b2)',
                color: '#060d1a',
                fontWeight: 800,
                justifyContent: 'center',
                borderRadius: 10,
                fontSize: '12.5px',
                width: '100%'
              }}
            >
              Copy Email
            </button>
            <span style={{ fontSize: 11, padding: '4px 0', color: 'var(--text-3)', textAlign: 'center' }}>
              Full pitch text
            </span>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Job Card ───────────────────────────────────────────────────────
function JobCard({ job, onOutreach, onSimulate, isSaved, onToggleSave, onApply }) {
  const comp = job.company.toLowerCase().trim();
  
  let logoBg = job.logoColor || '#00c9a7';
  let logoContent = job.logo || job.company.substring(0, 1).toUpperCase();
  if (comp.includes('apex')) {
    logoBg = '#00c9a7';
    logoContent = 'A';
  } else if (comp.includes('cloud')) {
    logoBg = '#3b82f6';
    logoContent = '☁';
  } else if (comp.includes('innovate')) {
    logoBg = '#0d9488';
    logoContent = '⚛';
  }

  let formattedSalary = job.salary || '₹18L - ₹26L PA';
  if (typeof formattedSalary === 'string' && !formattedSalary.includes('PA') && !formattedSalary.includes('LPA')) {
    if (formattedSalary.includes('L')) {
      formattedSalary = `${formattedSalary} PA`;
    } else {
      formattedSalary = `₹${formattedSalary} LPA`;
    }
  }

  return (
    <NeonGradientCard className="w-full h-full">
      <div style={{
        padding: 24,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%'
      }}>
      {/* Bookmark Icon */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleSave(job); }} 
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: isSaved ? 'var(--teal)' : 'var(--text-3)'
        }}
      >
        <Bookmark size={18} fill={isSaved ? 'var(--teal)' : 'none'} />
      </button>

      {/* Top section: Logo, title, company, location */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: logoBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 16,
          color: '#ffffff',
          flexShrink: 0
        }}>
          {logoContent}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-1)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {job.title}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
            {job.company}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {job.location}
          </div>
        </div>
      </div>

      {/* Mid Section: Salary & Experience */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Salary LPA</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{formattedSalary}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Experience</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{job.experience || '5-8 Years'}</div>
        </div>
      </div>

      {/* Tag */}
      <div>
        <span style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-2)'
        }}>
          {job.type || 'Full Time'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <ParticleButton 
          onClick={(e) => { e.stopPropagation(); onApply(job); }} 
          className="btn btn-primary" 
          style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 700, padding: '10px', display: 'flex', gap: 6, alignItems: 'center', borderRadius: 10, fontSize: 13 }}
        >
          <Zap size={14} /> 1-Click Apply
        </ParticleButton>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onOutreach(job)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '12px' }}>
            <Send size={13} /> Outreach
          </button>
          <button onClick={() => onSimulate(job)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '12px' }}>
            <User size={13} /> Interview
          </button>
        </div>
      </div>
      </div>
    </NeonGradientCard>
  );
}

// ── Job Detail Panel ───────────────────────────────────────────────
function JobDetailPanel({ job, onClose, onSave, userProfile, onWriteEmail, onGhostRate, onFollowup, onInterview, resumeAnalyzed, onApply }) {
  const [saving, setSaving]       = useState(false);
  const [intel, setIntel]         = useState(null);
  const [intelLoad, setIntelLoad] = useState(false);
  const [tab, setTab]             = useState('overview');
  const [showReqs, setShowReqs]   = useState(true);

  const matchColor = !resumeAnalyzed ? '#64748b' :
    job.matchScore >= 85 ? '#10b981' : job.matchScore >= 70 ? '#00c9a7' : '#f59e0b';

  const loadIntel = async () => {
    if (intel || intelLoad) return;
    setIntelLoad(true);
    try { const { data } = await discoverAPI.getCompanyIntel({ company: job.company, role: job.title }); setIntel(data); }
    catch { toast.error('Could not load company data'); }
    setIntelLoad(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(job);
    setSaving(false);
  };

  const secLabel = { fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10, display: 'block' };
  const pill = (text, color = '#64748b') => (
    <span key={text} style={{ padding: '3px 10px', borderRadius: 6, background: `${color}10`, border: `1px solid ${color}25`, fontSize: 12, color: '#94a3b8', fontWeight: 500, margin: '2px 3px', display: 'inline-block' }}>{text}</span>
  );

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, overflow: 'hidden', position: 'sticky', top: 20, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
          <CompanyAvatar logo={job.logo} color={job.logoColor} size={52} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 3px' }}>{job.title}</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0, fontWeight: 600 }}>{job.company}</p>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{job.companyType}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ flexShrink: 0 }}><X size={15} /></button>
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { icon: MapPin, val: job.location },
            { icon: Clock, val: job.experience },
            { icon: Briefcase, val: job.mode },
          ].map(({ icon: Icon, val }) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-3)' }}>
              <Icon size={12} />{val}
            </div>
          ))}
        </div>
      </div>

      {/* Salary + match row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Salary', value: String(job.salary).includes('₹') ? job.salary : `₹${job.salary}`, color: '#fbbf24' },
          { label: resumeAnalyzed ? 'Match Score' : 'Match Score', value: resumeAnalyzed ? `${job.matchScore}%` : 'N/A', color: matchColor, sub: resumeAnalyzed ? null : 'Upload resume' },
          { label: 'Openings', value: job.openings, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '13px 16px', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.sub}</div>}
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* HR Email — prominent */}
      <div style={{ padding: '14px 22px', background: 'rgba(0,201,167,0.04)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mail size={15} color="var(--teal)" />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', letterSpacing: '0.5px' }}>HR EMAIL</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-1)', fontWeight: 600, marginTop: 1 }}>{job.hrEmail}</div>
          </div>
        </div>
        <button onClick={() => onWriteEmail(job)} className="btn btn-primary btn-sm">
          <Send size={12} /> Write Email
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {[['overview','Job Details'],['intel','Company Intel']].map(([id,label]) => (
          <button key={id} onClick={() => { setTab(id); if(id==='intel') loadIntel(); }}
            style={{ flex:1, padding:'11px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:12.5, color: tab===id ? 'var(--teal)' : 'var(--text-3)', borderBottom:`2px solid ${tab===id ? 'var(--teal)' : 'transparent'}`, transition:'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ padding:'18px 22px', maxHeight: 420, overflowY:'auto', display:'flex', flexDirection:'column', gap:18 }}>
        {tab === 'overview' && (
          <>
            {/* Why fit */}
            {resumeAnalyzed && job.matchReason && (
              <div style={{ padding:'10px 14px', background:`${matchColor}08`, border:`1px solid ${matchColor}20`, borderRadius:9 }}>
                <div style={{ fontSize:10, fontWeight:700, color: matchColor, marginBottom:4, letterSpacing:'0.5px' }}>WHY YOU FIT</div>
                <p style={{ fontSize:12.5, color:'var(--text-2)', margin:0, lineHeight:1.6 }}>{job.matchReason}</p>
              </div>
            )}

            {/* Description */}
            <div>
              <span style={secLabel}>About the Role</span>
              <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.7, margin:0 }}>{job.description}</p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities?.length > 0 && (
              <div>
                <button onClick={() => setShowReqs(!showReqs)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', padding:0, fontFamily:'inherit' }}>
                  <span style={{ ...secLabel, marginBottom:0 }}>Responsibilities ({job.responsibilities.length})</span>
                  {showReqs ? <ChevronUp size={13} color="var(--text-3)" /> : <ChevronDown size={13} color="var(--text-3)" />}
                </button>
                {showReqs && (
                  <ul style={{ margin:'10px 0 0', padding:'0 0 0 16px', display:'flex', flexDirection:'column', gap:8 }}>
                    {job.responsibilities.map((r,i) => (
                      <li key={i} style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.5 }}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Requirements */}
            <div>
              <span style={secLabel}>Must Have Skills</span>
              <div>{(job.requirements||[]).map(r => pill(r, '#00c9a7'))}</div>
            </div>

            {/* Nice to have */}
            {job.niceToHave?.length > 0 && (
              <div>
                <span style={secLabel}>Good to Have</span>
                <div>{job.niceToHave.map(r => pill(r, '#8b5cf6'))}</div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits?.length > 0 && (
              <div>
                <span style={secLabel}>Benefits & Perks</span>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {job.benefits.map((b,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-2)' }}>
                      <CheckCircle2 size={13} color="#10b981" style={{ flexShrink:0 }} />{b}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deadline */}
            {job.deadline && (
              <div style={{ padding:'10px 14px', background:'rgba(244,63,94,0.04)', border:'1px solid rgba(244,63,94,0.15)', borderRadius:9, display:'flex', alignItems:'center', gap:8 }}>
                <AlertCircle size={14} color="#fb7185" />
                <span style={{ fontSize:12.5, color:'#fb7185', fontWeight:600 }}>Apply before: {job.deadline}</span>
              </div>
            )}
          </>
        )}

        {tab === 'intel' && (
          intelLoad ? (
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'24px 0' }}>
              <div className="spinner spinner-teal" /><span style={{ color:'var(--text-3)', fontSize:13 }}>Loading company intelligence...</span>
            </div>
          ) : intel ? (
            <>
              {/* Rating bars */}
              <div>
                <span style={secLabel}>Company Ratings</span>
                {[['Culture',intel.cultureScore,10],['Work-Life Balance',intel.workLifeScore,10],['Compensation',intel.salaryScore,10],['Growth',intel.growthScore,10]].map(([label,val,max]) => (
                  <div key={label} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:12.5, color:'var(--text-2)' }}>{label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--teal)' }}>{val}/{max}</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width:`${(val/max)*100}%` }} /></div>
                  </div>
                ))}
              </div>

              {/* Interview process */}
              <div>
                <span style={secLabel}>Interview Process · {intel.interviewDifficulty}</span>
                {(intel.interviewProcess||[]).map((s,i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'9px 0', borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
                    <span style={{ width:22, height:22, borderRadius:'50%', background:'var(--teal-dim)', color:'var(--teal)', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
                    <span style={{ fontSize:12.5, color:'var(--text-2)', lineHeight:1.5 }}>{s}</span>
                  </div>
                ))}
                <div style={{ fontSize:12, color:'var(--text-3)', marginTop:8 }}>⏱ Typical timeline: {intel.typicalTimeline}</div>
              </div>

              {/* Tech stack */}
              {intel.techStack?.length > 0 && (
                <div>
                  <span style={secLabel}>Tech Stack Used</span>
                  <div>{intel.techStack.map(t => pill(t, '#3b82f6'))}</div>
                </div>
              )}

              {/* Insider tips */}
              {intel.insiderTips?.length > 0 && (
                <div>
                  <span style={{ ...secLabel, color:'#fbbf24' }}>💡 Insider Tips</span>
                  {intel.insiderTips.map((t,i) => (
                    <div key={i} style={{ fontSize:12.5, color:'var(--text-2)', padding:'8px 12px', background:'rgba(245,158,11,0.05)', borderRadius:8, marginBottom:6, border:'1px solid rgba(245,158,11,0.12)', lineHeight:1.5 }}>• {t}</div>
                  ))}
                </div>
              )}

              {/* Pros/Cons */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <span style={{ ...secLabel, color:'#10b981' }}>✅ Pros</span>
                  {(intel.pros||[]).map((p,i) => <div key={i} style={{ fontSize:12, color:'var(--text-2)', marginBottom:5 }}>• {p}</div>)}
                </div>
                <div>
                  <span style={{ ...secLabel, color:'#f43f5e' }}>⚠️ Cons</span>
                  {(intel.cons||[]).map((c,i) => <div key={i} style={{ fontSize:12, color:'var(--text-2)', marginBottom:5 }}>• {c}</div>)}
                </div>
              </div>

              {/* Verdict */}
              {intel.verdict && (
                <div style={{ padding:'12px 16px', background:'rgba(0,201,167,0.05)', borderRadius:10, border:'1px solid var(--border-teal)' }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--teal)', display:'block', marginBottom:5 }}>VERDICT</span>
                  <p style={{ fontSize:13, color:'var(--text-2)', margin:0, lineHeight:1.6 }}>{intel.verdict}</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding:'24px 0', textAlign:'center', color:'var(--text-3)' }}>Click Company Intel tab to load</div>
          )
        )}
      </div>

      <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
        {job.applicationLink && (
          <button 
            onClick={() => onApply(job)}
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 800, padding: '12px', display: 'flex', gap: 6, alignItems: 'center', borderRadius: 10, fontSize: 13 }}
          >
            <Zap size={14} /> 1-Click Apply
          </button>
        )}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-ghost" style={{ flex:1 }}>
            {saving ? <><div className="spinner" />Adding...</> : <><BookmarkPlus size={13} />Add to Tracker</>}
          </button>
          <button onClick={() => onGhostRate(job)} className="btn btn-ghost" style={{ flex:1 }}>
            <Ghost size={13} color="var(--teal)" /> Predict Reply Rate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function JobDiscovery({ initialRole, initialSkills, resumeAnalyzed, resumeData, resumeText, onSimulateInterview }) {
  const [role, setRole]         = useState(initialRole || '');
  const [city, setCity]         = useState('Any Location');
  const [experience, setExp]    = useState('Fresher (0 yr)');
  const [industry, setIndustry] = useState('Any Industry');
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [emailJob, setEmailJob]       = useState(null);
  const [ghostJob, setGhostJob]       = useState(null);
  const [followupJob, setFollowupJob] = useState(null);
  const [interviewJob, setInterviewJob] = useState(null);
  const [userProfile, setUserProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hirex_user') || 'null'); } catch { return null; }
  });
  const [showProfile, setShowProfile] = useState(false);
  const [modeFilter, setModeFilter]   = useState('Any');
  const [typeFilter, setTypeFilter]   = useState('Any');
  const [timeFilter, setTimeFilter]   = useState('Any Time');
  const [savedJobs, setSavedJobs]     = useState([]);
  const [applyingJob, setApplyingJob] = useState(null);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
      doSearch(initialRole);
    } else {
      setRole("Software Engineer");
      doSearch("Software Engineer");
    }
  }, [initialRole]);

  const getMaxDays = () => {
    if (timeFilter === 'Past 1 Hour') return 1;
    if (timeFilter === 'Past 24 Hours') return 1;
    if (timeFilter === 'Past 7 Days') return 7;
    if (timeFilter === 'Past 30 Days') return 30;
    return null;
  };

  const doSearch = async (searchRole) => {
    const r = searchRole || role;
    if (!r?.trim()) return toast.error('Enter a role to search');
    setLoading(true); setSelected(null); setHasSearched(true); setPage(1);
    try {
      const { data } = await discoverAPI.searchJobs({
        role: r, page: 1,
        location: city === 'Any Location' ? '' : city,
        skills: initialSkills || [],
        experience,
        maxDaysOld: getMaxDays(),
      });
      setJobs(data.jobs || []);
      setHasMore(data.hasMore || false);
      if (data.jobs?.length) toast.success(`Found ${data.jobs.length} open positions!`);
      else toast('No jobs found — try a different role', { icon: '🔍' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Search failed');
    }
    setLoading(false);
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const { data } = await discoverAPI.searchJobs({
        role, page: nextPage,
        location: city === 'Any Location' ? '' : city,
        skills: initialSkills || [],
        experience,
        maxDaysOld: getMaxDays(),
      });
      setJobs(prev => [...prev, ...(data.jobs || [])]);
      setPage(nextPage);
      setHasMore(data.hasMore || false);
      toast.success(`Loaded ${data.jobs?.length || 0} more positions`);
    } catch (err) {
      toast.error('Failed to load more jobs');
    }
    setLoadingMore(false);
  };

  const handleSaveJob = async (job) => {
    try {
      await jobsAPI.create({
        company: job.company, role: job.title, status: 'Applied',
        location: job.location, salary: job.salary,
        notes: `Source: Job Discovery\nHR Email: ${job.hrEmail}\nApply by: ${job.deadline || 'Open'}`,
        appliedDate: new Date().toISOString().split('T')[0],
        jobDescription: [job.description, ...(job.responsibilities||[])].join('\n'),
      });
      toast.success(`${job.company} added to tracker`);
    } catch { toast.error('Failed to add to tracker'); }
  };

  const handleWriteEmail = (job) => { setEmailJob(job); };
  const handleGhostRate  = (job) => setGhostJob(job);
  const handleFollowup   = (job) => setFollowupJob(job);
  const handleInterview  = (job) => setInterviewJob(job);

  const handleToggleSave = async (job) => {
    const isSaved = savedJobs.includes(job.id);
    if (isSaved) {
      setSavedJobs(prev => prev.filter(id => id !== job.id));
      toast.success('Removed job from saved list');
    } else {
      setSavedJobs(prev => [...prev, job.id]);
      await handleSaveJob(job);
    }
  };

  const handleApplyJob = (job) => {
    if (!job.applicationLink) {
      toast.error('No application link available for this job');
      return;
    }
    setApplyingJob(job);
  };

  const confirmApplyJob = async (job) => {
    try {
      await jobsAPI.create({
        company: job.company, role: job.title, status: 'Applied',
        location: job.location, salary: job.salary,
        notes: `Source: Job Discovery (Application Portal)\nHR Email: ${job.hrEmail || 'N/A'}\nApplication Link: ${job.applicationLink}`,
        appliedDate: new Date().toISOString().split('T')[0],
        jobDescription: [job.description, ...(job.responsibilities||[])].join('\n'),
      });
      toast.success(`Successfully recorded application to ${job.company}`);
      setApplyingJob(null);
    } catch {
      toast.error('Failed to save to tracker');
    }
  };

  const filtered = jobs.filter(j => {
    if (modeFilter !== 'Any' && j.mode !== modeFilter) return false;
    if (typeFilter !== 'Any' && j.type !== typeFilter) return false;
    if (timeFilter !== 'Any Time') {
      const hoursSince = (Date.now() - (j.createdTime || Date.now())) / (1000 * 60 * 60);
      if (timeFilter === 'Past 1 Hour' && hoursSince > 1) return false;
      if (timeFilter === 'Past 24 Hours' && hoursSince > 24) return false;
      if (timeFilter === 'Past 7 Days' && hoursSince > 24 * 7) return false;
      if (timeFilter === 'Past 30 Days' && hoursSince > 24 * 30) return false;
    }
    return true;
  });

  return (
    <div className="page-enter" style={{ padding: '28px 28px 60px' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>
            Hello, {resumeData?.name || 'User'}!
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Bell size={18} color="var(--text-2)" />
            <span style={{ position: 'absolute', top: -1, right: -1, width: 6, height: 6, borderRadius: '50%', background: '#f43f5e' }} />
          </div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', border: '1.5px solid rgba(255,255,255,0.1)' }}>
            {(resumeData?.name || 'User').substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Search Bar Container */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 28, background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
        <div style={{ position: 'relative', width: '100%', marginBottom: 16 }}>
          <input 
            value={role} 
            onChange={e => setRole(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Find Your Next Job (e.g., Senior Frontend Engineer)" 
            className="inp" 
            style={{ 
              height: 48, 
              paddingLeft: 18, 
              paddingRight: 110, 
              borderRadius: 10, 
              border: '1px solid var(--teal)', 
              background: 'rgba(6, 13, 26, 0.4)',
              fontSize: 14.5
            }} 
          />
          <button 
            onClick={() => doSearch()} 
            disabled={loading || !role.trim()} 
            className="btn" 
            style={{ 
              position: 'absolute', 
              right: 5, 
              top: 5, 
              height: 38, 
              background: 'linear-gradient(135deg, #00c9a7, #0891b2)', 
              color: '#060d1a', 
              fontWeight: 800, 
              borderRadius: 8, 
              padding: '0 20px',
              fontSize: 13
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { value: city, onChange: setCity, options: CITIES, placeholder: 'Location' },
            { value: experience, onChange: setExp, options: EXP_OPTS, placeholder: 'Experience' },
            { value: industry, onChange: setIndustry, options: INDUSTRIES, placeholder: 'Industry' },
            { value: timeFilter, onChange: setTimeFilter, options: TIME_OPTS, placeholder: 'Date Posted' }
          ].map(filter => (
            <div key={filter.placeholder} style={{ position: 'relative', display: 'inline-block' }}>
              <select 
                value={filter.value} 
                onChange={e => filter.onChange(e.target.value)} 
                style={{ 
                  padding: '8px 32px 8px 16px', 
                  background: 'rgba(255,255,255,0.04)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 20, 
                  color: 'var(--text-2)', 
                  fontSize: 13, 
                  fontWeight: 600, 
                  appearance: 'none', 
                  cursor: 'pointer' 
                }}
              >
                <option value="" disabled>{filter.placeholder}</option>
                {filter.options.map(opt => (
                  <option key={opt} value={opt} style={{ background: '#0a1628', color: '#e8f0fe' }}>{opt}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Main Jobs Listing */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton-shimmer" style={{ height: 180, borderRadius: 16 }}></div>
          ))}
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border)', borderRadius: 16, color: 'var(--text-3)' }}>
              <Briefcase size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
              <h3>No jobs found matching your filters</h3>
              <p style={{ fontSize: 13, marginTop: 4 }}>Try clearing some filters or searching a different role.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }} className="animate-stagger-fade-up">
              {filtered.map(job => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onOutreach={setEmailJob}
                  onSimulate={(j) => onSimulateInterview && onSimulateInterview(j.company, j.title, j.description || j.responsibilities?.join('\n') || '')}
                  isSaved={savedJobs.includes(job.id)}
                  onToggleSave={handleToggleSave}
                  onApply={handleApplyJob}
                />
              ))}
            </div>
          )}

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button onClick={loadMore} disabled={loadingMore} className="btn btn-ghost" style={{ borderRadius: 20, padding: '10px 24px', fontSize: 13 }}>
                {loadingMore ? 'Loading...' : 'Load More Jobs'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showProfile && (
        <UserProfileModal
          onSave={(p) => { setUserProfile(p); setShowProfile(false); }}
          onClose={() => setShowProfile(false)}
        />
      )}
      {emailJob && (
        <EmailModal
          job={emailJob}
          userProfile={userProfile}
          resumeData={resumeData}
          resumeText={resumeText}
          onClose={() => setEmailJob(null)}
        />
      )}
      {ghostJob && (
        <GhostRatePredictor
          job={ghostJob}
          userProfile={userProfile}
          resumeData={resumeData}
          resumeText={resumeText || ''}
          onClose={() => setGhostJob(null)}
        />
      )}

      {/* Application Portal Modal */}
      {applyingJob && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)' }}>
          <div style={{ margin: 'auto', width: '90%', maxWidth: 1000, height: '90vh', background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            {/* Header */}
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>Applying to {applyingJob.company}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Submit your authentic application. If the form below doesn't load, use the secure window.</p>
              </div>
              <button onClick={() => setApplyingJob(null)} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* Content Area */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              
              {/* Left Side: Auto-Fill Copier */}
              <div style={{ width: 300, borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', padding: 24, overflowY: 'auto' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Your Data Vault</h4>
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.5 }}>
                  Click to copy your details and paste them into the application form.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Full Name', value: resumeData?.name || '' },
                    { label: 'Email', value: resumeData?.contact?.email || '' },
                    { label: 'Phone', value: resumeData?.contact?.phone || '' },
                    { label: 'LinkedIn URL', value: resumeData?.contact?.linkedin || '' },
                    { label: 'Portfolio / GitHub', value: resumeData?.contact?.github || '' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.value}
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(item.value); toast.success('Copied!'); }} style={{ padding: '0 12px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button onClick={() => confirmApplyJob(applyingJob)} style={{ width: '100%', marginTop: 32, padding: '12px', background: 'linear-gradient(135deg, #00c9a7, #0891b2)', color: '#000', fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <CheckCircle2 size={18} /> Mark as Applied
                </button>
              </div>

              {/* Right Side: Application Webview */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={14} /> Some companies block embedded browsers.
                  </div>
                  <button onClick={() => window.open(applyingJob.applicationLink, 'HireXApplication', 'width=1000,height=800,scrollbars=yes')} style={{ padding: '6px 16px', background: '#3b82f6', color: '#fff', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ExternalLink size={14} /> Open Secure Window
                  </button>
                </div>
                <iframe src={applyingJob.applicationLink} style={{ flex: 1, width: '100%', border: 'none' }} title="Application Portal" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />
              </div>

            </div>
          </div>
        </div>
      )}

      {interviewJob && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setInterviewJob(null)}>
          <div className="modal-box" style={{ maxWidth: 600, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}>
                <Brain size={17} color="#f59e0b" /> Mock Interview
              </h3>
              <button onClick={() => setInterviewJob(null)} className="btn btn-ghost btn-icon"><X size={15} /></button>
            </div>
            <InterviewSim
              company={interviewJob.company}
              role={interviewJob.title}
              jobDescription={interviewJob.description || ''}
              onClose={() => setInterviewJob(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

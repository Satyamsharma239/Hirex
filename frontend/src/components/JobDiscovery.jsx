import React, { useState, useEffect } from 'react';
import { discoverAPI, jobsAPI } from '../services/api';
import toast from 'react-hot-toast';
import InterviewSim from './InterviewSim';
import { GhostRatePredictor, FollowupEngine } from './FeatureModals';
import {
  Search, MapPin, Briefcase, Clock, Users, Mail,
  RefreshCw, X, BookmarkPlus, Zap, Filter,
  CheckCircle2, Send, Copy, Check, User,
  ChevronDown, ChevronUp, AlertCircle, Sparkles, Brain, Ghost
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────
const CITIES = ['Any Location', 'Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Chennai', 'Delhi NCR', 'Noida', 'Jaipur', 'Ahmedabad', 'Kolkata', 'Remote'];
const EXP_OPTS = ['Fresher (0 yr)', '0-1 year', '1-2 years', '2-4 years', '4+ years'];
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
    toast.success('Profile saved! ✅');
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

// ── Email Modal ────────────────────────────────────────────────────
// ── Email Modal ────────────────────────────────────────────────────
function EmailModal({ job, userProfile, onUpdateProfile, resumeData, resumeText, onClose }) {
  const [email, setEmail]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editMode, setEdit]     = useState(false);
  const [editBody, setEditBody] = useState('');
  
  const [profileForm, setProfileForm] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    background: userProfile?.background || '',
    skills: userProfile?.skills || '',
  });
  const [isEditingProfile, setIsEditingProfile] = useState(!userProfile);

  useEffect(() => { generateEmail(); }, []);

  const generateEmail = async (overrideProfile) => {
    setLoading(true);
    const activeProfile = overrideProfile || userProfile;
    try {
      const { data } = await discoverAPI.getOutreachEmail({
        job,
        userName:            activeProfile?.name       || '',
        userEmail:           activeProfile?.email      || '',
        userBackground:      activeProfile?.background || '',
        userSkills:          activeProfile?.skills ? activeProfile.skills.split(',').map(s => s.trim()) : [],
        // Resume analysis data for ultra-personalized email
        resumeSkillsPresent: resumeData?.skillsPresent || [],
        resumeSkillsMissing: resumeData?.skillsMissing || [],
        resumeImprovement:   resumeData?.improvement  || '',
        resumeText:          resumeText || '',
      });
      setEmail(data);
      setEditBody(data.body || '');
    } catch (err) { toast.error('Could not generate email'); }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) return toast.error('Enter your name');
    if (!profileForm.email.trim()) return toast.error('Enter your email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email.trim())) {
      return toast.error('Please enter a valid email address (e.g. user@example.com)');
    }
    
    const updatedProfile = { ...profileForm };
    onUpdateProfile(updatedProfile);
    setIsEditingProfile(false);
    toast.success('Profile saved! Customizing email...');
    await generateEmail(updatedProfile);
  };

  const mailtoLink = email
    ? `mailto:${job.hrEmail}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(editMode ? editBody : email.body)}`
    : '#';

  const lbl = { fontSize: 10, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 5, letterSpacing: '0.6px', textTransform: 'uppercase' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: isEditingProfile ? 940 : 620, width: '95%', transition: 'max-width 0.25s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Outreach Email Draft</h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '4px 0 0' }}>
              Ready to send to <strong style={{ color: 'var(--teal)' }}>{job.hrEmail}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={15} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isEditingProfile ? '1fr 1.3fr' : '1fr', gap: 24 }}>
          {/* Left Column: Profile Editor */}
          {isEditingProfile && (
            <div style={{ borderRight: window.innerWidth > 768 ? '1px solid var(--border)' : 'none', paddingRight: window.innerWidth > 768 ? 24 : 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <User size={15} color="var(--teal)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Configure Your Profile</span>
              </div>
              <div>
                <label style={lbl}>Full Name *</label>
                <input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} className="inp" placeholder="e.g., Satyam Sharma" />
              </div>
              <div>
                <label style={lbl}>Your Email *</label>
                <input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} className="inp" placeholder="e.g., satyam@gmail.com" />
              </div>
              <div>
                <label style={lbl}>Your Background</label>
                <textarea value={profileForm.background} onChange={e => setProfileForm(p => ({ ...p, background: e.target.value }))} className="inp" rows={3} placeholder="e.g., Final year BCA student, passionate about MERN development..." />
              </div>
              <div>
                <label style={lbl}>Key Skills (comma separated)</label>
                <input value={profileForm.skills} onChange={e => setProfileForm(p => ({ ...p, skills: e.target.value }))} className="inp" placeholder="React, Node.js, MongoDB..." />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                {userProfile && (
                  <button onClick={() => setIsEditingProfile(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                )}
                <button onClick={handleSaveProfile} className="btn btn-primary" style={{ flex: 2 }}>Save & Customize</button>
              </div>
            </div>
          )}

          {/* Right Column: Email Content */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 0' }}>
                <div className="spinner spinner-teal" style={{ width: 40, height: 40, borderWidth: 3 }} />
                <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Writing your personalized email...</p>
              </div>
            ) : email && (
              <>
                {/* To / Subject */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                  {[
                    { label: 'To', value: job.hrEmail, color: 'var(--teal)' },
                    { label: 'Subject', value: email.subject, color: 'var(--text-1)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: label === 'To' ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', width: 52, flexShrink: 0, letterSpacing: '0.5px' }}>{label.toUpperCase()}</span>
                      <span style={{ fontSize: 13.5, color, fontWeight: label === 'Subject' ? 600 : 400 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Body */}
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px' }}>EMAIL BODY</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!isEditingProfile && (
                        <button onClick={() => setIsEditingProfile(true)} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                          👤 Edit Profile
                        </button>
                      )}
                      <button onClick={() => setEdit(!editMode)} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                        ✏️ {editMode ? 'Preview' : 'Edit'}
                      </button>
                      <CopyBtn text={editMode ? editBody : email.body} />
                      <button onClick={() => generateEmail()} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                        <RefreshCw size={11} /> Rewrite
                      </button>
                    </div>
                  </div>
                  {editMode ? (
                    <textarea value={editBody} onChange={e => setEditBody(e.target.value)} className="inp"
                      rows={10} style={{ resize: 'vertical', fontSize: 13.5, lineHeight: 1.7, fontFamily: 'inherit' }} />
                  ) : (
                    <pre style={{
                      whiteSpace: 'pre-wrap', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.75,
                      background: 'var(--bg-surface)', padding: '16px 18px', borderRadius: 10,
                      border: '1px solid var(--border)', maxHeight: 280, overflowY: 'auto',
                      fontFamily: 'inherit', margin: 0,
                    }}>{email.body}</pre>
                  )}
                </div>

                {/* Tips */}
                {email.tips?.length > 0 && (
                  <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 6, letterSpacing: '0.5px' }}>💡 OUTREACH TIPS</div>
                    {email.tips.map((t, i) => <div key={i} style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 4 }}>• {t}</div>)}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <a href={mailtoLink} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', textDecoration: 'none' }}>
                    <Send size={15} /> Open in Mail App
                  </a>
                  <CopyBtn text={`To: ${job.hrEmail}\nSubject: ${email.subject}\n\n${editMode ? editBody : email.body}`} />
                </div>
                <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)', marginTop: 10, margin: 0 }}>
                  "Open in Mail App" will launch Gmail, Outlook, or your default email client with everything pre-filled
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Job Card ───────────────────────────────────────────────────────
function JobCard({ job, selected, onSelect, resumeAnalyzed }) {
  const modeColors = { Remote: '#10b981', WFH: '#10b981', Hybrid: '#3b82f6', 'On-site': '#f59e0b' };
  const typeColors = { 'Full-time': '#00c9a7', Internship: '#8b5cf6', Contract: '#f59e0b' };

  return (
    <div onClick={() => onSelect(job)}
      style={{
        background: selected ? 'linear-gradient(135deg,rgba(0,201,167,0.07),rgba(59,130,246,0.04))' : 'var(--bg-card)',
        border: `1px solid ${selected ? 'rgba(0,201,167,0.35)' : 'var(--border)'}`,
        borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
        transition: 'all 0.2s', marginBottom: 10,
        boxShadow: selected ? '0 4px 20px rgba(0,201,167,0.1)' : 'none',
      }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <CompanyAvatar logo={job.logo} color={job.logoColor || '#00c9a7'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-1)', marginBottom: 2 }}>{job.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{job.company}</span>
                <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                <span style={{ fontSize: 12 }}>{job.companyType}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {resumeAnalyzed && job.matchScore ? (
                <div style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                  background: job.matchScore >= 85 ? 'rgba(16,185,129,0.12)' : job.matchScore >= 70 ? 'rgba(0,201,167,0.12)' : 'rgba(245,158,11,0.12)',
                  color: job.matchScore >= 85 ? '#10b981' : job.matchScore >= 70 ? '#00c9a7' : '#f59e0b',
                  border: `1px solid ${job.matchScore >= 85 ? 'rgba(16,185,129,0.25)' : job.matchScore >= 70 ? 'rgba(0,201,167,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  marginBottom: 4,
                }}>{job.matchScore}% fit</div>
              ) : (
                <div style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.04)', color: 'var(--text-3)', border: '1px solid var(--border)', marginBottom: 4, whiteSpace: 'nowrap' }}>
                  📄 Upload resume
                </div>
              )}
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', textAlign: 'right' }}>{job.posted}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} />{job.location}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-3)', opacity: 0.4 }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fbbf24' }}>{job.salary}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-3)', opacity: 0.4 }} />
            <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: 600, background: `${modeColors[job.mode] || '#3b82f6'}12`, color: modeColors[job.mode] || '#3b82f6' }}>{job.mode}</span>
            <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 20, fontWeight: 600, background: `${typeColors[job.type] || '#00c9a7'}12`, color: typeColors[job.type] || '#00c9a7' }}>{job.type}</span>
            {job.openings > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10} />{job.openings} openings</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Job Detail Panel ───────────────────────────────────────────────
function JobDetailPanel({ job, onClose, onSave, userProfile, onWriteEmail, onGhostRate, onFollowup, onInterview, resumeAnalyzed }) {
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
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,201,167,0.2)', borderRadius: 18, overflow: 'hidden', position: 'sticky', top: 20 }}>
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
          { label: 'Salary', value: job.salary, color: '#fbbf24' },
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

      {/* Fixed bottom actions */}
      <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex:1 }}>
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
export default function JobDiscovery({ initialRole, initialSkills, resumeAnalyzed, resumeData, resumeText }) {
  const [role, setRole]         = useState(initialRole || '');
  const [city, setCity]         = useState('Bangalore');
  const [experience, setExp]    = useState('Fresher (0 yr)');
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

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
      doSearch(initialRole);
    } else {
      const defaultRole = "Software Engineer";
      setRole(defaultRole);
      doSearch(defaultRole);
    }
  }, [initialRole]);

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
      toast.success(`${job.company} added to tracker! 📌`);
    } catch { toast.error('Failed to add to tracker'); }
  };

  const handleWriteEmail = (job) => { setEmailJob(job); };
  const handleGhostRate  = (job) => setGhostJob(job);
  const handleFollowup   = (job) => setFollowupJob(job);
  const handleInterview  = (job) => setInterviewJob(job);

  const filtered = jobs.filter(j => {
    if (modeFilter !== 'Any' && j.mode !== modeFilter) return false;
    if (typeFilter !== 'Any' && j.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="page-enter" style={{ padding:'28px 28px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.5px', margin:0 }}>Job Discovery</h1>
              <span className="info-pill"><Zap size={11} />Smart Matching</span>
            </div>
            <p style={{ fontSize:13.5, color:'var(--text-3)', margin:0 }}>
              Open positions across 100+ Indian companies — apply directly via email
            </p>
          </div>
          <button onClick={() => setShowProfile(true)} className="btn btn-ghost" style={{ gap:8, fontSize:13 }}>
            <User size={14} />
            {userProfile ? <span>{userProfile.name} <span style={{ opacity:0.5 }}>· Edit Profile</span></span> : 'Set Profile for Email Automation'}
          </button>
        </div>

        {!resumeAnalyzed && (
          <div style={{ marginTop:14, padding:'10px 16px', background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#fbbf24' }}>
            <AlertCircle size={15} />
            <span>Upload your resume in <strong>Resume Match</strong> to see your personal fit % for each job</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="card-static" style={{ padding:20, marginBottom:20 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:'2', minWidth:220 }}>
            <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)' }} />
            <input value={role} onChange={e => setRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Search any role (e.g. Software Engineer, Marketing, Doctor, Sales, Teacher...)"
              className="inp" style={{ paddingLeft:38, height:46, fontSize:15 }} />
          </div>
          <select value={city} onChange={e => setCity(e.target.value)} className="inp" style={{ width:160, height:46 }}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={experience} onChange={e => setExp(e.target.value)} className="inp" style={{ width:150, height:46 }}>
            {EXP_OPTS.map(e => <option key={e}>{e}</option>)}
          </select>
          <button onClick={() => doSearch()} disabled={loading || !role.trim()} className="btn btn-primary" style={{ height:46, paddingInline:28, whiteSpace:'nowrap' }}>
            {loading ? <><div className="spinner" />Searching...</> : <><Search size={15} />Find Jobs</>}
          </button>
        </div>
        {/* Presets removed per request */}
      </div>

      {/* Content */}
      {!hasSearched && !loading && (
        <div className="empty-state">
          <div className="empty-icon float"><Briefcase size={28} color="var(--teal)" /></div>
          <h3 style={{ fontSize:18, fontWeight:700 }}>Find your next opportunity</h3>
          <p style={{ fontSize:13.5, color:'var(--text-3)' }}>Search any role above to look up open vacancies.</p>
        </div>
      )}

      {loading && (
        <div className="empty-state">
          <div className="spinner spinner-teal" style={{ width:48, height:48, borderWidth:4 }} />
          <h3 style={{ fontSize:17, fontWeight:700, marginTop:16 }}>Searching open positions...</h3>
          <p style={{ fontSize:13, color:'var(--text-3)' }}>Scanning 100+ companies across India</p>
        </div>
      )}

      {!loading && hasSearched && (
        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 440px' : '1fr', gap:20, alignItems:'start' }}>
          {/* List */}
          <div>
            {/* Filter row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
              <div style={{ fontSize:13.5, color:'var(--text-2)', fontWeight:600 }}>
                <span style={{ color:'var(--teal)', fontWeight:900, fontSize:17 }}>{filtered.length}</span> positions · {city}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <Filter size={13} color="var(--text-3)" />
                <select value={modeFilter} onChange={e => setModeFilter(e.target.value)} className="inp" style={{ height:34, width:'auto', fontSize:12 }}>
                  {['Any','On-site','Hybrid','Remote','WFH'].map(m => <option key={m}>{m}</option>)}
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="inp" style={{ height:34, width:'auto', fontSize:12 }}>
                  {['Any','Full-time','Internship','Contract'].map(t => <option key={t}>{t}</option>)}
                </select>
                <button onClick={() => doSearch()} className="btn btn-ghost btn-icon" style={{ height:34, width:34 }} title="Refresh">
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize:40 }}>🔍</div>
                <h3 style={{ fontSize:16, fontWeight:700 }}>No results with current filters</h3>
                <button onClick={() => { setModeFilter('Any'); setTypeFilter('Any'); }} className="btn btn-ghost btn-sm">Reset filters</button>
              </div>
            ) : (
              filtered.map(job => (
                <JobCard key={job.id} job={job} selected={selected?.id === job.id}
                  onSelect={setSelected} resumeAnalyzed={resumeAnalyzed} />
              ))
            )}

            {/* Load More */}
            {hasMore && !loading && (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <button onClick={loadMore} disabled={loadingMore} className="btn btn-ghost" style={{ minWidth:180 }}>
                  {loadingMore ? <><div className="spinner" />Loading more...</> : <><Zap size={14} />Load More Jobs</>}
                </button>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <JobDetailPanel
              job={selected} onClose={() => setSelected(null)}
              onSave={handleSaveJob} userProfile={userProfile}
              onWriteEmail={handleWriteEmail}
              onGhostRate={handleGhostRate}
              onFollowup={handleFollowup}
              onInterview={handleInterview}
              resumeAnalyzed={resumeAnalyzed}
            />
          )}
        </div>
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
      {followupJob && (
        <FollowupEngine
          job={followupJob}
          userProfile={userProfile}
          onClose={() => setFollowupJob(null)}
        />
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

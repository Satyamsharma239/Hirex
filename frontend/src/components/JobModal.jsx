import React, { useState, useEffect } from 'react';
import { X, Building2, Briefcase, Calendar, FileText, MapPin, DollarSign, StickyNote } from 'lucide-react';

const STATUS_OPTIONS = ['Saved', 'Applied', 'Interview', 'Offered', 'Rejected'];
const STATUS_COLORS = { Saved: '#8b5cf6', Applied: '#3b82f6', Interview: '#f59e0b', Offered: '#10b981', Rejected: '#f43f5e' };
const ROLE_SUGGESTIONS = [
  'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'MERN Stack Developer',
  'React Developer', 'Node.js Developer', 'Software Engineer', 'DevOps Engineer',
  'Data Analyst', 'UI/UX Designer', 'Android Developer', 'Cloud Engineer'
];

const SECTIONS = [
  { id: 'basic',   label: 'Basic',   icon: '📋' },
  { id: 'details', label: 'Details', icon: '📝' },
  { id: 'notes',   label: 'Notes',   icon: '🗒️' },
];

export default function JobModal({ isOpen, onClose, onSubmit, editingJob }) {
  const [form, setForm] = useState({ company:'', role:'', status:'Applied', jobDescription:'', appliedDate: new Date().toISOString().split('T')[0], location:'', salary:'', notes:'' });
  const [section, setSection] = useState('basic');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSection('basic');
    setForm(editingJob ? {
      company: editingJob.company || '',
      role: editingJob.role || '',
      status: editingJob.status || 'Applied',
      jobDescription: editingJob.jobDescription || '',
      appliedDate: editingJob.appliedDate ? new Date(editingJob.appliedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      location: editingJob.location || '',
      salary: editingJob.salary || '',
      notes: editingJob.notes || '',
    } : { company:'', role:'', status:'Applied', jobDescription:'', appliedDate: new Date().toISOString().split('T')[0], location:'', salary:'', notes:'' });
  }, [editingJob, isOpen]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try { await onSubmit(form); onClose(); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 7, letterSpacing: '0.6px', textTransform: 'uppercase' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
              {editingJob ? 'Edit Application' : 'Add Application'}
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>
              {editingJob ? 'Update the details below' : 'Track a new job opportunity'}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16} /></button>
        </div>

        {/* Section tabs */}
        <div className="tab-bar" style={{ marginBottom: 20 }}>
          {SECTIONS.map(s => (
            <button key={s.id} type="button" onClick={() => setSection(s.id)}
              className={`tab-btn ${section === s.id ? 'active' : ''}`} style={{ flex: 1 }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {section === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input required value={form.company} onChange={e => set('company', e.target.value)}
                  placeholder="e.g., TCS, Infosys, Flipkart..." className="inp" />
              </div>
              <div>
                <label style={labelStyle}>Role / Position *</label>
                <input required value={form.role} onChange={e => set('role', e.target.value)}
                  placeholder="e.g., Full Stack Developer..." className="inp" list="role-suggestions" />
                <datalist id="role-suggestions">
                  {ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
              <div>
                <label style={labelStyle}>Application Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
                  {STATUS_OPTIONS.map(s => {
                    const c = STATUS_COLORS[s];
                    const sel = form.status === s;
                    return (
                      <button key={s} type="button" onClick={() => set('status', s)}
                        style={{
                          padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600,
                          fontSize: 13, transition: 'all 0.2s', fontFamily: 'inherit',
                          border: `1px solid ${sel ? c + '60' : 'var(--border)'}`,
                          background: sel ? c + '18' : 'var(--bg-surface)',
                          color: sel ? c : 'var(--text-3)',
                        }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Date Applied</label>
                <input type="date" value={form.appliedDate} onChange={e => set('appliedDate', e.target.value)} className="inp" />
              </div>
            </div>
          )}

          {section === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Location</label>
                <input value={form.location} onChange={e => set('location', e.target.value)}
                  placeholder="e.g., Bangalore, Remote, Mumbai..." className="inp" />
              </div>
              <div>
                <label style={labelStyle}>Salary / Package</label>
                <input value={form.salary} onChange={e => set('salary', e.target.value)}
                  placeholder="e.g., 6 LPA, 8-10 LPA, Negotiable..." className="inp" />
              </div>
              <div>
                <label style={labelStyle}>Job Description</label>
                <textarea value={form.jobDescription} onChange={e => set('jobDescription', e.target.value)}
                  placeholder="Paste the job description here — useful for Resume Match analysis later..."
                  className="inp" rows={6} style={{ resize: 'vertical' }} />
              </div>
            </div>
          )}

          {section === 'notes' && (
            <div>
              <label style={labelStyle}>Your Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Recruiter name, HR contact, interview feedback, things to remember..."
                className="inp" rows={9} style={{ resize: 'vertical' }} />
              <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 8 }}>
                💡 Private notes — only visible to you.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <><div className="spinner" /> Saving...</> : editingJob ? '✅ Update' : '➕ Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

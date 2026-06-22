import React, { useState, useEffect, useCallback } from 'react';
import { jobsAPI, aiAPI, featuresAPI } from '../services/api';
import JobModal from './JobModal';
import toast from 'react-hot-toast';
import {
  Plus, Search, Pencil, Trash2, RefreshCw,
  Briefcase, Users, Trophy, TrendingUp,
  Calendar, MapPin, DollarSign, ArrowUpRight,
  SlidersHorizontal, ChevronDown, LayoutList, LayoutGrid, CheckCircle2, AlertCircle, Bookmark, Compass, X, Printer,
  Sparkles, Check, Copy, Send, Brain, Clock, FileText
} from 'lucide-react';
import { FunnelChart, Funnel, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

const STATUS_META = {
  Saved:     { badge: 'badge-saved',     dot: '#8b5cf6', emoji: '🔖', label: 'Saved'     },
  Applied:   { badge: 'badge-applied',   dot: '#3b82f6', emoji: '📤', label: 'Applied'   },
  Interview: { badge: 'badge-interview', dot: '#f59e0b', emoji: '🎯', label: 'Interview' },
  Offered:   { badge: 'badge-offered',   dot: '#10b981', emoji: '🎉', label: 'Offered'   },
  Rejected:  { badge: 'badge-rejected',  dot: '#f43f5e', emoji: '❌', label: 'Rejected'  },
};

function CountUp({ to }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!to) { setN(0); return; }
    let cur = 0, timer;
    const step = Math.max(1, Math.ceil(to / 25));
    timer = setInterval(() => {
      cur = Math.min(cur + step, to);
      setN(cur);
      if (cur >= to) clearInterval(timer);
    }, 35);
    return () => clearInterval(timer);
  }, [to]);
  return <>{n}</>;
}

const STAT_CONFIG = [
  { key: 'total',      label: 'Total Applied', icon: Briefcase,  color: '#00c9a7', trackKey: 'conversionRate', trackLabel: 'Interview rate', trackColor: '#00c9a7' },
  { key: 'interviews', label: 'Interviews',    icon: Users,      color: '#f59e0b', trackKey: null },
  { key: 'offered',    label: 'Offers',        icon: Trophy,     color: '#10b981', trackKey: 'offerRate', trackLabel: 'Offer rate', trackColor: '#10b981' },
  { key: 'rejected',   label: 'Rejected',      icon: TrendingUp, color: '#f43f5e', trackKey: null },
];

export default function Dashboard({ onNavigate, resumeText, resumeData }) {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('board'); // 'list' or 'board'
  const [bookmarkletModal, setBookmarkletModal] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [jr, sr] = await Promise.all([jobsAPI.getAll(), jobsAPI.getStats()]);
      setJobs(jr.data); setStats(sr.data);
    } catch { toast.error('Cannot reach server. Is backend running on port 5001?'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (data) => {
    await jobsAPI.create(data);
    toast.success('Application added! 🎉');
    fetchAll();
  };
  const handleUpdate = async (data) => {
    await jobsAPI.update(editingJob._id, data);
    toast.success('Updated! ✅');
    fetchAll();
  };
  const handleDelete = async (id, co) => {
    if (!confirm(`Delete ${co}?`)) return;
    await jobsAPI.delete(id);
    toast.success('Removed');
    fetchAll();
  };
  const handleStatusChange = async (id, status) => {
    await jobsAPI.update(id, { status });
    toast.success(`→ ${status}`);
    fetchAll();
  };
  const handleDrawerJobUpdate = async (id, updatedFields) => {
    try {
      const { data } = await jobsAPI.update(id, updatedFields);
      setSelectedJob(data);
      fetchAll();
      return data;
    } catch (e) {
      toast.error('Failed to update job details');
    }
  };

  const filtered = jobs
    .filter(j => filterStatus === 'All' || j.status === filterStatus)
    .filter(j =>
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.role.toLowerCase().includes(search.toLowerCase()) ||
      (j.location || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date')    return new Date(b.appliedDate) - new Date(a.appliedDate);
      if (sortBy === 'company') return a.company.localeCompare(b.company);
      return a.role.localeCompare(b.role);
    });

  return (
    <div className="page-enter" style={{ padding: '28px 28px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>Job Tracker</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13.5, marginTop: 4 }}>Manage and automate your applications</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}>
            <Printer size={14} color="#00c9a7" /> Export PDF
          </button>
          <button onClick={() => setBookmarkletModal(true)} className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}>
            <Compass size={14} color="#8b5cf6" /> Save from Web
          </button>
          <button onClick={() => { setEditingJob(null); setModalOpen(true); }} className="btn btn-primary" style={{ boxShadow: '0 4px 12px rgba(0,201,167,0.25)' }}>
            <Plus size={14} /> Add Application
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px,1fr))', gap: 14, marginBottom: 24 }}>
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, trackKey, trackLabel, trackColor }) => (
          <div key={key} className="stat-card" style={{ '--top-gradient': `linear-gradient(90deg, transparent, ${color}60, transparent)` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `${color}18`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={17} color={color} />
              </div>
              <ArrowUpRight size={13} color="var(--text-3)" />
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-1.5px', lineHeight: 1 }}>
              {loading ? <span style={{ color: 'var(--text-3)', fontSize: 20 }}>—</span> : <CountUp to={stats[key] || 0} />}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 6, fontWeight: 600 }}>{label}</div>
            {trackKey && stats[trackKey] !== undefined && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{trackLabel}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: trackColor }}>{stats[trackKey]}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(stats[trackKey], 100)}%`, background: `linear-gradient(90deg, ${trackColor}, ${trackColor}99)` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Application Pipeline - Recharts Funnel */}
      {stats.total > 0 && (
        <div className="card-static" style={{ padding: '20px', marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 10, letterSpacing: '1px' }}>CONVERSION FUNNEL</div>
          <div style={{ height: 160, width: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0d1f38', border: '1px solid rgba(0,201,167,0.2)', borderRadius: 8, color: '#fff', fontSize: 13 }} />
                <Funnel
                  dataKey="value"
                  data={[
                    { name: 'Applied', value: stats.applied || 0, fill: '#3b82f6' },
                    { name: 'Interview', value: stats.interviews || 0, fill: '#f59e0b' },
                    { name: 'Offered', value: stats.offered || 0, fill: '#10b981' }
                  ].filter(d => d.value > 0)}
                  isAnimationActive
                >
                  <LabelList position="right" fill="#e8f0fe" stroke="none" dataKey="name" style={{ fontSize: 13, fontWeight: 600 }} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
            {stats.rejected > 0 && (
              <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(244,63,94,0.1)', borderRadius: 20, border: '1px solid rgba(244,63,94,0.2)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e' }} />
                <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 600 }}>{stats.rejected} Rejected</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="card-static" style={{ overflow: 'hidden' }}>
        {/* Table Controls */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search company, role, location..." className="inp"
              style={{ paddingLeft: 36, height: 38 }} />
          </div>

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {['All', 'Saved', 'Applied', 'Interview', 'Offered', 'Rejected'].map(s => {
              const cnt = s === 'All' ? jobs.length : jobs.filter(j => j.status === s).length;
              const active = filterStatus === s;
              const color = { Saved:'#8b5cf6', Applied:'#3b82f6', Interview:'#f59e0b', Offered:'#10b981', Rejected:'#f43f5e', All:'#00c9a7' }[s];
              return (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${active ? color + '50' : 'var(--border)'}`,
                    background: active ? color + '15' : 'transparent',
                    color: active ? color : 'var(--text-3)', cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                  {s} <span style={{ opacity: 0.7 }}>({cnt})</span>
                </button>
              );
            })}
          </div>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="inp"
            style={{ width: 'auto', height: 38, paddingRight: 30 }}>
            <option value="date">Latest First</option>
            <option value="company">A-Z Company</option>
            <option value="role">A-Z Role</option>
          </select>
          
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, marginLeft: 'auto' }}>
            <button onClick={() => setViewMode('list')} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', background: viewMode === 'list' ? 'rgba(255,255,255,0.08)' : 'transparent', color: viewMode === 'list' ? 'var(--text-1)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
              <LayoutList size={14} /> <span style={{ fontSize: 12, fontWeight: 600 }}>List</span>
            </button>
            <button onClick={() => setViewMode('board')} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', background: viewMode === 'board' ? 'rgba(255,255,255,0.08)' : 'transparent', color: viewMode === 'board' ? 'var(--text-1)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
              <LayoutGrid size={14} /> <span style={{ fontSize: 12, fontWeight: 600 }}>Board</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="empty-state">
            <div className="spinner spinner-teal" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <p style={{ color: 'var(--text-3)', marginTop: 12 }}>Loading applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Briefcase size={28} color="var(--teal)" /></div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)' }}>
              {search || filterStatus !== 'All' ? 'No results found' : 'Start tracking your journey'}
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>
              {search || filterStatus !== 'All' ? 'Try adjusting filters' : 'Discover open vacancies and start applying to automate tracking'}
            </p>
            {!search && filterStatus === 'All' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => onNavigate && onNavigate('discover')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Compass size={15} /> Find Open Vacancies
                </button>
                <button onClick={() => { setEditingJob(null); setModalOpen(true); }} className="btn btn-ghost" style={{ border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> Track Manually
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['Company', 'Role', 'Status', 'Location', 'Date Applied', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(job => {
                  const m = STATUS_META[job.status] || STATUS_META.Applied;
                  return (
                    <tr key={job._id} onClick={(e) => {
                      if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON' && !e.target.closest('button') && !e.target.closest('select')) {
                        setSelectedJob(job);
                      }
                    }} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{job.company}</div>
                        {job.salary && (
                          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <DollarSign size={10} />{job.salary}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-2)' }}>{job.role}</td>
                      <td>
                        <select value={job.status}
                          onChange={e => handleStatusChange(job._id, e.target.value)}
                          className={`badge ${m.badge}`}
                          style={{ cursor: 'pointer', border: 'none', background: 'transparent', fontWeight: 600 }}
                          onClick={e => e.stopPropagation()}>
                          {Object.keys(STATUS_META).map(s => (
                            <option key={s} value={s} style={{ background: '#0a1628', color: '#e8f0fe' }}>{STATUS_META[s].emoji} {s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {job.location ? <><MapPin size={11} />{job.location}</> : '—'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} />
                          {new Date(job.appliedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>Open Co-Pilot →</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, color: 'var(--text-3)', borderTop: '1px solid var(--border)' }}>
              Showing {filtered.length} of {jobs.length} applications
            </div>
          </div>
        ) : (
          /* Kanban Board */
          <div style={{ display: 'flex', gap: 16, padding: '20px', overflowX: 'auto', minHeight: 500, alignItems: 'flex-start' }}>
            {Object.keys(STATUS_META).map(status => {
              const columnJobs = filtered.filter(j => j.status === status);
              const meta = STATUS_META[status];
              return (
                <div key={status}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onDragLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.style.background = 'transparent';
                    const id = e.dataTransfer.getData('jobId');
                    if (id) handleStatusChange(id, status);
                  }}
                  style={{ flex: '0 0 280px', minHeight: 200, background: 'transparent', borderRadius: 12, transition: 'background 0.2s', display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.dot, boxShadow: `0 0 8px ${meta.dot}60` }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{status}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 12 }}>{columnJobs.length}</span>
                  </div>
                  
                  {columnJobs.map(job => (
                    <div key={job._id}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('jobId', job._id)}
                      onClick={(e) => {
                        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                          setSelectedJob(job);
                        }
                      }}
                      className="card"
                      style={{ padding: 16, cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{job.company}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>{job.role}</div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11.5, color: 'var(--text-3)' }}>
                        {job.location && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {job.location}</div>}
                        {job.salary && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={11} /> {job.salary}</div>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} />
                        {new Date(job.appliedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  ))}
                  {columnJobs.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, color: 'var(--text-3)', fontSize: 12 }}>
                      Drop jobs here
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <JobModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        onSubmit={editingJob ? handleUpdate : handleCreate} editingJob={editingJob} />
      {/* Bookmarklet Modal */}
      {bookmarkletModal && (
        <div className="modal-overlay" onClick={() => setBookmarkletModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bookmark size={18} color="#8b5cf6" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Save Jobs from Anywhere</h3>
              </div>
              <button onClick={() => setBookmarkletModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 20 }}>
              Drag the button below to your browser's Bookmarks Bar. When you're looking at a job on LinkedIn, Indeed, or any company site, click the bookmark to instantly save it to your tracker!
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0', background: 'var(--bg-root)', borderRadius: 12, border: '1px dashed var(--border-teal)', marginBottom: 20 }}>
              <a 
                href="javascript:(function(){const d=document;const data={company:d.querySelector('.topcard__org-name-link, .job-details-jobs-unified-top-card__company-name')?.innerText||'Unknown',role:d.querySelector('.top-card-layout__title, .job-details-jobs-unified-top-card__job-title')?.innerText||d.title,location:d.querySelector('.topcard__flavor--bullet')?.innerText||'',link:window.location.href,description:d.body.innerText.substring(0,200),source:window.location.hostname};fetch('http://localhost:5001/api/jobs/external',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()).then(res=>{if(res.success)alert('Job saved to HireX Tracker!');else alert('Failed to save job');}).catch(e=>alert('Error saving job'));})();"
                onClick={e => e.preventDefault()}
                style={{ padding: '10px 20px', background: '#8b5cf6', color: '#fff', borderRadius: 20, fontWeight: 700, fontSize: 14, textDecoration: 'none', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}
              >
                <Bookmark size={14} /> + Save to HireX
              </a>
            </div>
            
            <div style={{ fontSize: 12, color: 'var(--text-3)', background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <strong>Tip:</strong> If you don't see your Bookmarks Bar, press <code>Cmd+Shift+B</code> (Mac) or <code>Ctrl+Shift+B</code> (Windows).
            </div>
          </div>
        </div>
      )}
      {selectedJob && (
        <JobDetailsDrawer
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          resumeText={resumeText}
          resumeData={resumeData}
          onUpdate={handleDrawerJobUpdate}
          onDelete={handleDelete}
          onEdit={(j) => { setEditingJob(j); setModalOpen(true); }}
        />
      )}
    </div>
  );
}

// ── Job Details Slide-in Drawer ──────────────────────────────────────────────
function JobDetailsDrawer({ job, onClose, resumeText, resumeData, onUpdate, onDelete, onEdit }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'copilot'
  const [notes, setNotes] = useState(job.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  // Sync notes when job changes
  useEffect(() => {
    setNotes(job.notes || '');
  }, [job]);

  // AI Co-Pilot states
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);

  const [tailorResult, setTailorResult] = useState(null);
  const [tailorLoading, setTailorLoading] = useState(false);

  const [referralResult, setReferralResult] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);

  const [followupDay, setFollowupDay] = useState(3);
  const [followupResult, setFollowupResult] = useState(null);
  const [followupLoading, setFollowupLoading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    try {
      await onUpdate(job._id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await onUpdate(job._id, { notes });
      toast.success('Notes saved!');
    } catch {
      toast.error('Failed to save notes');
    }
    setSavingNotes(false);
  };

  const handleScanATS = async () => {
    if (!resumeText) return toast.error('Please upload your resume in the Resume Profile tab first.');
    setAtsLoading(true);
    try {
      const { data } = await featuresAPI.scanATS({
        resumeText,
        jobDescription: job.jobDescription || 'No description provided.'
      });
      setAtsResult(data);
      toast.success('ATS Scan Complete! 🎯');
    } catch {
      toast.error('ATS Scan failed.');
    }
    setAtsLoading(false);
  };

  const handleTailorResume = async () => {
    if (!resumeText) return toast.error('Please upload your resume in the Resume Profile tab first.');
    setTailorLoading(true);
    try {
      const { data } = await featuresAPI.tailorResume({
        resumeText,
        jobDescription: job.jobDescription || 'No description provided.'
      });
      setTailorResult(data);
      toast.success('Resume Tailoring Complete! ✨');
    } catch {
      toast.error('Resume tailoring failed.');
    }
    setTailorLoading(false);
  };

  const handleGenerateReferral = async () => {
    setReferralLoading(true);
    try {
      const { data } = await featuresAPI.hackReferral({
        company: job.company,
        role: job.role,
        background: resumeData?.headline || 'MERN Stack Developer',
        jobDescription: job.jobDescription || 'No description provided.'
      });
      setReferralResult(data);
      toast.success('Referral Outreach Strategy Ready! 🧠');
    } catch {
      toast.error('Failed to generate outreach strategy.');
    }
    setReferralLoading(false);
  };

  const handleGenerateFollowup = async () => {
    setFollowupLoading(true);
    try {
      const { data } = await featuresAPI.getFollowupSequence({
        job,
        userName: resumeData?.name || 'Applicant',
        userEmail: resumeData?.email || 'applicant@email.com',
        userSkills: resumeData?.topSkills?.join(', ') || '',
        dayNumber: followupDay,
        previousEmailSubject: `Application for ${job.role}`
      });
      setFollowupResult(data);
      toast.success('Follow-up Email Drafted! 📬');
    } catch {
      toast.error('Failed to generate follow-up email.');
    }
    setFollowupLoading(false);
  };

  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text);
    toast.success(message || 'Copied to clipboard!');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose} 
        style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99
        }} 
      />

      {/* Drawer */}
      <div 
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', width: '540px', maxWidth: '100vw',
          background: 'rgba(6, 13, 26, 0.98)', backdropFilter: 'blur(30px)', borderLeft: '1px solid var(--border)',
          zIndex: 100, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,0.6)',
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                {job.company}
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-1)', margin: '4px 0 0', letterSpacing: '-0.5px' }}>
                {job.role}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onEdit(job)} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px', fontSize: 12 }}>
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => { onDelete(job._id, job.company); onClose(); }} className="btn btn-ghost btn-sm" style={{ padding: '6px 10px', fontSize: 12, color: 'var(--rose)' }}>
                <Trash2 size={13} /> Delete
              </button>
              <button onClick={onClose} className="btn-icon" style={{ padding: 6 }}><X size={18} /></button>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color="var(--text-3)" /> {job.location || '—'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={13} color="var(--text-3)" /> {job.salary || '—'}
            </div>
          </div>

          {/* Tabs */}
          <div className="tab-bar" style={{ marginTop: 8 }}>
            <button onClick={() => setActiveTab('overview')} className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}>
              📋 Details
            </button>
            <button onClick={() => setActiveTab('copilot')} className={`tab-btn ${activeTab === 'copilot' ? 'active' : ''}`} style={{ flex: 1, padding: '8px 12px', fontSize: 13, gap: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={13} color="var(--teal)" /> AI Co-Pilot
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Status Picker */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 8, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Application Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {Object.keys(STATUS_META).map(s => {
                    const meta = STATUS_META[s];
                    const selected = job.status === s;
                    return (
                      <button key={s} onClick={() => handleStatusChange(s)}
                        style={{
                          padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12,
                          border: `1px solid ${selected ? meta.dot + '60' : 'var(--border)'}`,
                          background: selected ? meta.dot + '15' : 'transparent',
                          color: selected ? meta.dot : 'var(--text-3)',
                          transition: 'all 0.2s', fontFamily: 'inherit'
                        }}>
                        {meta.emoji} {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Applied Date */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Applied Date
                </label>
                <div style={{ fontSize: 13.5, color: 'var(--text-1)' }}>
                  {new Date(job.appliedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.6px', textTransform: 'uppercase', margin: 0 }}>
                    My Notes
                  </label>
                  <button onClick={handleSaveNotes} disabled={savingNotes} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 11 }}>
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="inp" 
                  rows={4} 
                  placeholder="Add details about recruiters, interview rounds, or follow-up notes..." 
                  style={{ fontSize: 13, lineHeight: 1.5 }}
                />
              </div>

              {/* Job Description */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 6, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Job Description
                </label>
                {job.jobDescription ? (
                  <pre style={{
                    whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6,
                    background: 'rgba(255,255,255,0.01)', padding: '12px 14px', borderRadius: 10,
                    border: '1px solid var(--border)', maxHeight: 220, overflowY: 'auto', fontFamily: 'inherit'
                  }}>
                    {job.jobDescription}
                  </pre>
                ) : (
                  <div style={{ padding: '14px 16px', borderRadius: 10, border: '1px dashed var(--border)', color: 'var(--text-3)', fontSize: 12.5, textAlign: 'center' }}>
                    No job description provided. Click Edit to add one to enable AI checks.
                  </div>
                )}
              </div>
            </>
          )}

          {/* AI CO-PILOT TAB */}
          {activeTab === 'copilot' && (
            <>
              {!resumeText ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', border: '1px dashed var(--border-teal)', borderRadius: 14, background: 'rgba(0,201,167,0.02)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🧬</div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>Establish Career DNA First</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '8px 0 16px', lineHeight: 1.5 }}>
                    Please upload your resume in the **Resume Profile** tab to generate your Career DNA. This will unlock ATS scanning, cold outreach, and resume tailoring.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* 1. ATS Match Scan */}
                  <div className="card-static" style={{ padding: 18, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                        <Brain size={14} color="var(--teal)" /> ATS Match Scan
                      </h4>
                      <button onClick={handleScanATS} disabled={atsLoading} className="btn btn-primary btn-sm" style={{ fontSize: 11.5 }}>
                        {atsLoading ? 'Scanning...' : atsResult ? 'Re-Scan' : 'Scan Match'}
                      </button>
                    </div>

                    {!atsResult && !atsLoading && (
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                        Analyze this job description against your resume keywords to check compatibility.
                      </p>
                    )}

                    {atsLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                        <div className="spinner spinner-teal" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>ATS bot parsing resume...</span>
                      </div>
                    )}

                    {atsResult && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: atsResult.atsScore >= 75 ? 'var(--teal)' : 'var(--amber)' }}>
                            {atsResult.atsScore}%
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>
                            <strong>Verdict:</strong> {atsResult.verdict}
                          </div>
                        </div>

                        {atsResult.missingKeywords?.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--rose)', marginBottom: 6, letterSpacing: '0.5px' }}>MISSING KEYWORDS</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {atsResult.missingKeywords.map(kw => (
                                <span key={kw} style={{ fontSize: 11, background: 'rgba(244,63,94,0.08)', color: 'var(--rose)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(244,63,94,0.15)' }}>{kw}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {atsResult.formattingErrors?.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>FORMATTING WARNINGS</div>
                            <ul style={{ margin: 0, paddingLeft: 14, fontSize: 11.5, color: 'var(--text-3)' }}>
                              {atsResult.formattingErrors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. Resume Tailoring */}
                  <div className="card-static" style={{ padding: 18, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                        <FileText size={14} color="#8b5cf6" /> 1-Click Tailor Bullets
                      </h4>
                      <button onClick={handleTailorResume} disabled={tailorLoading} className="btn btn-ghost btn-sm" style={{ fontSize: 11.5, color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                        {tailorLoading ? 'Tailoring...' : tailorResult ? 'Re-Tailor' : 'Generate Bullets'}
                      </button>
                    </div>

                    {!tailorResult && !tailorLoading && (
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                        Rewrite bullet points based on the job requirements to add to your resume.
                      </p>
                    )}

                    {tailorLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5, borderColor: '#8b5cf6' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Aligning keywords and achievements...</span>
                      </div>
                    )}

                    {tailorResult && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>TAILORED PROFESSIONAL SUMMARY</div>
                          <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{tailorResult.tailoredSummary}</p>
                          <button onClick={() => copyToClipboard(tailorResult.tailoredSummary, 'Summary copied!')} className="btn btn-ghost btn-sm" style={{ fontSize: 11, marginTop: 4, padding: '2px 6px' }}><Copy size={11} /> Copy Summary</button>
                        </div>

                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>REWRITTEN BULLET POINTS</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {tailorResult.rewrittenBullets?.map((bullet, i) => (
                              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 4px', lineHeight: 1.4 }}>{bullet}</p>
                                <button onClick={() => copyToClipboard(bullet, 'Bullet copied!')} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '1px 4px' }}><Copy size={10} /> Copy Bullet</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Referral Hacker & Cold Email */}
                  <div className="card-static" style={{ padding: 18, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                        <Send size={14} color="#3b82f6" /> Referral & Cold Email Pitch
                      </h4>
                      <button onClick={handleGenerateReferral} disabled={referralLoading} className="btn btn-ghost btn-sm" style={{ fontSize: 11.5, color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                        {referralLoading ? 'Hacking...' : referralResult ? 'Re-Generate' : 'Find Strategy'}
                      </button>
                    </div>

                    {!referralResult && !referralLoading && (
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                        Identify target titles, email formats, and get a cold email tailored to their pain point.
                      </p>
                    )}

                    {referralLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5, borderColor: '#3b82f6' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Mapping company intelligence...</span>
                      </div>
                    )}

                    {referralResult && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-3)' }}>EMAIL FORMATS</div>
                            {referralResult.emailFormats?.map((f, i) => <div key={i} style={{ fontSize: 11.5, color: 'var(--text-1)', marginTop: 2 }}>{f}</div>)}
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-3)' }}>TARGET TITLES</div>
                            {referralResult.targetTitles?.map((t, i) => <div key={i} style={{ fontSize: 11.5, color: 'var(--text-1)', marginTop: 2 }}>{t}</div>)}
                          </div>
                        </div>

                        <div style={{ background: 'rgba(59,130,246,0.05)', padding: 10, borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: '#60a5fa', marginBottom: 2 }}>PROPOSED COLD EMAIL</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Subject: {referralResult.subjectLine}</div>
                          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: 0, fontFamily: 'inherit' }}>
                            {referralResult.emailBody}
                          </pre>
                          <button onClick={() => copyToClipboard(`Subject: ${referralResult.subjectLine}\n\n${referralResult.emailBody}`, 'Email copied!')} className="btn btn-ghost btn-sm" style={{ fontSize: 10, marginTop: 8, padding: '2px 6px' }}><Copy size={10} /> Copy Full Email</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Smart Follow-up */}
                  <div className="card-static" style={{ padding: 18, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                        <Clock size={14} color="#f59e0b" /> Follow-up Sequence
                      </h4>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <select 
                          value={followupDay} 
                          onChange={e => setFollowupDay(Number(e.target.value))}
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)', fontSize: 11, padding: '2px 4px' }}
                        >
                          <option value={3}>Day 3</option>
                          <option value={7}>Day 7</option>
                          <option value={14}>Day 14</option>
                        </select>
                        <button onClick={handleGenerateFollowup} disabled={followupLoading} className="btn btn-ghost btn-sm" style={{ fontSize: 11.5, color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                          {followupLoading ? 'Drafting...' : 'Draft'}
                        </button>
                      </div>
                    </div>

                    {!followupResult && !followupLoading && (
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                        Get a polished follow-up message depending on the time elapsed since you applied.
                      </p>
                    )}

                    {followupLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5, borderColor: '#f59e0b' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Writing value-add follow-up...</span>
                      </div>
                    )}

                    {followupResult && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                        <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{followupResult.subject}</div>
                          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: 0, fontFamily: 'inherit' }}>
                            {followupResult.body}
                          </pre>
                          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                            <button onClick={() => copyToClipboard(followupResult.body, 'Follow-up copied!')} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '2px 6px' }}><Copy size={10} /> Copy</button>
                            <a href={`mailto:${job.hrEmail || ''}?subject=${encodeURIComponent(followupResult.subject)}&body=${encodeURIComponent(followupResult.body)}`} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '2px 6px', color: 'var(--teal)' }}><Send size={10} /> Send</a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

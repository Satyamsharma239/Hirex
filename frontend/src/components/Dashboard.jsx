import React, { useState, useEffect, useCallback } from 'react';
import { jobsAPI, aiAPI, featuresAPI } from '../services/api';
import JobModal from './JobModal';
import toast from 'react-hot-toast';
import {
  Plus, Search, Pencil, Trash2, RefreshCw,
  Briefcase, Users, Trophy, TrendingUp,
  Calendar, MapPin, DollarSign, ArrowUpRight,
  SlidersHorizontal, ChevronDown, LayoutList, LayoutGrid, CheckCircle2, AlertCircle, Bookmark, Compass, X, Printer, Bell,
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

const getCompanyColor = (companyName) => {
  const colors = ['#00c9a7', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#fb7185', '#ec4899'];
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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

export default function Dashboard({ onNavigate, resumeText, resumeData, onSimulateInterview }) {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const apiHost = window.location.origin.includes('127.0.0.1') || window.location.origin.includes('localhost') ? 'http://127.0.0.1:5001' : window.location.origin;
  const bookmarkletHref = `javascript:(function(){const d=document;const data={company:d.querySelector('.topcard__org-name-link, .job-details-jobs-unified-top-card__company-name')?.innerText||'Unknown',role:d.querySelector('.top-card-layout__title, .job-details-jobs-unified-top-card__job-title')?.innerText||d.title,location:d.querySelector('.topcard__flavor--bullet')?.innerText||'',link:window.location.href,description:d.body.innerText.substring(0,200),source:window.location.hostname};fetch('${apiHost}/api/jobs/external',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()).then(res=>{if(res.success)alert('Job saved to HireX Tracker!');else alert('Failed to save job');}).catch(e=>alert('Error saving job'));})();`;
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
      if (sortBy === 'date') return new Date(b.appliedDate) - new Date(a.appliedDate);
      if (sortBy === 'company') return a.company.localeCompare(b.company);
      return a.role.localeCompare(b.role);
    });
  const totalCount = jobs.length;
  const savedCount = jobs.filter(j => j.status === 'Saved').length;
  const appliedCount = jobs.filter(j => j.status === 'Applied').length;
  const interviewCount = jobs.filter(j => j.status === 'Interview').length;
  const offeredCount = jobs.filter(j => j.status === 'Offered').length;
  const rejectedCount = jobs.filter(j => j.status === 'Rejected').length;
  const activeCount = savedCount + appliedCount + interviewCount;
  const interviewRate = totalCount > 0 ? Math.round((interviewCount / totalCount) * 100) : 0;
  const acceptedOfferCount = jobs.filter(j => j.status === 'Offered' && (j.notes || '').toLowerCase().includes('sign')).length;
  const pendingOfferCount = Math.max(0, offeredCount - acceptedOfferCount);

  return (
    <div className="page-enter" style={{ padding: '28px 28px 40px' }}>
      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.5px', margin: 0 }}>My Application Dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 500 }}>Jan 12, 2023</span>
          <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Bell size={18} color="var(--text-2)" />
            <span style={{ position: 'absolute', top: -1, right: -1, width: 6, height: 6, borderRadius: '50%', background: '#f43f5e' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>Alex R.</span>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', border: '1.5px solid rgba(255,255,255,0.1)' }}>
              AR
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Actions Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <p style={{ color: 'var(--text-3)', fontSize: 13.5, margin: 0 }}>Manage and automate your applications</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)', fontSize: 12.5 }}>
            <Printer size={13} color="#00c9a7" /> Export PDF
          </button>
          <button onClick={() => setBookmarkletModal(true)} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)', fontSize: 12.5 }}>
            <Compass size={13} color="#8b5cf6" /> Save from Web
          </button>
          <button onClick={() => { setEditingJob(null); setModalOpen(true); }} className="btn btn-primary btn-sm" style={{ fontSize: 12.5, boxShadow: '0 4px 12px rgba(0,201,167,0.25)' }}>
            <Plus size={13} /> Add Application
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 24 }}>
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', height: 210 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.8px' }}>TOTAL APPLICATIONS</span>
            <button className="btn-icon" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, height: 'auto', width: 'auto' }}>
              <SlidersHorizontal size={14} color="var(--text-3)" />
            </button>
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>
            {loading ? '—' : <CountUp to={appliedCount} />}
          </div>
          <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 4, fontWeight: 600 }}>
            +12% this month
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', marginTop: 8 }}>
            <svg viewBox="0 0 100 30" style={{ width: '100%', height: 35, overflow: 'visible' }}>
              <path d="M 0 25 Q 15 15 30 18 T 60 5 T 90 12 T 100 8" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0px 2px 6px rgba(0,201,167,0.4))' }} />
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Sent</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginTop: 2 }}>{appliedCount}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Active</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginTop: 2 }}>{activeCount}</div>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', height: 210 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.8px' }}>INTERVIEWS SCHEDULED</span>
            <button className="btn-icon" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, height: 'auto', width: 'auto' }}>
              <SlidersHorizontal size={14} color="var(--text-3)" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px', gap: 12, flex: 1, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>
                {loading ? '—' : <CountUp to={interviewCount} />}
              </div>
              <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 4, fontWeight: 600 }}>
                Active Prep
              </div>
            </div>
            <div style={{ width: 64, height: 64, position: 'relative' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--amber)" strokeWidth="3" strokeDasharray={`${interviewRate}, 100`} strokeLinecap="round" style={{ filter: 'drop-shadow(0px 0px 6px rgba(245,158,11,0.3))' }} />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>
                {interviewRate}%
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Upcoming</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginTop: 2 }}>{interviewCount}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Pending</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginTop: 2 }}>{savedCount}</div>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', height: 210 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.8px' }}>OFFERS RECEIVED</span>
            <button className="btn-icon" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, height: 'auto', width: 'auto' }}>
              <SlidersHorizontal size={14} color="var(--text-3)" />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, flex: 1, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>
                {loading ? '—' : <CountUp to={offeredCount} />}
              </div>
              <div style={{ fontSize: 12, color: 'var(--emerald)', marginTop: 4, fontWeight: 600 }}>
                {pendingOfferCount > 0 ? `${pendingOfferCount} New Offer${pendingOfferCount > 1 ? 's' : ''}` : 'No new offers'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 42, paddingBottom: 2 }}>
              <div style={{ width: 8, height: 12, background: 'var(--border)', borderRadius: 2 }} />
              <div style={{ width: 8, height: 24, background: 'var(--teal)', borderRadius: 2, filter: 'drop-shadow(0px 0px 4px rgba(0,201,167,0.3))' }} />
              <div style={{ width: 8, height: 32, background: 'var(--teal)', borderRadius: 2, filter: 'drop-shadow(0px 0px 4px rgba(0,201,167,0.3))' }} />
              <div style={{ width: 8, height: 20, background: 'var(--amber)', borderRadius: 2, filter: 'drop-shadow(0px 0px 4px rgba(245,158,11,0.3))' }} />
              <div style={{ width: 8, height: 16, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Accepted</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginTop: 2 }}>{acceptedOfferCount}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Pending</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginTop: 2 }}>{pendingOfferCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px', marginBottom: 20, overflow: 'hidden', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 10, letterSpacing: '1px' }}>CONVERSION FUNNEL</div>
        <div style={{ height: 160, width: '100%', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0d1f38', border: '1px solid rgba(0,201,167,0.2)', borderRadius: 8, color: '#fff', fontSize: 13 }} />
              <Funnel
                dataKey="value"
                data={[
                  { name: 'Applied', value: appliedCount, fill: '#3b82f6' },
                  { name: 'Interview', value: interviewCount, fill: '#f59e0b' },
                  { name: 'Offered', value: offeredCount, fill: '#10b981' }
                ]}
                isAnimationActive
              >
                <LabelList position="right" fill="#e8f0fe" stroke="none" dataKey="name" style={{ fontSize: 13, fontWeight: 600 }} />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(244,63,94,0.1)', borderRadius: 20, border: '1px solid rgba(244,63,94,0.2)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e' }} />
            <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 600 }}>{rejectedCount} Rejected</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card" style={{ overflow: 'hidden', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
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
          <div style={{ padding: '20px 20px 8px' }}>
            {filtered.map(job => {
              const comp = job.company.toLowerCase().trim();
              let statusLabel = job.status;
              let statusStyle = {
                color: 'var(--text-2)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              };

              if (job.status === 'Interview') {
                statusLabel = 'Interview Scheduled';
                statusStyle = {
                  color: '#00c9a7',
                  background: 'rgba(0, 201, 167, 0.08)',
                  border: '1px solid rgba(0, 201, 167, 0.25)'
                };
              } else if (job.status === 'Applied') {
                if (comp === 'airbnb') {
                  statusLabel = 'Application Sent';
                  statusStyle = {
                    color: '#f59e0b',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)'
                  };
                } else {
                  statusLabel = 'Applied';
                  statusStyle = {
                    color: '#94a3b8',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  };
                }
              } else if (job.status === 'Offered') {
                statusLabel = 'Offer Pending';
                statusStyle = {
                  color: '#00d2ff',
                  background: 'rgba(0, 210, 255, 0.08)',
                  border: '1px solid rgba(0, 210, 255, 0.35)',
                  boxShadow: '0 0 10px rgba(0, 210, 255, 0.2)'
                };
              }

              let logoBg = 'var(--bg-surface)';
              let logoSVG = null;
              if (comp === 'google') {
                logoBg = '#ffffff';
                logoSVG = (
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                );
              } else if (comp === 'airbnb') {
                logoBg = '#FF5A5F';
                logoSVG = (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffffff">
                    <path d="M23.013 11.233c-.097-.247-.282-.446-.528-.548L12.56 6.347c-.365-.152-.772-.152-1.137 0L1.517 10.685c-.247.102-.432.301-.528.548-.097.247-.076.525.059.754l10.203 10.203c.376.376.985.376 1.361 0l10.203-10.203c.135-.229.156-.507.059-.754zM12 17.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
                  </svg>
                );
              } else if (comp === 'stripe') {
                logoBg = '#635BFF';
                logoSVG = (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffffff">
                    <path d="M13.962 10.3c0-1.2-1.025-1.748-2.662-1.748-1.897 0-3.666.697-4.997 1.64l-1.077-3.128c1.64-.974 3.997-1.616 6.46-1.616 4.306 0 7.228 2.05 7.228 6.075 0 5.485-6.536 6.229-6.536 7.973 0 .717.615.999 1.589.999 2.153 0 4.1-.769 5.562-1.87l1.051 3.076c-1.768 1.256-4.588 1.948-7.074 1.948-4.512 0-7.382-2.128-7.382-6.177 0-5.716 6.818-6.408 6.818-8.232z" />
                  </svg>
                );
              } else if (comp === 'spotify') {
                logoBg = '#121212';
                logoSVG = (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#1DB954">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.076-.336.135-.668.47-.743 3.856-.88 7.15-.506 9.822 1.13.295.178.387.563.205.858zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.082-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.678-1.117 8.243-.574 11.35 1.336.368.226.488.707.261 1.08zm.106-2.833C14.392 8.797 8.577 8.605 5.21 9.627c-.516.156-1.063-.135-1.22-.65-.156-.516.135-1.063.65-1.22 3.86-1.17 10.286-.952 14.35 1.46.465.276.614.877.338 1.34-.276.465-.877.614-1.34.338z"/>
                  </svg>
                );
              }

              let detailText = '';
              if (job.notes && job.notes.includes('Next:')) {
                detailText = job.notes;
              } else if (job.status === 'Interview') {
                detailText = 'Next: Interview Simulator Practice';
              }

              let actionLabel = 'Track';
              if (comp === 'google') actionLabel = 'Task';
              else if (comp === 'airbnb') actionLabel = 'Track';
              else if (comp === 'stripe') actionLabel = 'Review';
              else if (comp === 'spotify') actionLabel = 'Action';

              const rawDate = job.appliedDate ? new Date(job.appliedDate) : new Date();
              const formattedDate = rawDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

              return (
                <div key={job._id} className="premium-list-card" onClick={() => setSelectedJob(job)} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="avatar-container" style={{ background: logoBg, width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justify: 'center', border: logoBg === '#ffffff' ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
                      {logoSVG || job.company.substring(0, 1).toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-1)' }}>{job.company}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{job.role}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      ...statusStyle
                    }}>
                      {statusLabel}
                    </span>
                    {detailText && (
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>{detailText}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500 }}>Applied {formattedDate}</span>
                    <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setSelectedJob(job)} className="btn btn-ghost btn-sm" style={{ padding: '6px 12px', fontSize: 12 }}>
                        View Details
                      </button>
                      <button onClick={() => setSelectedJob(job)} className="btn btn-sm" style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#fbbf24',
                        background: 'rgba(245, 158, 11, 0.05)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 8
                      }}>
                        {actionLabel}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
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
                href={bookmarkletHref}
                onClick={e => e.stopPropagation()} // Let drag work, but stop click bubbling if they click it directly in modal
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
          onSimulateInterview={onSimulateInterview}
        />
      )}
    </div>
  );
}

function JobDetailsDrawer({ job, onClose, resumeText, resumeData, onUpdate, onDelete, onEdit, onSimulateInterview }) {
  const [activeTab, setActiveTab] = useState('overview');
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
          
          {activeTab === 'overview' && (
            <>
              {String(job.status).toLowerCase() === 'interview' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '12px 14px', borderRadius: 10, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Brain size={18} color="#f59e0b" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Practice Mock Interview</div>
                      <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: 0 }}>Prepare for {job.company}'s specific questions.</p>
                    </div>
                  </div>
                  <button onClick={() => { onSimulateInterview && onSimulateInterview(job.company, job.role, job.jobDescription || ''); onClose(); }} className="btn btn-primary btn-sm" style={{ background: '#f59e0b', borderColor: '#f59e0b', fontSize: 12, gap: 4, display: 'flex', alignItems: 'center' }}>
                    Practice <Play size={10} fill="currentColor" />
                  </button>
                </div>
              )}
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
                  
                  {/* 1. Job Compatibility Match Score */}
                  <div className="card-static" style={{ padding: 18, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                        <Brain size={14} color="var(--teal)" /> Job Compatibility Match Score
                      </h4>
                      <button onClick={handleScanATS} disabled={atsLoading} className="btn btn-primary btn-sm" style={{ fontSize: 11.5 }}>
                        {atsLoading ? 'Scanning...' : atsResult ? 'Re-Scan' : 'Scan Match'}
                      </button>
                    </div>

                    <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      This score measures keyword and skill relevance between your active resume and this specific job description. To optimize your general resume layout compliance, use the <strong>Resume Formatting Compliance Score</strong> in the Profile page.
                    </p>

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

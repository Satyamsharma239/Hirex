import React, { useState, useEffect } from 'react';
import { jobsAPI, discoverAPI } from '../services/api';
import { 
  UserCheck, Compass, Briefcase, ChevronRight, Award, Target, TrendingUp, ShieldAlert, CheckCircle2
} from 'lucide-react';

export default function ConsoleOverview({ onNavigate, resumeData, dnaData, auditData }) {
  const [appStats, setAppStats] = useState({ total: 0, applied: 0, interview: 0, offered: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveJobs, setLiveJobs] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await jobsAPI.getAll();
        const stats = { total: data.length, applied: 0, interview: 0, offered: 0 };
        data.forEach(job => {
          const status = String(job.status).toLowerCase();
          if (status === 'applied') stats.applied++;
          else if (status === 'interview') stats.interview++;
          else if (status === 'offered') stats.offered++;
        });
        setAppStats(stats);
        setRecentJobs(data.slice(-3).reverse());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchLiveJobs() {
      setLiveLoading(true);
      try {
        const searchRole = resumeData?.headline?.split('|')[0]?.trim() || 'Software Engineer';
        const { data } = await discoverAPI.searchJobs({ role: searchRole, page: 1 });
        setLiveJobs(data.jobs?.slice(0, 2) || []);
      } catch (err) {
      } finally {
        setLiveLoading(false);
      }
    }
    if (resumeData) {
      fetchLiveJobs();
    }
  }, [resumeData]);

  const candidateName = resumeData?.name || 'Talent';
  const targetRole = resumeData?.headline?.split('|')[0]?.trim() || 'Software Developer';
  const atsScore = auditData?.atsScore || 95;
  const atsGrade = auditData?.atsGrade || 'A';
  const skillsCount = dnaData?.topSkills?.length || 5;

  return (
    <div style={{ padding: '24px 28px', color: 'var(--text-1)' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
          Welcome back, {candidateName}! 👋
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          Your central command console for profile optimization, job matches, and active application pipeline.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 32 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Award size={18} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 6px var(--teal-glow))' }} />
            <span style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--teal)', letterSpacing: '1px' }}>PROFILE HEALTH</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-1)', marginBottom: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {atsGrade} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>({atsScore}/100 ATS Score)</span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ width: `${atsScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--teal), #0891b2)', borderRadius: 3 }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
            ATS compliance score is in the top-tier bracket. Fully optimized.
          </p>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Target size={18} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.3))' }} />
            <span style={{ fontSize: 11.5, fontWeight: 750, color: '#3b82f6', letterSpacing: '1px' }}>TARGET PROFILE</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {targetRole}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
            Outreach engines and matching parameters focused on <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{skillsCount} core skills</span>.
          </p>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <TrendingUp size={18} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.3))' }} />
            <span style={{ fontSize: 11.5, fontWeight: 750, color: '#f59e0b', letterSpacing: '1px' }}>PIPELINE STATUS</span>
          </div>
          {loading ? (
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '6px 0' }}>Loading counters...</div>
          ) : (
            <div style={{ display: 'flex', gap: 16, padding: '2px 0' }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1.1 }}>{appStats.applied}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>Applied</div>
              </div>
              <div style={{ borderRight: '1px solid var(--border)' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1.1 }}>{appStats.interview}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>Interviews</div>
              </div>
              <div style={{ borderRight: '1px solid var(--border)' }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1.1 }}>{appStats.offered}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>Offers</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={18} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 6px var(--teal-glow))' }} /> Resume Optimizer
            </h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase' }}>Detected Gaps & Improvements</div>
              {dnaData?.skillGaps && dnaData.skillGaps.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {dnaData.skillGaps.slice(0, 3).map(gap => (
                    <span key={gap} style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', fontSize: 11, color: '#fb7185', fontWeight: 650, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldAlert size={10} /> Add {gap}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <CheckCircle2 size={13} /> No critical skill gaps detected!
                </div>
              )}
            </div>
          </div>
          <button onClick={() => onNavigate('profile')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between', fontSize: 13 }}>
            Optimize Resume & DNA <ChevronRight size={14} />
          </button>
        </div>

        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Compass size={18} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.3))' }} /> Job Matches
            </h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 16, minHeight: 76 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase' }}>Live Vacancies Match Feed</div>
              {liveLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <div className="spinner spinner-teal" style={{ width: 14, height: 14 }} />
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Scanning openings...</span>
                </div>
              ) : liveJobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {liveJobs.map(job => (
                    <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                        <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{job.company} · {job.location}</div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 800, background: 'rgba(0,201,167,0.06)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                        {job.matchScore}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Search for a role in Job Discovery to load matches.</div>
              )}
            </div>
          </div>
          <button onClick={() => onNavigate('discover')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between', fontSize: 13, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 20px rgba(59,130,246,0.2)' }}>
            Discover Vacancies <ChevronRight size={14} />
          </button>
        </div>

        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={18} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.3))' }} /> Pipeline Tracker
            </h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 16, minHeight: 76 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase' }}>Recent Pipeline Activity</div>
              {recentJobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recentJobs.map(job => {
                    const statusColor = job.status === 'Offered' ? '#10b981' : job.status === 'Interview' ? '#f59e0b' : '#3b82f6';
                    return (
                      <div key={job._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.role}</div>
                          <div style={{ color: 'var(--text-3)', fontSize: 11 }}>{job.company}</div>
                        </div>
                        <span style={{ fontSize: 10.5, color: statusColor, fontWeight: 800, border: `1px solid ${statusColor}25`, background: `${statusColor}08`, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0 }}>
                          {job.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No jobs tracked yet. Add one from Job Discovery!</div>
              )}
            </div>
          </div>
          <button onClick={() => onNavigate('dashboard')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between', fontSize: 13, background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}>
            View Pipelines & Tracker <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

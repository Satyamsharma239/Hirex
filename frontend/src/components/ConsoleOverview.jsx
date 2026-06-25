import React, { useState, useEffect } from 'react';
import { jobsAPI } from '../services/api';
import { 
  UserCheck, Compass, Briefcase, ChevronRight, Award, Target, TrendingUp
} from 'lucide-react';

export default function ConsoleOverview({ onNavigate, resumeData, dnaData, auditData }) {
  const [appStats, setAppStats] = useState({ total: 0, applied: 0, interview: 0, offered: 0 });
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error('Failed to load home console statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const candidateName = resumeData?.name || 'Talent';
  const targetRole = resumeData?.targetRole || 'Software Developer';
  const atsScore = auditData?.atsScore || 95;
  const atsGrade = auditData?.atsGrade || 'A';
  const skillsCount = dnaData?.topSkills?.length || dnaData?.skills?.length || 5;

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
        <div className="glass-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCheck size={18} color="var(--teal)" style={{ filter: 'drop-shadow(0 0 6px var(--teal-glow))' }} /> Resume Optimizer
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '0 0 20px 0', lineHeight: 1.45 }}>
            Analyze your resume parameters against Applicant Tracking Systems, compile dynamic Career DNA metrics, and rewrite bullets.
          </p>
          <button onClick={() => onNavigate('profile')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between', fontSize: 13 }}>
            Manage Resume & DNA <ChevronRight size={14} />
          </button>
        </div>

        <div className="glass-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={18} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.3))' }} /> Job Discovery
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '0 0 20px 0', lineHeight: 1.45 }}>
            Explore vacancies matched with your optimized technical profile and automatically query real-world career listings.
          </p>
          <button onClick={() => onNavigate('discover')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between', fontSize: 13, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 20px rgba(59,130,246,0.2)' }}>
            Discover Vacancies <ChevronRight size={14} />
          </button>
        </div>

        <div className="glass-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={18} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.3))' }} /> Job Tracker
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '0 0 20px 0', lineHeight: 1.45 }}>
            Track application pipelines, manage follow-up sequences, and execute mock simulator interviews to practice answers.
          </p>
          <button onClick={() => onNavigate('dashboard')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between', fontSize: 13, background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}>
            View Pipelines & Tracker <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

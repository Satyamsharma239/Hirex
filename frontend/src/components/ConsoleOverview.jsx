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
  const skillsCount = dnaData?.skills?.length || 5;

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="card-static" style={{ padding: 18, background: 'rgba(0, 201, 167, 0.03)', border: '1px solid rgba(0, 201, 167, 0.15)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Award size={18} color="var(--teal)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', letterSpacing: '0.5px' }}>PROFILE HEALTH</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>
            {atsGrade} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>({atsScore}/100 Score)</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ width: `${atsScore}%`, height: '100%', background: 'var(--teal)' }} />
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: 0 }}>
            ATS compliance score is in the top-tier bracket. Ready to apply.
          </p>
        </div>

        <div className="card-static" style={{ padding: 18, background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Target size={18} color="#3b82f6" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.5px' }}>TARGET PROFILE</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {targetRole}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: 0 }}>
            Keywords emphasized: {skillsCount} skills recognized in current optimization setup.
          </p>
        </div>

        <div className="card-static" style={{ padding: 18, background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <TrendingUp size={18} color="#f59e0b" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.5px' }}>PIPELINE STATUS</span>
          </div>
          {loading ? (
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Loading counters...</div>
          ) : (
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{appStats.applied}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Applied</div>
              </div>
              <div style={{ borderRight: '1px solid var(--border)' }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{appStats.interview}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Interviews</div>
              </div>
              <div style={{ borderRight: '1px solid var(--border)' }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{appStats.offered}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Offers</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="card" style={{ padding: 20, borderRadius: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCheck size={16} color="var(--teal)" /> Resume Optimizer
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            Analyze your resume parameters against Applicant Tracking Systems, compile dynamic Career DNA metrics, and rewrite bullets.
          </p>
          <button onClick={() => onNavigate('profile')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between', fontSize: 12.5 }}>
            Manage Resume & DNA <ChevronRight size={14} />
          </button>
        </div>

        <div className="card" style={{ padding: 20, borderRadius: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={16} color="#3b82f6" /> Job Discovery
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            Explore vacancies matched with your optimized technical profile and automatically query real-world career listings.
          </p>
          <button onClick={() => onNavigate('discover')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between', fontSize: 12.5, background: '#3b82f6', borderColor: '#3b82f6' }}>
            Discover Vacancies <ChevronRight size={14} />
          </button>
        </div>

        <div className="card" style={{ padding: 20, borderRadius: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={16} color="#f59e0b" /> Job Tracker
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            Track application pipelines, manage follow-up sequences, and execute mock simulator interviews to practice answers.
          </p>
          <button onClick={() => onNavigate('dashboard')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between', fontSize: 12.5, background: '#f59e0b', borderColor: '#f59e0b' }}>
            View Pipelines & Tracker <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

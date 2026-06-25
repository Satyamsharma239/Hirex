import React, { useState, useEffect } from 'react';
import { jobsAPI } from '../services/api';
import InterviewSim from './InterviewSim';
import { Brain, Sparkles, AlertCircle, Play, ChevronRight, Briefcase } from 'lucide-react';

export default function InterviewPrep({ resumeData, prefillData, onClearPrefill }) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [activeJobs, setActiveJobs] = useState([]);
  const [simActive, setSimActive] = useState(false);

  useEffect(() => {
    async function fetchInterviewJobs() {
      try {
        const { data } = await jobsAPI.getAll();
        const interviewJobs = data.filter(job => String(job.status).toLowerCase() === 'interview');
        setActiveJobs(interviewJobs);
      } catch (err) {
        console.error('Failed to load interview status jobs:', err);
      }
    }
    fetchInterviewJobs();
  }, []);

  useEffect(() => {
    if (prefillData && prefillData.company) {
      setCompany(prefillData.company);
      setRole(prefillData.role || '');
      setJobDescription(prefillData.description || '');
      onClearPrefill && onClearPrefill();
    } else if (resumeData) {
      setRole(resumeData.targetRole || '');
    }
  }, [prefillData, resumeData, onClearPrefill]);

  const handleQuickStart = (job) => {
    setCompany(job.company);
    setRole(job.role);
    setJobDescription(job.jobDescription || '');
  };

  const handleStartSim = (e) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    setSimActive(true);
  };

  if (simActive) {
    return (
      <div style={{ padding: '10px 0' }}>
        <InterviewSim
          company={company}
          role={role}
          jobDescription={jobDescription}
          resumeData={resumeData}
          onClose={() => setSimActive(false)}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', color: 'var(--text-1)' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brain size={24} color="var(--teal)" /> AI Interview Simulator
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
          Practice real-world behavioral and technical interview questions based on actual corporate panels.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }} className="xyz-grid">
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--teal)', letterSpacing: '0.8px', marginBottom: 16 }}>
            SIMULATION SETUP
          </div>
          
          <form onSubmit={handleStartSim} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Company Name *</label>
              <input 
                required 
                value={company} 
                onChange={e => setCompany(e.target.value)} 
                className="inp" 
                placeholder="e.g. Flipkart, TCS, Zomato..." 
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Target Role / Position *</label>
              <input 
                required 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                className="inp" 
                placeholder="e.g. Full Stack Developer, React Engineer" 
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Job Description Context (Optional)</label>
              <textarea 
                value={jobDescription} 
                onChange={e => setJobDescription(e.target.value)} 
                className="inp" 
                rows={5} 
                placeholder="Paste the job description or vacancy description here for context-specific questions..." 
                style={{ width: '100%', resize: 'none' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={!company.trim() || !role.trim()} 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', gap: 8, padding: '10px 16px', marginTop: 6 }}
            >
              <Play size={14} fill="currentColor" /> Start Interview Simulation
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-static" style={{ padding: 18, background: 'rgba(0,201,167,0.02)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} color="var(--teal)" /> How it works
            </h4>
            <ul style={{ fontSize: 12, color: 'var(--text-3)', paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
              <li style={{ marginBottom: 6 }}>The simulator queries historical questions asked at the specified company and role.</li>
              <li style={{ marginBottom: 6 }}>You will be presented with 8 customized technical, behavioral, and situational questions.</li>
              <li style={{ marginBottom: 6 }}>Enable your microphone to record your answers. The system performs voice transcription.</li>
              <li>Get immediate grade reports, tone analysis, speech speed, and structural tips.</li>
            </ul>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.8px', marginBottom: 12 }}>
              TRACKED INTERVIEWS QUICK-START
            </div>
            
            {activeJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--text-3)', border: '1px dashed var(--border)', borderRadius: 10 }}>
                <Briefcase size={18} style={{ opacity: 0.3, marginBottom: 4 }} />
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>No active pipelines in interview stage</div>
                <p style={{ fontSize: 10.5, margin: '2px 0 0', opacity: 0.8 }}>Move tracked jobs to 'Interview' status on the Job Tracker to see them here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeJobs.map(job => (
                  <button 
                    key={job._id} 
                    onClick={() => handleQuickStart(job)}
                    className="card-static hover-card" 
                    style={{ 
                      padding: 10, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', 
                      borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{job.role}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{job.company}</div>
                    </div>
                    <ChevronRight size={13} color="var(--text-3)" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

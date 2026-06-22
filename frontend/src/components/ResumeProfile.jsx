import React, { useState, useEffect, useCallback } from 'react';
import { aiAPI, discoverAPI, featuresAPI, profileAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Sparkles, CheckCircle, XCircle,
  Brain, TrendingUp, Target, ArrowRight, Globe, Copy, Check,
  Briefcase, Star, Lightbulb, ExternalLink
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

export default function ResumeProfile({ onDiscoverJobs, resumeText, resumeData, dnaData, onUpdateProfile }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  // Hosted profile states
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(() => localStorage.getItem('hirex_published_url') || '');

  // ATS Tester tab states
  const [testerJd, setTesterJd] = useState('');
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerResult, setTesterResult] = useState(null);

  const [activeSubTab, setActiveSubTab] = useState('brand'); // 'brand', 'dna', 'tester'

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    const ext = f?.name.split('.').pop().toLowerCase();
    if (f?.type === 'application/pdf' || ext === 'docx' || ext === 'doc') {
      setFile(f);
    } else {
      toast.error('PDF or DOCX files only');
    }
  }, []);

  const handleUploadClick = () => {
    document.getElementById('resume-profile-file-inp').click();
  };

  const triggerUpload = async (selectedFile) => {
    setLoading(true);
    setTesterResult(null);
    try {
      const fd = new FormData();
      fd.append('resume', selectedFile);
      fd.append('jobDescription', 'Generate a comprehensive analysis of the candidate profile, including MERN stack or general tech skills, weaknesses, experience indicators, and readiness level.');
      
      const { data } = await aiAPI.analyzeResume(fd);
      toast.success('Resume parsed successfully! ✨');
      
      // Auto-run Career DNA and Personal Brand details
      const dnaResp = await discoverAPI.getCareerDNA({
        resumeText: data.resumeText,
        currentSkills: data.skillsPresent || [],
      });

      const brandResp = await featuresAPI.getCareerCard({
        resumeText: data.resumeText,
        userName: selectedFile.name.split('.')[0] || 'Developer',
        skills: data.skillsPresent || [],
        targetRole: 'Software Developer'
      });

      // Pass up to App state to persist
      onUpdateProfile(data.resumeText, brandResp.data, dnaResp.data);
      
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to analyze resume');
    }
    setLoading(false);
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

  const handleTestATS = async () => {
    if (!resumeText) return toast.error('Upload your resume first');
    if (!testerJd || testerJd.trim().length < 30) return toast.error('Paste a job description (min 30 characters)');
    setTesterLoading(true);
    try {
      // Create mockup File for matching
      const blob = new Blob([resumeText], { type: 'text/plain' });
      const mockFile = new File([blob], 'resume.txt', { type: 'text/plain' });
      
      const fd = new FormData();
      fd.append('resume', mockFile);
      fd.append('jobDescription', testerJd);
      
      const { data } = await aiAPI.analyzeResume(fd);
      setTesterResult(data);
      toast.success('ATS keyword match analysis complete! 🎯');
    } catch (err) {
      toast.error(err.response?.data?.error || 'ATS testing failed');
    }
    setTesterLoading(false);
  };

  const copyLink = () => {
    const fullUrl = window.location.origin + publishedUrl;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Link copied to clipboard!');
  };

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-3)', display: 'block', marginBottom: 7, letterSpacing: '0.6px', textTransform: 'uppercase' };

  return (
    <div className="page-enter" style={{ padding: '28px 28px 60px' }}>
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
            <input id="resume-profile-file-inp" type="file" accept=".pdf,.docx,.doc" hidden onChange={e => {
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
              <button onClick={() => setActiveSubTab('tester')} className={`tab-btn ${activeSubTab === 'tester' ? 'active' : ''}`} style={{ flex: 1 }}>
                🎯 ATS Match Tester
              </button>
            </div>

            {/* Brand Tab */}
            {activeSubTab === 'brand' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

            {/* ATS Match Tester Tab */}
            {activeSubTab === 'tester' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: testerResult ? '1fr 1fr' : '1fr', gap: 16 }}>
                  {/* Left Tester Input */}
                  <div className="card-static" style={{ padding: 20 }}>
                    <label style={labelStyle}>Target Job Description</label>
                    <textarea value={testerJd} onChange={e => setTesterJd(e.target.value)} className="inp" rows={7} placeholder="Paste requirements / responsibilities for the job you want to test..." />
                    <button onClick={handleTestATS} disabled={testerLoading} className="btn btn-primary" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
                      {testerLoading ? <><div className="spinner" /> Testing match...</> : <><Sparkles size={14} /> Scan ATS Compatibility</>}
                    </button>
                  </div>

                  {/* Right Tester Output */}
                  {testerResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 20 }}>
                        <CircleScore value={testerResult.matchPercentage || 0} color={testerResult.matchPercentage >= 75 ? '#10b981' : '#f59e0b'} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: testerResult.matchPercentage >= 75 ? '#10b981' : '#f59e0b' }}>
                            {testerResult.verdict}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                            ATS score: {testerResult.atsScore}% · {testerResult.experienceMatch}
                          </div>
                        </div>
                      </div>

                      <div className="card" style={{ padding: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#fb7185', marginBottom: 6 }}>❌ MISSING KEYWORDS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {testerResult.skillsMissing?.length > 0 ? (
                            testerResult.skillsMissing.map(k => <span key={k} style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', color: '#fb7185', fontSize: 11.5 }}>{k}</span>)
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>100% keyword coverage!</span>
                          )}
                        </div>
                      </div>

                      {testerResult.suggestion && (
                        <div style={{ background: 'rgba(0,201,167,0.05)', border: '1px solid rgba(0,201,167,0.15)', borderRadius: 10, padding: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', marginBottom: 2 }}>RECOMMENDED FIX</div>
                          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>{testerResult.suggestion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

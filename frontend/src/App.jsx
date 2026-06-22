import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ResumeProfile from './components/ResumeProfile';
import JobDiscovery from './components/JobDiscovery';
import PublicProfile from './components/PublicProfile';
import { Menu, Compass, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [page, setPage]               = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPublicRoute, setIsPublicRoute] = useState(false);

  useEffect(() => {
    if (window.location.pathname.startsWith('/u/')) {
      setIsPublicRoute(true);
    }
  }, []);

  // Resume analysis & Profile state — loaded from localStorage to persist across refreshes
  const [resumeText, setResumeText] = useState(() => localStorage.getItem('hirex_resume_text') || '');
  const [resumeData, setResumeData] = useState(() => {
    try {
      const saved = localStorage.getItem('hirex_resume_data');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [dnaData, setDnaData] = useState(() => {
    try {
      const saved = localStorage.getItem('hirex_dna_data');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleUpdateProfile = (text, brand, dna) => {
    setResumeText(text);
    setResumeData(brand);
    setDnaData(dna);
    localStorage.setItem('hirex_resume_text', text);
    localStorage.setItem('hirex_resume_data', JSON.stringify(brand));
    localStorage.setItem('hirex_dna_data', JSON.stringify(dna));
  };

  // Job Discovery params (set when coming from Career DNA)
  const [discoverParams, setDiscoverParams] = useState({ role: '', skills: [] });

  // Called from Career DNA "Find Jobs" button
  const handleDiscoverJobs = (role, skills) => {
    setDiscoverParams({ role, skills });
    setPage('discover');
  };

  const PAGE_META = {
    dashboard: 'Job Tracker',
    discover:  'Job Discovery',
    profile:   'Resume Profile',
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return (
        <Dashboard
          onNavigate={setPage}
          resumeText={resumeText}
          resumeData={resumeData}
        />
      );

      case 'profile': return (
        <ResumeProfile
          onDiscoverJobs={handleDiscoverJobs}
          resumeText={resumeText}
          resumeData={resumeData}
          dnaData={dnaData}
          onUpdateProfile={handleUpdateProfile}
        />
      );

      case 'discover': return (
        <JobDiscovery
          initialRole={discoverParams.role}
          initialSkills={discoverParams.skills}
          resumeData={resumeData}
          resumeText={resumeText}
        />
      );

      default: return <Dashboard onNavigate={setPage} resumeText={resumeText} resumeData={resumeData} />;
    }
  };

  if (isPublicRoute) {
    return <PublicProfile />;
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0d1f38', color: '#e8f0fe',
          border: '1px solid rgba(0,201,167,0.2)',
          borderRadius: 12, fontSize: 13.5, fontWeight: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        },
        success: { iconTheme: { primary: '#00c9a7', secondary: '#0d1f38' } },
        error:   { iconTheme: { primary: '#f43f5e', secondary: '#0d1f38' } },
      }} />

      <Sidebar active={page} onNavigate={setPage} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ marginLeft: 'var(--sidebar-w)', minHeight: '100vh', background: 'var(--bg-root)' }}>
        {/* Top Bar */}
        <header style={{
          height: 58, borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', background: 'rgba(6,13,26,0.97)',
          backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button id="mob-btn" onClick={() => setSidebarOpen(true)} className="btn btn-ghost btn-icon" style={{ display: 'none' }}>
              <Menu size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
              <span style={{ color: 'var(--teal)', fontWeight: 800, fontSize: 14 }}>HireX</span>
              <ChevronRight size={12} color="var(--text-3)" />
              <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{PAGE_META[page] || 'App'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {resumeData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                <CheckCircle2 size={13} />
                Resume Analyzed · {resumeData.matchPercentage || '—'}% match
              </div>
            )}
            <button onClick={() => setPage('discover')} className="btn btn-ghost" style={{ gap: 8, fontSize: 12.5 }}>
              <Compass size={14} /> Find Jobs
            </button>
          </div>
        </header>

        <main>{renderPage()}</main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          #mob-btn { display: flex !important; }
          div[style*="margin-left: var(--sidebar-w)"] { margin-left: 0 !important; }
        }
      `}</style>
    </>
  );
}

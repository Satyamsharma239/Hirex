import React from 'react';
import {
  LayoutDashboard, Briefcase, ChevronRight, X, Zap, Compass, UserCheck, Brain
} from 'lucide-react';

const NAV = [
  { id: 'console',   icon: LayoutDashboard, label: 'Console Overview', sub: 'Home command center' },
  { id: 'profile',   icon: UserCheck,       label: 'Resume Optimizer', sub: 'Career DNA & brand' },
  { id: 'discover',  icon: Compass,         label: 'Job Discovery',   sub: 'Find open positions' },
  { id: 'prep',      icon: Brain,           label: 'Interview Prep',  sub: 'Practice with AI Simulator' },
  { id: 'dashboard', icon: Briefcase,       label: 'Job Tracker',     sub: 'Manage applications' }
];

export default function Sidebar({ active, onNavigate, isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 'var(--sidebar-w)',
        zIndex: 40, transform: isOpen ? 'translateX(0)' : undefined,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.3s ease',
      }}
        className={!isOpen ? 'translate-x-0 max-lg:-translate-x-full' : ''}
      >
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: 'linear-gradient(135deg, #00c9a7, #0891b2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,201,167,0.3)',
              }}>
                <Briefcase size={18} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.5px', lineHeight: 1 }}>
                  <span className="gradient-text">HireX</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '1.5px', fontWeight: 700, marginTop: 2 }}>
                  CAREER SUITE
                </div>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-icon lg:hidden"
              style={{ display: 'none' }} id="sidebar-close">
              <X size={16} />
            </button>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          <div className="label" style={{ padding: '0 8px 10px' }}>MENU</div>
          {NAV.map(({ id, icon: Icon, label, sub }) => {
            const isActive = active === id;
            return (
              <button key={id} onClick={() => { onNavigate(id); onClose(); }}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ marginBottom: 2 }}
              >
                <div className="nav-icon">
                  <Icon size={15} color={isActive ? 'var(--teal)' : 'var(--text-3)'} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: isActive ? 'var(--teal)' : 'var(--text-2)' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{sub}</div>
                </div>
                {isActive && <ChevronRight size={13} color="var(--teal)" />}
              </button>
            );
          })}

        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,201,167,0.08), rgba(59,130,246,0.05))',
            border: '1px solid var(--border-teal)',
            borderRadius: 12, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <Zap size={13} color="var(--teal)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)' }}>Smart Analysis</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
              Intelligent analysis powered by advanced language models for accurate career insights.
            </p>
          </div>
          <p style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-3)', marginTop: 10, opacity: 0.6 }}>
            HireX v2.0 • Career Suite
          </p>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          #sidebar-close { display: flex !important; }
        }
      `}</style>
    </>
  );
}

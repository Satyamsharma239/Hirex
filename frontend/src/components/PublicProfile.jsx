import React, { useEffect, useState } from 'react';
import { profileAPI } from '../services/api';

export default function PublicProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Extract username from /u/username
    const path = window.location.pathname;
    const username = path.split('/u/')[1];
    
    if (!username) {
      setError('Invalid profile URL');
      setLoading(false);
      return;
    }

    profileAPI.getByUsername(username)
      .then(({ data }) => {
        if (data.error) setError(data.error);
        else setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load profile');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div className="spinner spinner-teal" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff' }}>
        <h1 style={{ fontSize: 48, marginBottom: 16 }}>404</h1>
        <p style={{ color: '#94a3b8' }}>{error || 'Profile not found'}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'relative', overflow: 'hidden', padding: '40px', background: 'linear-gradient(135deg, rgba(30,27,75,0.8), rgba(15,23,42,0.9))', borderRadius: 24, border: '1px solid rgba(236,72,153,0.3)', boxShadow: '0 20px 60px rgba(236,72,153,0.15)', maxWidth: 800, width: '100%' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'rgba(236,72,153,0.15)', filter: 'blur(80px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, background: 'rgba(56,189,248,0.1)', filter: 'blur(80px)', borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #f472b6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
              {profile.name?.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>{profile.name}</h1>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f472b6', letterSpacing: '1px', marginTop: 4 }}>{profile.tagline?.toUpperCase()}</div>
            </div>
          </div>
          
          <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.5px', marginBottom: 24, lineHeight: 1.4 }}>
            {profile.headline}
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {(profile.topSkills || []).map(s => (
              <span key={s} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#e8f0fe', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.05)' }}>{s}</span>
            ))}
          </div>

          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: 32, padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: 16, borderLeft: '3px solid #3b82f6' }}>
            {profile.uniqueValue}
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
            <div style={{ flex: 1, padding: '16px 20px', background: 'rgba(0,0,0,0.25)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4, letterSpacing: '1px' }}>LOOKING FOR</div>
              <div style={{ fontSize: 15, color: '#fff', fontWeight: 500 }}>{profile.lookingFor}</div>
            </div>
            <div style={{ flex: 1, padding: '16px 20px', background: 'rgba(52,211,153,0.1)', borderRadius: 16, border: '1px solid rgba(52,211,153,0.2)' }}>
              <div style={{ fontSize: 11, color: '#34d399', fontWeight: 700, marginBottom: 4, letterSpacing: '1px' }}>AVAILABILITY</div>
              <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>{profile.availableFrom}</div>
            </div>
          </div>

          {(profile.linkedin || profile.github) && (
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32 }}>
              {profile.linkedin && (
                <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', textDecoration: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13 }}>
                  LinkedIn Profile
                </a>
              )}
              {profile.github && (
                <a href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', textDecoration: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13 }}>
                  GitHub Profile
                </a>
              )}
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
            <a href={`mailto:${profile.email || ''}?subject=Connecting via HireX Profile&body=${encodeURIComponent(profile.coldEmailIntro || '')}`} 
               style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#f472b6', color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: '0 8px 16px rgba(244,114,182,0.3)' }}>
              Contact Me
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

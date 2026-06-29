import React, { useEffect, useState } from 'react';
import { profileAPI } from '../services/api';
import { Linkedin, Github, Mail, Briefcase, Calendar, CheckCircle2 } from 'lucide-react';

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b' }}>
        <div className="spinner spinner-teal" style={{ width: 40, height: 40, borderWidth: 3, borderTopColor: '#38bdf8' }} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fff' }}>
        <h1 style={{ fontSize: 64, marginBottom: 16, fontWeight: 900, color: '#f43f5e' }}>404</h1>
        <p style={{ color: '#a1a1aa', fontSize: 18 }}>{error || 'Profile not found'}</p>
      </div>
    );
  }

  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : '👤';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #09090b 70%)',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      padding: '40px 20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(236, 72, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); }
        }
        @keyframes floatOrb {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        .career-card {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .avatar-ring {
          animation: pulseRing 3s infinite;
        }
        .social-btn {
          transition: all 0.2s ease;
        }
        .social-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.2);
        }
        .contact-btn {
          transition: all 0.3s ease;
          background-size: 200% auto;
        }
        .contact-btn:hover {
          background-position: right center;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(244, 114, 182, 0.4) !important;
        }
      `}} />

      {/* Floating background orbs */}
      <div style={{ position: 'fixed', top: '10%', left: '15%', width: 300, height: 300, background: 'rgba(236, 72, 153, 0.08)', filter: 'blur(80px)', borderRadius: '50%', animation: 'floatOrb 10s infinite ease-in-out', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '15%', width: 400, height: 400, background: 'rgba(56, 189, 248, 0.08)', filter: 'blur(100px)', borderRadius: '50%', animation: 'floatOrb 15s infinite ease-in-out reverse', pointerEvents: 'none' }} />

      <div className="career-card" style={{ 
        position: 'relative', 
        width: '100%',
        maxWidth: 720, 
        background: 'rgba(15, 23, 42, 0.4)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 24, 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        padding: '48px',
        overflow: 'hidden',
        zIndex: 10
      }}>
        {/* Header / Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>
          <div className="avatar-ring" style={{ 
            width: 96, 
            height: 96, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #f472b6, #3b82f6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: 40, 
            fontWeight: 800, 
            color: '#fff', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            marginBottom: 24,
            border: '3px solid rgba(255,255,255,0.1)'
          }}>
            {initial}
          </div>
          
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f8fafc', margin: '0 0 8px 0', letterSpacing: '-1px' }}>
            {profile.name}
          </h1>
          
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f472b6', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 20 }}>
            {profile.tagline || 'Professional Profile'}
          </div>

          <div style={{ fontSize: 22, fontWeight: 300, color: '#e2e8f0', lineHeight: 1.5, maxWidth: '90%' }}>
            {profile.headline}
          </div>
        </div>
        
        {/* Skills */}
        {profile.topSkills && profile.topSkills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
            {profile.topSkills.map(skill => (
              <span key={skill} style={{ 
                padding: '8px 16px', 
                borderRadius: 20, 
                background: 'rgba(56, 189, 248, 0.1)', 
                color: '#38bdf8', 
                fontSize: 13, 
                fontWeight: 600, 
                border: '1px solid rgba(56, 189, 248, 0.2)',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)'
              }}>
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Unique Value Quote */}
        {profile.uniqueValue && (
          <div style={{ 
            fontSize: 16, 
            color: '#cbd5e1', 
            lineHeight: 1.7, 
            marginBottom: 40, 
            padding: '24px', 
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(15, 23, 42, 0) 100%)', 
            borderRadius: '0 16px 16px 0', 
            borderLeft: '4px solid #3b82f6',
            fontStyle: 'italic'
          }}>
            "{profile.uniqueValue}"
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
          <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
              <Briefcase size={16} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Looking For</span>
            </div>
            <div style={{ fontSize: 15, color: '#f8fafc', fontWeight: 500 }}>{profile.lookingFor || 'New Opportunities'}</div>
          </div>
          
          <div style={{ padding: '20px', background: 'rgba(52, 211, 153, 0.05)', borderRadius: 16, border: '1px solid rgba(52, 211, 153, 0.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981' }}>
              <Calendar size={16} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Availability</span>
            </div>
            <div style={{ fontSize: 15, color: '#f8fafc', fontWeight: 600 }}>{profile.availableFrom || 'Immediately'}</div>
          </div>
        </div>

        {/* Experience Summary */}
        {profile.experienceSummary && (
          <div style={{ marginBottom: 40, padding: '24px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Experience Overview</h3>
            <p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: 15, margin: 0 }}>
              {profile.experienceSummary}
            </p>
          </div>
        )}

        {/* Achievements */}
        {profile.achievements && profile.achievements.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Key Highlights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile.achievements.map((achievement, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <CheckCircle2 size={18} color="#38bdf8" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: '#cbd5e1', lineHeight: 1.5, fontSize: 14 }}>{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Area */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          
          {/* Social Links */}
          {(profile.linkedin || profile.github) && (
            <div style={{ display: 'flex', gap: 16 }}>
              {profile.linkedin && (
                <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} 
                   target="_blank" rel="noopener noreferrer" className="social-btn"
                   style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#0077b5', color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14 }}>
                  <Linkedin size={18} /> LinkedIn
                </a>
              )}
              {profile.github && (
                <a href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`} 
                   target="_blank" rel="noopener noreferrer" className="social-btn"
                   style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#333', color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14, border: '1px solid #444' }}>
                  <Github size={18} /> GitHub
                </a>
              )}
            </div>
          )}

          {/* Primary CTA */}
          <a href={`mailto:${profile.email || ''}?subject=Connecting via HireX Profile&body=${encodeURIComponent(profile.coldEmailIntro || '')}`} 
             className="contact-btn"
             style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: 10, 
               padding: '16px 40px', 
               background: 'linear-gradient(to right, #ec4899 0%, #8b5cf6 51%, #ec4899 100%)', 
               color: '#fff', 
               textDecoration: 'none', 
               borderRadius: 30, 
               fontWeight: 700, 
               fontSize: 16, 
               boxShadow: '0 8px 20px rgba(236, 72, 153, 0.25)'
             }}>
            <Mail size={20} />
            Let's Connect
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 40, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>Powered by</span>
        <a href="/" style={{ color: '#f8fafc', fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.5px' }}>HireX</a>
      </div>
    </div>
  );
}

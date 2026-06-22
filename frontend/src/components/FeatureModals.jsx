import React, { useState } from 'react';
import { featuresAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Ghost, TrendingUp, AlertCircle, CheckCircle2, Clock, Mail, Send, RefreshCw, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

// ── Ghost Rate Predictor ──────────────────────────────────────────
export function GhostRatePredictor({ job, userProfile, resumeData, resumeText, onClose }) {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data } = await featuresAPI.getGhostRate({ job, userProfile, resumeData, resumeText });
      setResult(data);
    } catch (err) { toast.error('Analysis failed'); }
    setLoading(false);
  };

  const pct = result?.replyProbability || 0;
  const color = result?.verdictColor || '#64748b';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Ghost size={20} color="var(--teal)" />
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Ghost Rate Predictor</h2>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>
              Predicting reply probability for <strong>{job.company}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={15} /></button>
        </div>

        {!result && !loading && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 13.5, color: 'var(--text-3)', marginBottom: 20 }}>
              Analyzes your profile vs this job's requirements and market data to predict if HR will reply to your application.
            </p>
            <button onClick={run} className="btn btn-primary" style={{ paddingInline: 32 }}>
              <Sparkles size={15} /> Predict Reply Rate
            </button>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 0' }}>
            <div className="spinner spinner-teal" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Analyzing application strength...</p>
          </div>
        )}

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Big score */}
            <div style={{ textAlign: 'center', padding: '20px 16px', background: `${color}08`, borderRadius: 14, border: `1px solid ${color}25` }}>
              <div style={{ fontSize: 56, fontWeight: 900, color, letterSpacing: '-2px', lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 14, fontWeight: 800, color, marginTop: 6 }}>{result.verdict} Chance of Reply</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>Follow up after {result.followUpDay || 3} days</div>
            </div>

            {/* Progress bar */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: 8, overflow: 'hidden', height: 8 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, transition: 'width 1.2s ease', borderRadius: 8 }} />
            </div>

            {/* Factors */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 10 }}>KEY FACTORS</div>
              {(result.reasons || []).map((r, i) => {
                const col = r.impact === 'Positive' ? '#10b981' : r.impact === 'Negative' ? '#f43f5e' : '#64748b';
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: `${col}06`, borderRadius: 9, border: `1px solid ${col}15`, marginBottom: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: col }}>{r.factor}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{r.detail}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${col}15`, color: col, flexShrink: 0, alignSelf: 'flex-start' }}>{r.impact}</span>
                  </div>
                );
              })}
            </div>

            {/* Top action */}
            <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg,rgba(0,201,167,0.06),rgba(59,130,246,0.04))', borderRadius: 10, border: '1px solid var(--border-teal)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', marginBottom: 5 }}>🎯 TOP ACTION TO INCREASE REPLY RATE</div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{result.topAction}</p>
            </div>

            {/* Best time */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 9, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 3 }}>BEST TIME TO APPLY</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-1)', fontWeight: 600 }}>{result.bestTimeToApply}</div>
              </div>
              <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 9, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 3 }}>FOLLOW UP ON</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-1)', fontWeight: 600 }}>Day {result.followUpDay}</div>
              </div>
            </div>

            <button onClick={run} className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }}>
              <RefreshCw size={13} /> Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Smart Follow-up Engine ─────────────────────────────────────────
export function FollowupEngine({ job, userProfile, onClose }) {
  const [day, setDay]         = useState(3);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await featuresAPI.getFollowupSequence({
        job,
        userName:             userProfile?.name || '',
        userEmail:            userProfile?.email || '',
        userSkills:           userProfile?.skills || '',
        dayNumber:            day,
        previousEmailSubject: `Application for ${job.title}`,
      });
      setResult(data);
    } catch (err) { toast.error('Failed to generate follow-up'); }
    setLoading(false);
  };

  const mailtoLink = result
    ? `mailto:${job.hrEmail}?subject=${encodeURIComponent(result.subject)}&body=${encodeURIComponent(result.body)}`
    : '#';

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`To: ${job.hrEmail}\nSubject: ${result.subject}\n\n${result.body}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={18} color="#8b5cf6" />
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Smart Follow-up</h2>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>
              Auto-generated follow-up email for <strong>{job.company}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={15} /></button>
        </div>

        {/* Day selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, letterSpacing: '0.5px' }}>DAYS SINCE APPLICATION</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { d: 3,  label: 'Day 3', desc: 'Soft check-in', color: '#10b981' },
              { d: 7,  label: 'Day 7', desc: 'Value-add',     color: '#f59e0b' },
              { d: 14, label: 'Day 14',desc: 'Final nudge',   color: '#f43f5e' },
            ].map(({ d, label, desc, color }) => (
              <button key={d} onClick={() => setDay(d)}
                style={{ flex: 1, padding: '12px 8px', borderRadius: 10, border: `2px solid ${day === d ? color : 'var(--border)'}`, background: day === d ? `${color}10` : 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: day === d ? color : 'var(--text-2)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={generate} disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
          {loading ? <><div className="spinner" /> Writing...</> : <><Sparkles size={15} /> Generate Follow-up Email</>}
        </button>

        {result && (
          <>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
              {[['To', job.hrEmail], ['Subject', result.subject]].map(([lbl, val]) => (
                <div key={lbl} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderBottom: lbl === 'To' ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', width: 52, flexShrink: 0 }}>{lbl.toUpperCase()}</span>
                  <span style={{ fontSize: 13, color: lbl === 'To' ? 'var(--teal)' : 'var(--text-1)', fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>

            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.7, background: 'var(--bg-surface)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', maxHeight: 220, overflowY: 'auto', marginBottom: 14 }}>
              {result.body}
            </pre>

            {result.dayAdvice && (
              <div style={{ padding: '10px 14px', background: 'rgba(139,92,246,0.06)', borderRadius: 9, border: '1px solid rgba(139,92,246,0.2)', marginBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', display: 'block', marginBottom: 3 }}>📅 NEXT STEP</span>
                <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0 }}>{result.dayAdvice}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <a href={mailtoLink} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', textDecoration: 'none' }}>
                <Send size={14} /> Open in Mail App
              </a>
              <button onClick={copy} className="btn btn-ghost" style={{ flex: 1 }}>
                {copied ? '✅ Copied' : '📋 Copy'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { featuresAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Mic, Send, ChevronRight, RotateCcw, Trophy, Clock,
  CheckCircle2, XCircle, Lightbulb, Star, BarChart3,
  Play, Pause, ArrowRight, Brain, Target, Zap, Volume2, VolumeX, MicOff
} from 'lucide-react';

const TYPE_COLORS = {
  Technical:       '#00c9a7',
  Behavioral:      '#8b5cf6',
  Situational:     '#f59e0b',
  'Company-Specific': '#3b82f6',
  HR:              '#10b981',
};

function GradeRing({ grade, score }) {
  const colors = { A: '#10b981', B: '#00c9a7', C: '#f59e0b', D: '#f43f5e' };
  const color = colors[grade] || '#64748b';
  const r = 32, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={7} />
        <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (score / 100) * circ}
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}>{grade}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{score}/100</span>
      </div>
    </div>
  );
}

export default function InterviewSim({ company, role, jobDescription, onClose }) {
  const [phase, setPhase]         = useState('start'); // start | loading | interview | scoring | complete
  const [session, setSession]     = useState(null);
  const [currentQ, setCurrentQ]   = useState(0);
  const [answer, setAnswer]       = useState('');
  const [scores, setScores]       = useState([]);
  const [scoring, setScoring]     = useState(false);
  const [timer, setTimer]         = useState(120);
  const [timerActive, setTimerA]  = useState(false);
  const intervalRef               = useRef(null);
  const textRef                   = useRef(null);
  
  // Voice AI
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening]   = useState(false);
  const recognitionRef                  = useRef(null);

  // Webcam & AI waveform states
  const [stream, setStream]             = useState(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const videoRef                        = useRef(null);

  // Video recording states
  const [recordings, setRecordings]     = useState([]);
  const mediaRecorderRef                = useRef(null);
  const chunksRef                       = useRef([]);
  const recordingsRef                   = useRef([]);

  useEffect(() => {
    recordingsRef.current = recordings;
  }, [recordings]);

  useEffect(() => {
    return () => {
      recordingsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const startRecording = (s, qIdx) => {
    if (!s) return;
    try {
      chunksRef.current = [];
      let mime = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
      
      const mediaRecorder = new MediaRecorder(s, { mimeType: mime });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        if (chunksRef.current.length === 0) return;
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordings(prev => {
          const next = [...prev];
          next[qIdx] = url;
          return next;
        });
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (err) {
      console.warn('Failed to start MediaRecorder:', err);
    }
  };

  useEffect(() => {
    if (phase === 'interview' && stream) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      startRecording(stream, currentQ);
    }
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [phase, currentQ, stream]);

  useEffect(() => {
    if (phase === 'interview') {
      // Attempt 1: Capture video and audio (mic)
      navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: true })
        .then((s) => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn('Microphone + Camera access failed. Retrying with video-only fallback...', err);
          // Fallback Attempt: Capture video only (in case mic is blocked or missing)
          navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: false })
            .then((s) => {
              setStream(s);
              if (videoRef.current) {
                videoRef.current.srcObject = s;
              }
            })
            .catch((err2) => {
              console.warn('Webcam stream capture failed completely:', err2);
            });
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [phase]);

  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef.current]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (e) => {
        let text = '';
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setAnswer(text);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (phase === 'interview' && session?.questions?.[currentQ] && voiceEnabled) {
      window.speechSynthesis?.cancel();
      const msg = new SpeechSynthesisUtterance(session.questions[currentQ].question);
      msg.onstart = () => setIsAiSpeaking(true);
      msg.onend = () => setIsAiSpeaking(false);
      msg.onerror = () => setIsAiSpeaking(false);
      window.speechSynthesis?.speak(msg);
    }
  }, [phase, currentQ, session, voiceEnabled]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (answer) setAnswer(''); // Clear before new dictation to avoid messy appends
      try { recognitionRef.current?.start(); setIsListening(true); } 
      catch (e) { toast.error('Microphone not available'); }
    }
  };

  useEffect(() => {
    if (timerActive && timer > 0) {
      intervalRef.current = setInterval(() => setTimer(t => t - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
      if (timer === 0 && timerActive) toast('⏰ Time\'s up! Submit your answer.', { icon: '⚠️' });
    }
    return () => clearInterval(intervalRef.current);
  }, [timerActive, timer]);

  const startSession = async () => {
    setPhase('loading');
    try {
      const { data } = await featuresAPI.startInterviewSim({ company, role, jobDescription });
      setSession(data);
      setPhase('interview');
      const firstQ = data.questions?.[0];
      if (firstQ) { setTimer(firstQ.timeLimit || 120); setTimerA(true); }
    } catch (err) {
      toast.error('Could not start interview');
      setPhase('start');
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return toast.error('Write your answer first');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setTimerA(false); setScoring(true);
    try {
      const q = session.questions[currentQ];
      const { data } = await featuresAPI.scoreAnswer({
        company, role,
        userAnswer:    answer,
        questionIndex: currentQ,
        jobDescription,
      });
      const newScores = [...scores, { question: q, answer, result: data }];
      setScores(newScores);

      if (currentQ + 1 >= session.questions.length) {
        setPhase('complete');
      } else {
        const nextQ = session.questions[currentQ + 1];
        setCurrentQ(currentQ + 1);
        setAnswer('');
        setTimer(nextQ.timeLimit || 120);
        setTimerA(true);
      }
    } catch (err) {
      toast.error('Scoring failed — try again');
    }
    setScoring(false);
  };

  const overallScore = scores.length
    ? Math.round(scores.reduce((s, r) => s + (r.result?.score || 0), 0) / scores.length)
    : 0;

  const overallGrade = overallScore >= 85 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 55 ? 'C' : 'D';

  const timerColor = timer <= 30 ? '#f43f5e' : timer <= 60 ? '#f59e0b' : '#10b981';
  const mins = String(Math.floor(timer / 60)).padStart(2, '0');
  const secs = String(timer % 60).padStart(2, '0');

  // ── START SCREEN ──
  if (phase === 'start') return (
    <div style={{ padding: 32, maxWidth: 520, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,rgba(0,201,167,0.15),rgba(139,92,246,0.1))', border: '1px solid var(--border-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Brain size={28} color="var(--teal)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Mock Interview</h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 4 }}>
          <strong style={{ color: 'var(--text-1)' }}>{role}</strong> at <strong style={{ color: 'var(--teal)' }}>{company}</strong>
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>8 questions · 20-25 minutes · AI-scored answers</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {[
          ['⚡ Technical', 'Role-specific coding & system design'],
          ['🧠 Behavioral', 'STAR method questions'],
          ['💡 Situational', 'Real-world problem scenarios'],
          ['🏢 Company', `${company}-specific questions`],
        ].map(([type, desc]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 16 }}>{type.split(' ')[0]}</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' }}>{type.slice(2)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.06)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', marginBottom: 24, fontSize: 13, color: '#fbbf24' }}>
        💡 Tip: Write your answers as you would speak them. Be specific and use examples from your experience.
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {onClose && <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>}
        <button onClick={startSession} className="btn btn-primary" style={{ flex: 2 }}>
          <Play size={16} /> Start Interview
        </button>
      </div>
    </div>
  );

  // ── LOADING ──
  if (phase === 'loading') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 16 }}>
      <div className="spinner spinner-teal" style={{ width: 48, height: 48, borderWidth: 4 }} />
      <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Preparing your interview questions...</p>
    </div>
  );

  // ── COMPLETE SCREEN ──
  if (phase === 'complete') return (
    <div style={{ padding: '28px 24px', overflowY: 'auto', maxHeight: 600 }}>
      {/* Score header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <GradeRing grade={overallGrade} score={overallScore} />
        <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 14, marginBottom: 4 }}>Interview Complete!</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 13.5 }}>
          {overallScore >= 85 ? '🎉 Excellent! You\'re very well prepared.' : overallScore >= 70 ? '👍 Good job! A bit more prep and you\'re ready.' : '📚 Keep practicing — review the sample answers below.'}
        </p>
      </div>

      {/* Per-question breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {scores.map((s, i) => {
          const r = s.result || {};
          const col = r.score >= 80 ? '#10b981' : r.score >= 60 ? '#f59e0b' : '#f43f5e';
          const qType = s.question?.type || 'Technical';
          return (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${TYPE_COLORS[qType] || '#64748b'}15`, color: TYPE_COLORS[qType] || '#64748b' }}>{qType}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Q{i + 1}: {s.question?.question?.slice(0, 60)}...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: col }}>{r.score || 0}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>/100</span>
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {r.strengths?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: '0.5px' }}>✅ STRENGTHS</span>
                    {r.strengths.map((st, j) => <p key={j} style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '3px 0' }}>• {st}</p>)}
                  </div>
                )}
                {r.improvements?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.5px' }}>⚡ IMPROVE</span>
                    {r.improvements.map((im, j) => <p key={j} style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '3px 0' }}>• {im}</p>)}
                  </div>
                )}
                 {r.sampleAnswer && (
                  <div style={{ padding: '10px 14px', background: 'rgba(0,201,167,0.05)', borderRadius: 8, border: '1px solid var(--border-teal)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', display: 'block', marginBottom: 5 }}>💡 SAMPLE ANSWER</span>
                    <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>{r.sampleAnswer}</p>
                  </div>
                )}
                {r.deliveryAnalytics && (
                  <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(59,130,246,0.04)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', display: 'block', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>🎙️ Speech Delivery Analytics</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Pacing / Speed</div>
                        <div style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--text-1)', marginTop: 2 }}>{r.deliveryAnalytics.speakingSpeed}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Tone / Confidence</div>
                        <div style={{ fontSize: 12.5, fontWeight: 750, color: 'var(--text-1)', marginTop: 2 }}>{r.deliveryAnalytics.communicationTone}</div>
                      </div>
                    </div>
                    {r.deliveryAnalytics.fillerCount > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-2)' }}>
                        Filler words detected: <strong style={{ color: 'var(--rose)' }}>{r.deliveryAnalytics.fillerCount}</strong> ({r.deliveryAnalytics.fillersUsed?.join(', ')})
                      </div>
                    )}
                  </div>
                )}
                {recordings[i] && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)', display: 'block', marginBottom: 6, letterSpacing: '0.5px' }}>📹 PLAYBACK YOUR VIDEO RESPONSE</span>
                    <video src={recordings[i]} controls style={{ width: '100%', maxHeight: 180, borderRadius: 6, background: '#000' }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={() => { setPhase('start'); setScores([]); setCurrentQ(0); setAnswer(''); setRecordings([]); }} className="btn btn-ghost" style={{ flex: 1 }}>
          <RotateCcw size={14} /> Retry
        </button>
        {onClose && <button onClick={onClose} className="btn btn-primary" style={{ flex: 1 }}>Done</button>}
      </div>
    </div>
  );

  // ── INTERVIEW SCREEN ──
  const q = session?.questions?.[currentQ];
  if (!q) return null;
  const qColor = TYPE_COLORS[q.type] || '#64748b';

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 520, maxWidth: 980, margin: '0 auto' }}>
      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Question {currentQ + 1} of {session.questions.length}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: `${timerColor}12`, border: `1px solid ${timerColor}30` }}>
            <Clock size={12} color={timerColor} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{mins}:{secs}</span>
            <button onClick={() => setTimerA(!timerActive)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              {timerActive ? <Pause size={11} color={timerColor} /> : <Play size={11} color={timerColor} />}
            </button>
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((currentQ) / session.questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Main Grid: Split Screen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 10, alignItems: 'stretch' }} className="interview-grid">
        
        {/* Left Side: Virtual Video Call (AI Interviewer + User Camera) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI Interviewer Pane */}
          <div className="card-static" style={{
            position: 'relative', height: 210, borderRadius: 16,
            background: 'linear-gradient(135deg, #0d1e36, #071224)',
            border: '1px solid rgba(0, 201, 167, 0.15)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'rgba(0, 201, 167, 0.12)',
              border: '1.5px solid var(--border-teal)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: 'var(--teal)', fontWeight: 800,
              boxShadow: '0 8px 24px rgba(0,201,167,0.15)',
              marginBottom: 12,
              animation: isAiSpeaking ? 'pulse 1.5s infinite' : 'none'
            }}>
              HX
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>HireX AI Technical Lead</div>
            <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
              {isAiSpeaking ? 'Speaking...' : 'Listening'}
            </div>

            {/* Audio Waveform Animation when AI speaks */}
            <div style={{
              position: 'absolute', bottom: 12, display: 'flex', gap: 3, alignItems: 'center', height: 24
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => {
                const heights = [8, 18, 12, 22, 10, 16, 20, 12];
                const animDuration = ['0.6s', '0.8s', '0.5s', '0.9s', '0.7s', '0.6s', '0.8s', '0.5s'];
                return (
                  <div key={bar} style={{
                    width: 3,
                    borderRadius: 1.5,
                    background: 'var(--teal)',
                    height: isAiSpeaking ? heights[bar - 1] : 4,
                    animation: isAiSpeaking ? `bounceWave ${animDuration[bar - 1]} ease-in-out infinite alternate` : 'none',
                    transition: 'all 0.3s ease'
                  }} />
                );
              })}
            </div>
          </div>

          {/* User Webcam Preview */}
          <div className="card-static" style={{
            position: 'relative', height: 210, borderRadius: 16,
            background: '#040b17', border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: 'scaleX(-1)', // mirror effect
                display: stream ? 'block' : 'none'
              }}
            />
            {!stream && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', border: '1px solid rgba(244, 63, 94, 0.2)'
                }}>
                  <MicOff size={18} color="#f43f5e" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Webcam Off</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4, maxWidth: 220 }}>
                  Grant camera permissions to enable video interview simulation.
                </div>
              </div>
            )}
            
            {stream && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '3px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)', fontSize: 10.5, color: '#10b981', fontWeight: 700
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'pulse 1s infinite' }} />
                LIVE PREVIEW
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Question & Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Question Box */}
          <div style={{ padding: '16px 20px', background: `${qColor}08`, border: `1px solid ${qColor}25`, borderRadius: 12, borderLeft: `3px solid ${qColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 6, background: `${qColor}15`, color: qColor }}>{q.type}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{Math.floor((q.timeLimit || 120) / 60)} min suggested</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', margin: 0, lineHeight: 1.6 }}>{q.question}</p>
          </div>

          {/* Hint */}
          {q.hint && (
            <div style={{ display: 'flex', gap: 10, padding: '10px 14px', background: 'rgba(245,158,11,0.05)', borderRadius: 9, border: '1px solid rgba(245,158,11,0.15)', alignItems: 'flex-start' }}>
              <Lightbulb size={14} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12.5, color: '#fbbf24', margin: 0, lineHeight: 1.5 }}>{q.hint}</p>
            </div>
          )}

          {/* Text Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px' }}>YOUR ANSWER</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {isListening && (
                  <div className="audio-wave-container" style={{ marginRight: 6 }}>
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                  </div>
                )}
                <button onClick={() => { setVoiceEnabled(!voiceEnabled); window.speechSynthesis?.cancel(); }} className="btn-icon" title={voiceEnabled ? 'Mute AI' : 'Unmute AI'} style={{ width: 28, height: 28, background: voiceEnabled ? 'rgba(0,201,167,0.1)' : 'var(--bg-surface)', border: `1px solid ${voiceEnabled ? 'rgba(0,201,167,0.3)' : 'var(--border)'}`, color: voiceEnabled ? '#00c9a7' : 'var(--text-3)' }}>
                  {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>
                <button onClick={toggleListening} className="btn-icon" title={isListening ? 'Stop Mic' : 'Start Mic'} style={{ width: 28, height: 28, background: isListening ? 'rgba(244,63,94,0.1)' : 'var(--bg-surface)', border: `1px solid ${isListening ? 'rgba(244,63,94,0.3)' : 'var(--border)'}`, color: isListening ? '#f43f5e' : 'var(--text-3)', animation: isListening ? 'pulse 2s infinite' : 'none' }}>
                  {isListening ? <Mic size={13} /> : <MicOff size={13} />}
                </button>
              </div>
            </div>
            <textarea
              ref={textRef}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={isListening ? "Listening... Speak your answer clearly." : "Type your answer here... Or click the microphone icon to speak."}
              className="inp"
              rows={6}
              style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.7, borderColor: isListening ? '#f43f5e' : 'var(--border)', boxShadow: isListening ? '0 0 0 1px rgba(244,63,94,0.2)' : 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{answer.split(/\s+/).filter(Boolean).length} words</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Aim for 100-200 words</span>
            </div>
          </div>

          {/* Submit button */}
          <button onClick={submitAnswer} disabled={scoring || !answer.trim()} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
            {scoring
              ? <><div className="spinner" /> Scoring your answer...</>
              : currentQ + 1 >= session.questions.length
                ? <><Trophy size={16} /> Submit & See Results</>
                : <><ArrowRight size={16} /> Submit & Next Question</>}
          </button>
        </div>

      </div>

      {/* CSS Keyframes for the bouncing waveform */}
      <style>{`
        @keyframes bounceWave {
          0% { height: 4px; }
          100% { height: 22px; }
        }
        @media (max-width: 768px) {
          .interview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Score history mini */}
      {scores.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {scores.map((s, i) => {
            const col = s.result?.score >= 80 ? '#10b981' : s.result?.score >= 60 ? '#f59e0b' : '#f43f5e';
            return <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${col}15`, color: col }}>Q{i+1}: {s.result?.score}</span>;
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { featuresAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Mic, Send, ChevronRight, RotateCcw, Trophy, Clock,
  CheckCircle2, XCircle, Lightbulb, Star, BarChart3,
  Play, Pause, ArrowRight, Brain, Target, Zap, Volume2, VolumeX, MicOff, VideoOff
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

export default function InterviewSim({ company, role, jobDescription, resumeData, onClose }) {
  const [phase, setPhase]         = useState('start');
  const [showTextInput, setShowTextInput] = useState(false);
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
  const canvasRef                       = useRef(null);

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
    if (!s || typeof window.MediaRecorder === 'undefined') return;
    try {
      chunksRef.current = [];
      let mime = 'video/webm;codecs=vp9,opus';
      if (window.MediaRecorder.isTypeSupported && !window.MediaRecorder.isTypeSupported(mime)) {
        mime = 'video/webm;codecs=vp8,opus';
      }
      if (window.MediaRecorder.isTypeSupported && !window.MediaRecorder.isTypeSupported(mime)) {
        mime = 'video/webm';
      }
      
      const mediaRecorder = new window.MediaRecorder(s, { mimeType: mime });
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
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: true })
          .then((s) => {
            setStream(s);
            if (videoRef.current) {
              videoRef.current.srcObject = s;
            }
          })
          .catch((err) => {
            console.warn('Microphone + Camera access failed. Retrying with audio-only fallback...', err);
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              navigator.mediaDevices.getUserMedia({ video: false, audio: true })
                .then((s2) => {
                  setStream(s2);
                  if (videoRef.current) {
                    videoRef.current.srcObject = s2;
                  }
                })
                .catch((err2) => {
                  console.warn('Audio-only stream capture failed. Retrying with video-only fallback...', err2);
                  navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: false })
                    .then((s3) => {
                      setStream(s3);
                      if (videoRef.current) {
                        videoRef.current.srcObject = s3;
                      }
                    })
                    .catch((err3) => {
                      console.warn('Webcam stream capture failed completely:', err3);
                    });
                });
            }
          });
      } else {
        console.warn('getUserMedia is not supported on this browser/device.');
      }
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
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please check browser permissions.');
        } else {
          toast.error(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
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

  useEffect(() => {
    if (!isListening || !stream) return;
    let audioCtx;
    let source;
    let analyser;
    let animationFrameId;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#00c9a7';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00c9a7';
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };

      draw();
    } catch (e) {
      console.warn('Analyser failed:', e);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (source) source.disconnect();
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [isListening, stream]);

  useEffect(() => {
    if (isListening && stream) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let phaseVal = 0;

    const drawSimulated = () => {
      animationFrameId = requestAnimationFrame(drawSimulated);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(0, 201, 167, 0.4)';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#00c9a7';
      
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin(x * 0.05 + phaseVal) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin(x * 0.03 - phaseVal * 0.7) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phaseVal += 0.05;
    };

    drawSimulated();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isListening, stream]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice transcription is not supported in this browser. Please type your answer.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (answer) setAnswer('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        toast.error('Microphone not available');
      }
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
        question:      q.question,
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
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 940, margin: '0 auto', background: '#060d1a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Simulator Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Mic size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', lineHeight: 1 }}>AI INTERVIEW</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '1px', marginTop: 3 }}>SIMULATOR</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', fontSize: 11, fontWeight: 700, color: '#f43f5e' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e', animation: 'pulse 1s infinite' }} />
            RECORDING
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
            {mins}:{secs}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
        Candidate: <strong style={{ color: 'var(--text-1)' }}>{resumeData?.name || 'Sarah Jenkins'}</strong>
      </div>

      {/* Main Grid: Split view */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'stretch' }} className="interview-grid">
        
        {/* Left Side: User Webcam feed with glowing border */}
        <div style={{
          position: 'relative',
          height: 380,
          borderRadius: 16,
          border: '2px solid #00c9a7',
          boxShadow: '0 0 24px rgba(0, 201, 167, 0.25)',
          overflow: 'hidden',
          background: '#040b17',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
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
                <VideoOff size={18} color="#f43f5e" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Webcam Off</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4, maxWidth: 220 }}>
                Grant camera permissions to enable video interview simulation.
              </div>
            </div>
          )}
          
          {stream && (
            <div style={{
              position: 'absolute', top: 16, left: 16,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.35)', fontSize: 10.5, color: '#10b981', fontWeight: 700,
              zIndex: 10
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', animation: 'pulse 1s infinite' }} />
              LIVE FEED
            </div>
          )}
        </div>

        {/* Right Side: Active Question */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: 380
        }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 }}>
              Question {currentQ + 1}
            </div>
            
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              {q.question}
            </p>

            {showTextInput ? (
              <textarea
                ref={textRef}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="inp"
                rows={6}
                style={{ 
                  resize: 'none', 
                  fontSize: 13.5, 
                  lineHeight: 1.6, 
                  background: 'rgba(6, 13, 26, 0.4)', 
                  border: '1px solid rgba(0, 201, 167, 0.25)',
                  width: '100%'
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  padding: 12,
                  minHeight: 100,
                  maxHeight: 120,
                  overflowY: 'auto',
                  background: 'rgba(6, 13, 26, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 10,
                  fontSize: 13,
                  color: answer ? 'var(--text-1)' : 'var(--text-3)',
                  fontStyle: answer ? 'normal' : 'italic',
                  lineHeight: 1.5
                }}>
                  {answer || "Click 'Start Recording' below and start speaking..."}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button 
                    type="button"
                    onClick={toggleListening}
                    className="btn"
                    style={{
                      padding: '8px 18px',
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: 12.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: isListening ? 'rgba(244, 63, 94, 0.15)' : 'rgba(0, 201, 167, 0.15)',
                      border: isListening ? '1px solid #f43f5e' : '1px solid #00c9a7',
                      color: isListening ? '#f43f5e' : '#00c9a7',
                      boxShadow: isListening ? '0 0 12px rgba(244, 63, 94, 0.3)' : '0 0 12px rgba(0, 201, 167, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isListening ? 'Stop Recording' : 'Start Recording'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={() => setShowTextInput(!showTextInput)} 
              className="btn btn-ghost btn-sm" 
              style={{ fontSize: 11, height: 32, gap: 5, borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {showTextInput ? '🎤 Switch to Mic' : '⌨️ Type Answer'}
            </button>
            
            {isListening ? (
              <div style={{ fontSize: 12.5, color: '#f43f5e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e', animation: 'pulse 1s infinite' }} />
                Transcribing...
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500 }}>
                Current Time: {mins}:{secs}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Area: Controls and Audio Waveform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 12 }}>
        {/* Left Side: Round controls */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button 
              onClick={submitAnswer} 
              disabled={scoring || (!answer.trim() && !isListening)}
              style={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                background: 'rgba(59, 130, 246, 0.1)', 
                border: '1px solid rgba(59, 130, 246, 0.3)', 
                color: '#3b82f6', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={20} />
            </button>
            <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.5px' }}>NEXT</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button 
              onClick={() => setPhase('complete')}
              style={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                background: 'rgba(244, 63, 94, 0.1)', 
                border: '1px solid rgba(244, 63, 94, 0.3)', 
                color: '#f43f5e', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: 14, height: 14, background: '#f43f5e', borderRadius: 2 }} />
            </button>
            <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.5px' }}>END INTERVIEW</span>
          </div>
        </div>

        {/* Right Side: Audio Waveform Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <canvas 
            ref={canvasRef} 
            width="500" 
            height="48" 
            style={{ width: '100%', height: 48, background: 'transparent' }} 
          />
          <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.5px' }}>AUDIO INPUT</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .interview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

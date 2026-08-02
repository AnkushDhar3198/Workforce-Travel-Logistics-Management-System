import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, ShieldCheck, User } from 'lucide-react';

interface VoiceCallModalProps {
  phoneNumber: string;
  calleeName: string;
  onClose: () => void;
}

export default function VoiceCallModal({ phoneNumber, calleeName, onClose }: VoiceCallModalProps) {
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallState('connected');
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(20px)', animation: 'fadeIn 0.2s ease both' }}>
      <div style={{ width: '340px', padding: '28px 24px', borderRadius: '28px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', textAlign: 'center', position: 'relative', animation: 'popIn 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
        
        {/* Caller Avatar */}
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, boxShadow: '0 8px 32px var(--accent-glow-strong)', position: 'relative' }}>
          {calleeName ? calleeName.charAt(0) : <User size={36} />}
          {callState === 'connected' && (
            <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '2px solid var(--accent-primary)', animation: 'pulse 1.5s infinite' }} />
          )}
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 4px' }}>{calleeName}</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px', fontWeight: 600 }}>{phoneNumber}</p>

        {/* Status indicator */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', background: callState === 'connected' ? 'rgba(34,197,94,0.12)' : 'rgba(56,189,248,0.12)', border: '1px solid', borderColor: callState === 'connected' ? 'rgba(34,197,94,0.3)' : 'rgba(56,189,248,0.3)', color: callState === 'connected' ? '#4ade80' : '#38bdf8', fontSize: '11px', fontWeight: 800, marginBottom: '24px' }}>
          <ShieldCheck size={13} />
          <span>{callState === 'connecting' ? 'Connecting WebRTC Encrypted Line...' : callState === 'connected' ? `Encrypted Voice Call • ${formatTimer(callDuration)}` : 'Call Ended'}</span>
        </div>

        {/* Waveform graphic when connected */}
        {callState === 'connected' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '24px', marginBottom: '24px' }}>
            {[16, 24, 12, 28, 18, 22, 14, 26, 20].map((h, i) => (
              <div key={i} style={{ width: '3px', height: `${h}px`, borderRadius: '2px', background: 'var(--accent-primary)', animation: `wave 1s ease-in-out infinite ${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {/* Call Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <button onClick={() => setIsMuted(v => !v)} style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: isMuted ? '#ef4444' : 'var(--nav-hover-bg)', color: isMuted ? '#fff' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button onClick={handleEndCall} style={{ width: '60px', height: '60px', borderRadius: '50%', border: 'none', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 20px rgba(239,68,68,0.4)', transition: 'all 0.2s' }}>
            <PhoneOff size={26} />
          </button>

          <button onClick={() => setSpeakerOn(v => !v)} style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', background: speakerOn ? 'var(--nav-active-bg)' : 'var(--nav-hover-bg)', color: speakerOn ? 'var(--accent-primary)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
            <Volume2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

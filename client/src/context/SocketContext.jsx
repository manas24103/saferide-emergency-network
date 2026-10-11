import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState(18);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('soundEnabled') !== 'false';
  });
  const [latestEmergency, setLatestEmergency] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const audioContextRef = useRef(null);

  // Subtle tactical alert beep synthesizer using Web Audio API
  const playTacticalAlertSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc1.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.12); // C6

      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      console.log('[Socket] Connected to SafeRide Server with ID:', s.id);
      setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setConnected(false);
    });

    // Handle incoming new emergencies
    s.on('emergency:new', (emergency) => {
      console.log('[Socket] 🚨 NEW EMERGENCY RECEIVED:', emergency);
      setLatestEmergency(emergency);
      playTacticalAlertSound();
      setToastMessage({
        type: 'CRITICAL',
        title: `CRITICAL ALERT: ${emergency.emergencyType} on ${emergency.vehicleId}`,
        message: `Coordinates: [${emergency.latitude?.toFixed(4)}, ${emergency.longitude?.toFixed(4)}]`,
        id: Date.now(),
      });
    });

    // Ping check for latency indicator
    const pingInterval = setInterval(() => {
      const start = Date.now();
      s.emit('ping', () => {
        setLatency(Date.now() - start || 18);
      });
    }, 15000);

    setSocket(s);

    return () => {
      clearInterval(pingInterval);
      s.disconnect();
    };
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('soundEnabled', next.toString());
      return next;
    });
  };

  const clearToast = () => setToastMessage(null);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        latency,
        soundEnabled,
        toggleSound,
        latestEmergency,
        toastMessage,
        clearToast,
        playTacticalAlertSound,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

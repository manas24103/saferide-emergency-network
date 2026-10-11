import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Radio,
  Clock,
  MapPin,
  Battery,
  Shield,
  ExternalLink,
} from 'lucide-react';

export const CriticalAlertCard = ({
  emergency,
  onAcknowledge,
  onResolve,
  onOpenTelemetry,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!emergency?.timestamp) return;

    const calculateElapsed = () => {
      const diff = Math.floor((Date.now() - new Date(emergency.timestamp).getTime()) / 1000);
      setElapsedSeconds(Math.max(0, diff));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [emergency]);

  const formatElapsed = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!emergency) {
    return (
      <div className="bg-[#0e1622] border border-[#1b2838] rounded-md p-4 flex flex-col items-center justify-center text-center h-full min-h-[360px]">
        <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400 mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="text-sm font-mono font-bold text-slate-200">
          ALL SECTORS NOMINAL
        </div>
        <div className="text-xs text-slate-400 font-mono mt-1 max-w-[220px]">
          No active SOS emergency events requiring immediate operator intervention.
        </div>
      </div>
    );
  }

  const isCritical = emergency.priority === 'LEVEL_1_CRITICAL' || emergency.status === 'ACTIVE';

  return (
    <div
      className={`border rounded-md overflow-hidden flex flex-col justify-between shadow-lg transition-all ${
        isCritical
          ? 'bg-[#120f15] border-red-800/80 shadow-red-950/30'
          : 'bg-[#0e1622] border-[#223348]'
      }`}
    >
      {/* Card Header */}
      <div>
        <div
          className={`px-3 py-1.5 flex items-center justify-between text-[11px] font-mono font-bold tracking-wider ${
            isCritical
              ? 'bg-red-950/80 text-red-200 border-b border-red-900/60'
              : 'bg-[#14202e] text-amber-300 border-b border-[#223348]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>{emergency.priority || 'LEVEL 1 PRIORITY'}</span>
            <span className="text-red-400/70 font-normal">
              // ELAPSED: {formatElapsed(elapsedSeconds)}
            </span>
          </div>
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        </div>

        {/* Big Alert Title */}
        <div className="p-3 border-b border-[#1f2838]">
          <div className="text-base font-bold font-mono text-red-400 tracking-wide uppercase flex items-center gap-2">
            <span>
              CRITICAL {emergency.emergencyType} ALERT: {emergency.vehicleId}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            STATUS: <span className="font-bold text-red-300">{emergency.status}</span> // INCIDENT: {emergency.emergencyId}
          </div>
        </div>

        {/* Telemetry Matrix Grid */}
        <div className="p-3 space-y-2 text-[11px] font-mono">
          <div className="flex justify-between border-b border-[#1b2535] pb-1">
            <span className="text-slate-400">VEHICLE ID:</span>
            <span className="text-slate-200 font-semibold">{emergency.vehicleId} ({emergency.vehicleNumber || 'Hybrid Fleet'})</span>
          </div>

          <div className="flex justify-between border-b border-[#1b2535] pb-1">
            <span className="text-slate-400">SOS HARDWARE:</span>
            <span className="text-cyan-400 font-semibold">{emergency.deviceId} [v1.4.2]</span>
          </div>

          <div className="flex justify-between border-b border-[#1b2535] pb-1">
            <span className="text-slate-400">COORDINATES:</span>
            <span className="text-slate-200 font-semibold font-mono">
              {emergency.latitude?.toFixed(4)}° N, {emergency.longitude?.toFixed(4)}° E
            </span>
          </div>

          <div className="flex justify-between border-b border-[#1b2535] pb-1">
            <span className="text-slate-400">CORRIDOR:</span>
            <span className="text-slate-300 truncate max-w-[180px]">{emergency.corridor || 'Market & 4th St, Transit Sector'}</span>
          </div>

          <div className="flex justify-between border-b border-[#1b2535] pb-1">
            <span className="text-slate-400">SPEED / VECTOR:</span>
            <span className="text-emerald-400 font-semibold">
              {emergency.speed || 42} km/h (Moving {emergency.heading || 'NW 315°'})
            </span>
          </div>

          <div className="flex justify-between border-b border-[#1b2535] pb-1">
            <span className="text-slate-400">BUTTON BATTERY:</span>
            <span className="text-slate-200 font-semibold">
              {emergency.batteryLevel || 72}% ({emergency.batteryVoltage || 3.88}V LiPo Nominal)
            </span>
          </div>

          <div className="flex justify-between border-b border-[#1b2535] pb-1">
            <span className="text-slate-400">GATEWAY MODEM:</span>
            <span className="text-slate-300">4G LTE Cat-M1 (Band 4, -68 dBm)</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">TAMPER STATUS:</span>
            <span className="text-emerald-400 font-semibold">
              {emergency.tamperCircuit || 'NORMAL (Circuit Closed 2.1Ω)'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons matching screenshot */}
      <div className="p-3 border-t border-[#1f2838] bg-[#0c121b] space-y-2">
        {/* Main Action Button */}
        {emergency.status === 'ACTIVE' && (
          <button
            onClick={() => onAcknowledge(emergency)}
            className="w-full py-2.5 px-3 rounded bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 shadow-md shadow-red-950/60 transition-all border border-red-500"
          >
            <AlertCircle className="w-4 h-4" />
            <span>[ACKNOWLEDGE ALERT (DISPATCHED)]</span>
          </button>
        )}

        {emergency.status === 'ACKNOWLEDGED' && (
          <div className="w-full py-2 px-3 rounded bg-amber-950/60 border border-amber-800 text-amber-300 font-mono text-xs font-bold text-center">
            DISPATCH IN PROGRESS (ACKNOWLEDGED)
          </div>
        )}

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenTelemetry(emergency)}
            className="py-1.5 px-2 rounded bg-[#172538] hover:bg-[#20324c] text-cyan-400 font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#243a56]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>[OPEN TELEMETRY]</span>
          </button>

          <button
            onClick={() => onResolve(emergency)}
            className="py-1.5 px-2 rounded bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 font-mono text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-emerald-800/60"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>[MARK RESOLVED]</span>
          </button>
        </div>
      </div>
    </div>
  );
};

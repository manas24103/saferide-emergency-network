import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, ShieldCheck } from 'lucide-react';

export const EventAuditStream = ({ events = [] }) => {
  const [activeTab, setActiveTab] = useState('ALL');

  const filteredEvents = events.filter((ev) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'EMERGENCIES')
      return ev.category === 'EMERGENCY' || ev.action.includes('SOS');
    if (activeTab === 'TAMPER/HW')
      return (
        ev.category === 'DEVICE' ||
        ev.action.includes('TAMPER') ||
        ev.action.includes('HEARTBEAT')
      );
    if (activeTab === 'SYSTEM')
      return ev.category === 'CONFIG' || ev.category === 'AUTH';
    return true;
  });

  return (
    <div className="bg-[#0b111a] border border-[#1b2838] rounded-md overflow-hidden shadow-sm flex flex-col h-full">
      {/* Header & Tabs */}
      <div className="px-3 py-2 bg-[#090e15] border-b border-[#1b2838] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            EVENT AUDIT STREAM
          </span>
          <span className="text-[10px] font-mono text-emerald-400">
            Real-time MQTT/Socket
          </span>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 text-[10px] font-mono">
          {['ALL', 'EMERGENCIES', 'TAMPER/HW', 'SYSTEM'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === tab
                  ? 'bg-[#1b2a3d] text-cyan-400 font-bold border border-[#2b415e]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121c29]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stream Cards */}
      <div className="p-2 space-y-2 overflow-y-auto max-h-[340px]">
        {filteredEvents.length === 0 ? (
          <div className="p-4 text-center font-mono text-xs text-slate-500">
            No events logged in this category.
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isCritical =
              ev.action.includes('SOS') ||
              ev.details?.toLowerCase().includes('critical') ||
              ev.details?.toLowerCase().includes('physical sos');
            const isWarning =
              ev.action.includes('TAMPER') ||
              ev.action.includes('TIMEOUT') ||
              ev.details?.toLowerCase().includes('battery');

            const badgeText = isCritical
              ? 'CRITICAL'
              : isWarning
              ? 'WARNING'
              : 'ADVISORY';

            const badgeClass = isCritical
              ? 'bg-red-950 text-red-300 border-red-800'
              : isWarning
              ? 'bg-amber-950 text-amber-300 border-amber-800'
              : 'bg-[#121c28] text-slate-300 border-[#223348]';

            const iconColor = isCritical
              ? 'text-red-400'
              : isWarning
              ? 'text-amber-400'
              : 'text-cyan-400';

            return (
              <div
                key={ev._id || Math.random()}
                className="bg-[#0e1520] border border-[#182332] rounded p-2 text-xs font-mono hover:border-[#24354c] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span className={iconColor}>
                      {isCritical ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <Info className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <span>
                      {new Date(ev.timestamp).toLocaleTimeString()} -{' '}
                      <span className="text-cyan-400">{ev.target || 'FLEET'}</span>
                    </span>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${badgeClass}`}
                  >
                    {badgeText}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 mt-1 pl-5">
                  {ev.details || ev.action}
                </div>

                {ev.userName && (
                  <div className="text-[9px] text-slate-500 mt-1 pl-5">
                    Source: {ev.userName} // {ev.userRole}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

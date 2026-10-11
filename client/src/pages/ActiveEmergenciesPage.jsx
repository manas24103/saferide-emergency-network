import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import {
  AlertCircle,
  Clock,
  MapPin,
  Battery,
  Shield,
  CheckCircle2,
  Send,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { AcknowledgeModal } from '../components/AcknowledgeModal';
import { ResolveModal } from '../components/ResolveModal';
import { useNavigate } from 'react-router-dom';

export const ActiveEmergenciesPage = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState(null);

  const fetchEmergencies = async () => {
    try {
      const res = await api.get('/emergencies/active');
      if (res.data.success) {
        setEmergencies(res.data.emergencies);
        if (!selectedEmergency && res.data.emergencies.length > 0) {
          setSelectedEmergency(res.data.emergencies[0]);
        }
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('emergency:new', () => fetchEmergencies());
    socket.on('emergency:updated', () => fetchEmergencies());
    return () => {
      socket.off('emergency:new');
      socket.off('emergency:updated');
    };
  }, [socket]);

  const handleAcknowledge = (emg) => {
    setActiveTarget(emg);
    setAckModalOpen(true);
  };

  const handleConfirmAcknowledge = async (id, notes) => {
    try {
      await api.put(`/emergencies/${id}/acknowledge`, { notes });
      fetchEmergencies();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleMarkResponding = async (emg) => {
    try {
      await api.put(`/emergencies/${emg.emergencyId || emg._id}/respond`, {
        unitId: 'TAC-UNIT-04',
        notes: 'Rapid tactical team dispatched to vehicle coordinates.',
      });
      fetchEmergencies();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleResolve = (emg) => {
    setActiveTarget(emg);
    setResolveModalOpen(true);
  };

  const handleConfirmResolve = async (id, resolutionNotes) => {
    try {
      await api.put(`/emergencies/${id}/resolve`, { resolutionNotes });
      fetchEmergencies();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              INCIDENT COMMANDER // ACTIVE QUEUE
            </span>
            <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono text-xs border border-red-800">
              {emergencies.length} ACTIVE
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Real-time critical events requiring operator acknowledgement, tactical dispatch, or resolution.
          </div>
        </div>
      </div>

      {/* Emergency Grid & Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Active Cards List */}
        <div className="lg:col-span-7 space-y-3">
          {emergencies.length === 0 ? (
            <div className="bg-[#0e1622] border border-[#1b2838] rounded-md p-8 text-center font-mono">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-200">NO UNRESOLVED EMERGENCIES</div>
              <div className="text-xs text-slate-400 mt-1">
                Fleet operations are running normally. No active SOS signals detected.
              </div>
            </div>
          ) : (
            emergencies.map((emg) => {
              const isSelected = selectedEmergency?.emergencyId === emg.emergencyId;
              const isCritical = emg.priority === 'LEVEL_1_CRITICAL' || emg.status === 'ACTIVE';

              return (
                <div
                  key={emg.emergencyId}
                  onClick={() => setSelectedEmergency(emg)}
                  className={`border rounded-md p-4 transition-all cursor-pointer shadow-md ${
                    isSelected
                      ? 'border-red-500 bg-[#141219]'
                      : isCritical
                      ? 'border-red-900/80 bg-[#101017] hover:border-red-700'
                      : 'border-[#1b2838] bg-[#0e1622] hover:border-[#2b3e56]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded bg-red-950 border border-red-700 flex items-center justify-center text-red-400">
                        <AlertCircle className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-red-400 uppercase tracking-wide">
                          🚨 EMERGENCY: {emg.emergencyType}
                        </div>
                        <div className="text-sm font-mono font-bold text-slate-100">
                          Vehicle: <span className="text-cyan-400">{emg.vehicleId}</span> ({emg.vehicleNumber || 'Cab'})
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          emg.status === 'ACTIVE'
                            ? 'bg-red-950 text-red-300 border-red-700 animate-pulse'
                            : emg.status === 'ACKNOWLEDGED'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-blue-950 text-blue-300 border-blue-700'
                        }`}
                      >
                        {emg.status}
                      </span>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        ID: {emg.emergencyId}
                      </div>
                    </div>
                  </div>

                  {/* Card Content Matrix */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#1b2535] text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">DEVICE:</span>
                      <span className="text-slate-200 font-semibold">{emg.deviceId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">LOCATION:</span>
                      <span className="text-slate-200 font-semibold">
                        {emg.latitude?.toFixed(4)}, {emg.longitude?.toFixed(4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">BATTERY:</span>
                      <span className="text-emerald-400 font-semibold">{emg.batteryLevel}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">TRIGGERED:</span>
                      <span className="text-slate-300">
                        {new Date(emg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons (Section 7 in prompt) */}
                  <div className="mt-3 pt-3 border-t border-[#182333] flex flex-wrap items-center gap-1.5 text-xs font-mono">
                    {emg.status === 'ACTIVE' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(emg);
                        }}
                        className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1"
                      >
                        [Acknowledge]
                      </button>
                    )}

                    {emg.status === 'ACKNOWLEDGED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkResponding(emg);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1"
                      >
                        [Mark Responding]
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(emg);
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-semibold text-[11px] flex items-center gap-1"
                    >
                      [Resolve]
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/map?vehicleId=${emg.vehicleId}`);
                      }}
                      className="px-2 py-1 rounded bg-[#152334] hover:bg-[#1e3046] text-cyan-400 text-[11px]"
                    >
                      [View Location]
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vehicles/${emg.vehicleId}`);
                      }}
                      className="px-2 py-1 rounded bg-[#152334] hover:bg-[#1e3046] text-slate-300 text-[11px]"
                    >
                      [View Vehicle]
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/devices`);
                      }}
                      className="px-2 py-1 rounded bg-[#152334] hover:bg-[#1e3046] text-slate-300 text-[11px]"
                    >
                      [View Device]
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Incident Timeline Investigation */}
        <div className="lg:col-span-5">
          {selectedEmergency ? (
            <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 space-y-4 font-mono">
              <div className="border-b border-[#1b2838] pb-2">
                <div className="text-xs text-slate-400 uppercase">INCIDENT DOSSIER</div>
                <div className="text-base font-bold text-red-400">
                  {selectedEmergency.emergencyId} // {selectedEmergency.vehicleId}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Corridor: {selectedEmergency.corridor || 'Central Transit Zone'}
                </div>
              </div>

              {/* Chronological Incident Timeline */}
              <div>
                <div className="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>INCIDENT RESPONSE TIMELINE</span>
                </div>

                <div className="relative pl-4 border-l-2 border-[#1c2c40] space-y-3 text-xs">
                  {selectedEmergency.timeline?.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-200">{step.event}</span>
                        <span>{new Date(step.time).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">{step.notes}</div>
                      <div className="text-[9px] text-slate-500">Actor: {step.actor}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware Link Specs */}
              <div className="p-3 rounded bg-[#0f1722] border border-[#1e2e42] text-[11px] space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  HARDWARE LOOP VERIFICATION
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Microcontroller:</span>
                  <span className="text-slate-200 font-semibold">ESP32-C3 RISC-V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gateway Uplink:</span>
                  <span className="text-slate-200">{selectedEmergency.gatewayId} (4G LTE Cat-M1)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tamper Status:</span>
                  <span className="text-emerald-400">{selectedEmergency.tamperCircuit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GPS Accuracy:</span>
                  <span className="text-cyan-400">3D Fix (HDOP 0.9)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-6 text-center font-mono text-xs text-slate-500">
              Select an incident from the left queue to view timeline and dispatch telemetry.
            </div>
          )}
        </div>
      </div>

      {/* Action Modals */}
      <AcknowledgeModal
        isOpen={ackModalOpen}
        emergency={activeTarget}
        onClose={() => setAckModalOpen(false)}
        onConfirm={handleConfirmAcknowledge}
      />

      <ResolveModal
        isOpen={resolveModalOpen}
        emergency={activeTarget}
        onClose={() => setResolveModalOpen(false)}
        onConfirm={handleConfirmResolve}
      />
    </div>
  );
};

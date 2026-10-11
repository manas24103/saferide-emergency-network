import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  History,
  Search,
  Filter,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const EmergencyHistoryPage = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/emergencies?limit=100');
      if (res.data.success) {
        setEmergencies(res.data.emergencies);
        if (!selectedEmergency && res.data.emergencies.length > 0) {
          setSelectedEmergency(res.data.emergencies[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredEmergencies = emergencies.filter((e) => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && e.emergencyType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.emergencyId.toLowerCase().includes(q) ||
        e.vehicleId.toLowerCase().includes(q) ||
        e.deviceId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              EMERGENCY ARCHIVE & INCIDENT TIMELINE AUDIT
            </span>
            <span className="px-2 py-0.5 rounded bg-[#131e2c] text-cyan-400 text-xs border border-[#21354c]">
              {emergencies.length} Recorded Events
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Complete incident chronology from initial hardware panic trigger to formal field resolution.
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400">STATUS:</span>
          {['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-1 rounded transition-colors ${
                statusFilter === st
                  ? 'bg-[#1b2b3e] text-cyan-400 font-bold border border-[#2d4766]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}

          <span className="text-slate-400 ml-2">TYPE:</span>
          {['ALL', 'SOS', 'TAMPER', 'LOW_BATTERY'].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-2 py-1 rounded transition-colors ${
                typeFilter === tp
                  ? 'bg-[#1b2b3e] text-cyan-400 font-bold border border-[#2d4766]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search Emergency ID or Vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-[#0f1722] border border-[#223348] rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
          />
        </div>
      </div>

      {/* Main Split: Table + Detailed Timeline Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Table */}
        <div className="lg:col-span-8 bg-[#0b111a] border border-[#1b2838] rounded-md overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-[#182332] bg-[#0c131c] text-slate-400 text-[10px]">
                <th className="py-2.5 px-3">EMERGENCY ID</th>
                <th className="py-2.5 px-3">VEHICLE</th>
                <th className="py-2.5 px-3">DEVICE</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3">LOCATION</th>
                <th className="py-2.5 px-3">TRIGGERED AT</th>
                <th className="py-2.5 px-3">RESOLVED AT</th>
                <th className="py-2.5 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131d2a]">
              {filteredEmergencies.map((emg) => {
                const isSelected = selectedEmergency?.emergencyId === emg.emergencyId;
                return (
                  <tr
                    key={emg.emergencyId}
                    onClick={() => setSelectedEmergency(emg)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#18283c]'
                        : emg.status === 'ACTIVE'
                        ? 'bg-red-950/20 hover:bg-red-950/30'
                        : 'hover:bg-[#0f1723]'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-cyan-400">{emg.emergencyId}</td>
                    <td className="py-2 px-3 text-slate-200 font-semibold">{emg.vehicleId}</td>
                    <td className="py-2 px-3 text-slate-300">{emg.deviceId}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`font-semibold ${
                          emg.emergencyType === 'SOS'
                            ? 'text-red-400'
                            : emg.emergencyType === 'TAMPER'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {emg.emergencyType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      [{emg.latitude?.toFixed(3)}, {emg.longitude?.toFixed(3)}]
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {new Date(emg.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {emg.resolvedAt ? new Date(emg.resolvedAt).toLocaleTimeString() : 'Pending'}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          emg.status === 'ACTIVE'
                            ? 'bg-red-950 text-red-300 border-red-700 animate-pulse'
                            : emg.status === 'ACKNOWLEDGED'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {emg.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Timeline Dossier View (Section 17 in prompt) */}
        <div className="lg:col-span-4">
          {selectedEmergency ? (
            <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 space-y-4">
              <div className="border-b border-[#1b2838] pb-2">
                <div className="text-[10px] text-slate-400 uppercase">INCIDENT CHRONOLOGY</div>
                <div className="text-base font-bold text-red-400">{selectedEmergency.emergencyId}</div>
                <div className="text-xs text-slate-300">
                  Vehicle: <span className="text-cyan-400">{selectedEmergency.vehicleId}</span> // Device: {selectedEmergency.deviceId}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <div className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ACTION TIMELINE LOG</span>
                </div>

                <div className="relative pl-4 border-l-2 border-[#1c2c40] space-y-4 text-xs">
                  {selectedEmergency.timeline?.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{step.event}</span>
                        <span>{new Date(step.time).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">{step.notes}</div>
                      <div className="text-[9px] text-slate-500">By: {step.actor}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEmergency.resolutionNotes && (
                <div className="p-3 rounded bg-emerald-950/30 border border-emerald-800/60 text-xs">
                  <div className="text-emerald-400 font-bold text-[10px] uppercase mb-1">
                    RESOLUTION REPORT:
                  </div>
                  <div className="text-emerald-200">{selectedEmergency.resolutionNotes}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-6 text-center text-xs text-slate-500">
              Select an incident row to inspect complete chronological investigation timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

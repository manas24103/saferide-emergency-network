import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Radio,
  Server,
  Database,
  Cpu,
  ShieldCheck,
  Clock,
  Sliders,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const SystemStatusPage = () => {
  const { user } = useAuth();
  const { connected, latency } = useSocket();

  const [healthData, setHealthData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchHealthAndSettings = async () => {
    try {
      const [hRes, sRes] = await Promise.all([
        api.get('/health'),
        api.get('/system/settings'),
      ]);
      if (hRes.data) setHealthData(hRes.data);
      if (sRes.data.success) setSettings(sRes.data.settings);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHealthAndSettings();
    const interval = setInterval(fetchHealthAndSettings, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/system/settings', settings);
      alert('System watchdog parameters saved successfully');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatUptime = (seconds = 0) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              SYSTEM HEALTH & ARCHITECTURE DIAGNOSTICS
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-xs border border-emerald-800">
              OPERATIONAL
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Real-time status of Node.js cluster, MongoDB persistent store, and Socket.IO duplex pipeline.
          </div>
        </div>

        <button
          onClick={fetchHealthAndSettings}
          className="p-1.5 rounded bg-[#131f2d] hover:bg-[#1a2b3e] text-slate-300"
          title="Refresh Health"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Services Grid (Section 30 in prompt) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Backend Node Server */}
        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-2 font-bold">
              <Server className="w-4 h-4 text-cyan-400" />
              BACKEND ENGINE
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-800">
              {healthData?.services?.backend || 'ONLINE'}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            Node.js + Express
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between pt-2 border-t border-[#182332]">
            <span>System Uptime:</span>
            <span className="text-emerald-400">{formatUptime(healthData?.uptimeSeconds)}</span>
          </div>
        </div>

        {/* MongoDB Database */}
        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-2 font-bold">
              <Database className="w-4 h-4 text-emerald-400" />
              DATABASE CLUSTER
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-800">
              {healthData?.services?.database || 'CONNECTED'}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            MongoDB + Mongoose
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between pt-2 border-t border-[#182332]">
            <span>Database Name:</span>
            <span className="text-slate-200">safesos_db</span>
          </div>
        </div>

        {/* Socket.IO Real-time */}
        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-2 font-bold">
              <Radio className="w-4 h-4 text-purple-400" />
              SOCKET SERVER
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-800">
              {connected ? 'CONNECTED' : 'RECONNECTING'}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100">
            Socket.IO Duplex
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between pt-2 border-t border-[#182332]">
            <span>Round-Trip Latency:</span>
            <span className="text-cyan-400 font-bold">{latency} ms</span>
          </div>
        </div>
      </div>

      {/* Metrics Summary (Connected devices, gateways, active emergencies) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3">
          <div className="text-slate-400 text-[10px]">CONNECTED SOS DEVICES:</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">
            {healthData?.metrics?.onlineDevices ?? 4} Units
          </div>
        </div>

        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3">
          <div className="text-slate-400 text-[10px]">CONNECTED GATEWAYS:</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">
            {healthData?.metrics?.onlineGateways ?? 4} Units
          </div>
        </div>

        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3">
          <div className="text-slate-400 text-[10px]">ONLINE FLEET VEHICLES:</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {healthData?.metrics?.onlineVehicles ?? 4} Vehicles
          </div>
        </div>

        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3">
          <div className="text-slate-400 text-[10px]">ACTIVE EMERGENCIES:</div>
          <div className="text-xl font-bold text-red-500 mt-1">
            {healthData?.metrics?.activeEmergencies ?? 1} Incidents
          </div>
        </div>
      </div>

      {/* Watchdog Configuration (Super Admin) */}
      {user?.role === 'SUPER_ADMIN' && settings && (
        <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 space-y-3">
          <div className="text-xs font-bold text-slate-100 uppercase border-b border-[#1b2838] pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>MISSION WATCHDOG PARAMETERS & THRESHOLDS</span>
            </span>
            <span className="text-[10px] text-purple-400">SUPER_ADMIN ONLY</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">
                  HEARTBEAT TIMEOUT (SECONDS):
                </label>
                <input
                  type="number"
                  value={settings.heartbeatTimeoutSeconds}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      heartbeatTimeoutSeconds: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  LOW BATTERY ADVISORY THRESHOLD (%):
                </label>
                <input
                  type="number"
                  value={settings.batteryLowThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      batteryLowThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  PRIMARY TRANSIT SECTOR:
                </label>
                <input
                  type="text"
                  value={settings.dispatchSector}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dispatchSector: e.target.value,
                    })
                  }
                  className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                {saving ? 'Updating...' : 'Save Watchdog Parameters'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Zap, X, AlertTriangle } from 'lucide-react';
import api from '../api/axios';

export const RapidDispatchModal = ({ isOpen, onClose, vehicles = [], onEmergencyCreated }) => {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.vehicleId || 'CAB-002');
  const [emergencyType, setEmergencyType] = useState('SOS');
  const [priority, setPriority] = useState('LEVEL_1_CRITICAL');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentVehicle = vehicles.find((v) => v.vehicleId === vehicleId) || vehicles[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/emergencies', {
        deviceId: currentVehicle?.sosDeviceId || 'SOS-002',
        gatewayId: currentVehicle?.gatewayId || 'GW-002',
        vehicleId,
        type: emergencyType,
        priority,
        latitude: currentVehicle?.currentLocation?.latitude || 22.8046,
        longitude: currentVehicle?.currentLocation?.longitude || 86.2029,
        source: 'MANUAL_DISPATCH_OVERRIDE',
      });
      if (onEmergencyCreated) onEmergencyCreated(res.data.emergency);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0e1622] border border-red-700 rounded-md shadow-2xl max-w-md w-full overflow-hidden text-slate-200 font-mono">
        <div className="bg-gradient-to-r from-red-800 to-red-950 px-4 py-3 border-b border-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>RAPID DISPATCH OVERRIDE CONSOLE</span>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="bg-red-950/40 p-2.5 rounded border border-red-900/60 text-xs text-red-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              WARNING: This issues a verified emergency priority packet directly to central dispatch and sounds tactical alarms on all consoles.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              TARGET FLEET VEHICLE:
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
            >
              {vehicles.map((v) => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  {v.vehicleId} [{v.registrationNumber}] - Driver: {v.driverName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                EMERGENCY TYPE:
              </label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-xs text-slate-100 focus:outline-none"
              >
                <option value="SOS">SOS (Panic Button)</option>
                <option value="TAMPER">TAMPER (Chassis Trip)</option>
                <option value="LOW_BATTERY">LOW_BATTERY</option>
                <option value="DEVICE_OFFLINE">DEVICE_OFFLINE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                PRIORITY TIER:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-xs text-slate-100 focus:outline-none"
              >
                <option value="LEVEL_1_CRITICAL">LEVEL 1 CRITICAL</option>
                <option value="LEVEL_2_HIGH">LEVEL 2 HIGH</option>
                <option value="WARNING">WARNING</option>
                <option value="ADVISORY">ADVISORY</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#15202e] hover:bg-[#1c2c3e] text-slate-300 text-xs transition-colors"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950/60"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>TRANSMIT OVERRIDE NOW</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Terminal,
  Send,
  Flame,
  Unlock,
  Radio,
  RadioOff,
  Battery,
  MapPin,
  CheckCircle2,
  Code2,
  Loader2,
} from 'lucide-react';

export const SimulatorPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [targetVehicleId, setTargetVehicleId] = useState('CAB-002');
  const [targetDeviceId, setTargetDeviceId] = useState('SOS-002');
  const [targetGatewayId, setTargetGatewayId] = useState('GW-002');

  const [batteryLevel, setBatteryLevel] = useState(78);
  const [batteryVoltage, setBatteryVoltage] = useState(3.91);
  const [latitude, setLatitude] = useState(22.8046);
  const [longitude, setLongitude] = useState(86.2029);
  const [tamper, setTamper] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('ONLINE');

  const [lastRequest, setLastRequest] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get('/vehicles');
        if (res.data.success) {
          setVehicles(res.data.vehicles);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchVehicles();
  }, []);

  const handleVehicleChange = (vId) => {
    setTargetVehicleId(vId);
    const v = vehicles.find((item) => item.vehicleId === vId);
    if (v) {
      setTargetDeviceId(v.sosDeviceId || 'SOS-002');
      setTargetGatewayId(v.gatewayId || 'GW-002');
      if (v.currentLocation) {
        setLatitude(v.currentLocation.latitude);
        setLongitude(v.currentLocation.longitude);
      }
    }
  };

  const addLog = (action, res, payload) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      {
        time,
        action,
        status: res.status,
        success: true,
      },
      ...prev.slice(0, 20),
    ]);
  };

  // 1. Send SOS
  const sendSOS = async () => {
    setLoading(true);
    const payload = {
      deviceId: targetDeviceId,
      gatewayId: targetGatewayId,
      vehicleId: targetVehicleId,
      type: 'SOS',
      priority: 'LEVEL_1_CRITICAL',
      latitude: Number(latitude),
      longitude: Number(longitude),
      batteryLevel: Number(batteryLevel),
      batteryVoltage: Number(batteryVoltage),
      source: 'SIMULATOR_HARDWARE_BENCH',
      timestamp: new Date().toISOString(),
    };
    setLastRequest({ endpoint: 'POST /api/emergencies', payload });

    try {
      const res = await api.post('/emergencies', payload);
      setLastResponse(res.data);
      addLog('Send SOS', res, payload);
    } catch (err) {
      setLastResponse(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Tamper
  const sendTamper = async () => {
    setLoading(true);
    const newTamperState = !tamper;
    setTamper(newTamperState);

    const payload = {
      deviceId: targetDeviceId,
      tamper: newTamperState,
      resistance: newTamperState ? 999.0 : 2.1,
    };
    setLastRequest({ endpoint: 'POST /api/telemetry/tamper', payload });

    try {
      const res = await api.post('/telemetry/tamper', payload);
      if (newTamperState) {
        // Also fire emergency record
        await api.post('/emergencies', {
          deviceId: targetDeviceId,
          gatewayId: targetGatewayId,
          vehicleId: targetVehicleId,
          type: 'TAMPER',
          priority: 'WARNING',
          latitude: Number(latitude),
          longitude: Number(longitude),
          source: 'SIMULATOR_TAMPER_SWITCH',
        });
      }
      setLastResponse(res.data);
      addLog('Send Tamper', res, payload);
    } catch (err) {
      setLastResponse(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 3. Send Heartbeat
  const sendHeartbeat = async () => {
    setLoading(true);
    const payload = {
      deviceId: targetDeviceId,
      gatewayId: targetGatewayId,
      vehicleId: targetVehicleId,
      batteryLevel: Number(batteryLevel),
      batteryVoltage: Number(batteryVoltage),
      tamper: tamper,
      wirelessConnected: true,
      rssi: -66,
      jitterMs: 11,
      timestamp: new Date().toISOString(),
    };
    setLastRequest({ endpoint: 'POST /api/telemetry/heartbeat', payload });

    try {
      const res = await api.post('/telemetry/heartbeat', payload);
      setLastResponse(res.data);
      addLog('Send Heartbeat', res, payload);
    } catch (err) {
      setLastResponse(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 4. Send Location
  const sendLocation = async () => {
    setLoading(true);
    const payload = {
      vehicleId: targetVehicleId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      speed: 38,
      heading: 'NW 315°',
      satellites: 14,
      hdop: 0.9,
    };
    setLastRequest({ endpoint: 'POST /api/telemetry/location', payload });

    try {
      const res = await api.post('/telemetry/location', payload);
      setLastResponse(res.data);
      addLog('Send Location', res, payload);
    } catch (err) {
      setLastResponse(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 5. Set Low Battery
  const setLowBattery = async () => {
    setLoading(true);
    setBatteryLevel(18);
    setBatteryVoltage(3.45);
    const payload = {
      deviceId: targetDeviceId,
      batteryPercentage: 18,
      batteryVoltage: 3.45,
    };
    setLastRequest({ endpoint: 'POST /api/telemetry/battery', payload });

    try {
      const res = await api.post('/telemetry/battery', payload);
      setLastResponse(res.data);
      addLog('Set Low Battery', res, payload);
    } catch (err) {
      setLastResponse(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 6. Set Offline / Online
  const toggleOnlineOffline = async () => {
    setLoading(true);
    const newStatus = deviceStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setDeviceStatus(newStatus);

    try {
      await api.put(`/devices/${targetDeviceId}`, {
        status: newStatus,
        wirelessStatus: newStatus === 'ONLINE' ? 'CONNECTED' : 'DISCONNECTED',
      });
      await api.put(`/vehicles/${targetVehicleId}`, {
        status: newStatus,
      });
      setLastRequest({
        endpoint: `PUT /api/devices/${targetDeviceId}`,
        payload: { status: newStatus },
      });
      setLastResponse({ success: true, status: newStatus });
      addLog(`Set ${newStatus}`, { status: 200 }, { status: newStatus });
    } catch (err) {
      setLastResponse(err.response?.data || { error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              HARDWARE TEST BENCH & TELEMETRY SIMULATOR
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-xs border border-amber-800">
              ESP32 + GNSS + 4G Gateway Emulation
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Transmits real HTTP REST & Socket payloads to backend controllers to validate the complete emergency flow before physical hardware attachment.
          </div>
        </div>
      </div>

      {/* Simulator Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Controls Panel */}
        <div className="lg:col-span-6 bg-[#0b111a] border border-[#1b2838] rounded-md p-4 space-y-4 shadow-sm">
          <div className="text-xs font-bold text-cyan-400 uppercase border-b border-[#1b2838] pb-2 flex items-center justify-between">
            <span>HARDWARE PARAMETERS</span>
            <span className="text-slate-400 text-[10px]">Real API Dispatcher</span>
          </div>

          {/* Vehicle & Hardware Selectors */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">VEHICLE:</label>
              <select
                value={targetVehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-cyan-400 font-bold focus:outline-none"
              >
                {vehicles.map((v) => (
                  <option key={v.vehicleId} value={v.vehicleId}>
                    {v.vehicleId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">DEVICE ID:</label>
              <input
                type="text"
                value={targetDeviceId}
                onChange={(e) => setTargetDeviceId(e.target.value)}
                className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-200 uppercase"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">GATEWAY ID:</label>
              <input
                type="text"
                value={targetGatewayId}
                onChange={(e) => setTargetGatewayId(e.target.value)}
                className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-200 uppercase"
              />
            </div>
          </div>

          {/* Battery slider (Section 15 in prompt) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">BATTERY LEVEL:</span>
              <span className="text-emerald-400 font-bold">
                {batteryLevel}% ({batteryVoltage}V LiPo)
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={batteryLevel}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBatteryLevel(val);
                setBatteryVoltage(Number((3.2 + (val / 100) * 0.95).toFixed(2)));
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Coordinates inputs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">LATITUDE (GNSS):</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">LONGITUDE (GNSS):</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-200"
              />
            </div>
          </div>

          {/* Tamper and Status toggles */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-[#121c29] border border-[#223348]">
              <span className="text-slate-400">TAMPER SWITCH:</span>
              <button
                type="button"
                onClick={() => setTamper(!tamper)}
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  tamper ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {tamper ? 'OPEN (999Ω)' : 'CLOSED (2.1Ω)'}
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#121c29] border border-[#223348]">
              <span className="text-slate-400">DEVICE STATUS:</span>
              <button
                type="button"
                onClick={toggleOnlineOffline}
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  deviceStatus === 'ONLINE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {deviceStatus}
              </button>
            </div>
          </div>

          {/* Action Trigger Buttons (Section 15 in prompt) */}
          <div className="pt-2 border-t border-[#1b2838] space-y-2">
            <div className="text-[10px] text-slate-400 uppercase font-bold">
              TRANSMIT PACKET TO REAL BACKEND CONTROLLER:
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={sendSOS}
                disabled={loading}
                className="py-2 px-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950 transition-all active:scale-95"
              >
                <Flame className="w-4 h-4" />
                <span>[Send SOS]</span>
              </button>

              <button
                onClick={sendTamper}
                disabled={loading}
                className="py-2 px-2.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>[Send Tamper]</span>
              </button>

              <button
                onClick={sendHeartbeat}
                disabled={loading}
                className="py-2 px-2.5 rounded bg-[#16273a] hover:bg-[#20364f] border border-[#274261] text-cyan-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Radio className="w-4 h-4" />
                <span>[Send Heartbeat]</span>
              </button>

              <button
                onClick={sendLocation}
                disabled={loading}
                className="py-2 px-2.5 rounded bg-[#16273a] hover:bg-[#20364f] border border-[#274261] text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <MapPin className="w-4 h-4" />
                <span>[Send Location]</span>
              </button>

              <button
                onClick={setLowBattery}
                disabled={loading}
                className="py-2 px-2.5 rounded bg-[#2a1e16] hover:bg-[#38281d] border border-amber-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Battery className="w-4 h-4" />
                <span>[Set Low Battery]</span>
              </button>

              <button
                onClick={toggleOnlineOffline}
                disabled={loading}
                className="py-2 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <RadioOff className="w-4 h-4" />
                <span>[Set {deviceStatus === 'ONLINE' ? 'Offline' : 'Online'}]</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Packet Telemetry & Terminal Inspector */}
        <div className="lg:col-span-6 space-y-3">
          {/* Packet JSON Inspector */}
          <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-[#1b2838] pb-1.5">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                <Code2 className="w-4 h-4" />
                <span>RAW HARDWARE PACKET INJECTION TRACE</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">ESP32 REST Gateway Format</span>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 mb-0.5">ENDPOINT CALLED:</div>
              <div className="p-1.5 bg-[#080d14] rounded border border-[#172435] text-cyan-300 font-mono text-[11px]">
                {lastRequest?.endpoint || 'Awaiting transmission...'}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 mb-0.5">REQUEST PAYLOAD:</div>
              <pre className="p-2 bg-[#080d14] rounded border border-[#172435] text-emerald-400 overflow-x-auto text-[10px] max-h-36">
                {lastRequest
                  ? JSON.stringify(lastRequest.payload, null, 2)
                  : '// Click any simulation button on the left to inspect raw JSON payload'}
              </pre>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 mb-0.5">SERVER RESPONSE:</div>
              <pre className="p-2 bg-[#080d14] rounded border border-[#172435] text-amber-300 overflow-x-auto text-[10px] max-h-36">
                {lastResponse
                  ? JSON.stringify(lastResponse, null, 2)
                  : '// HTTP response from Node.js Express server will appear here'}
              </pre>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3 text-xs">
            <div className="font-bold text-slate-300 mb-2 border-b border-[#1b2838] pb-1">
              RECENT SIMULATOR TRANSMISSIONS
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-[11px]">No packets dispatched yet.</div>
              ) : (
                logs.map((lg, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{lg.action}</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{lg.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

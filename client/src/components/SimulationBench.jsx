import React, { useState } from 'react';
import api from '../api/axios';
import {
  Flame,
  Unlock,
  RadioOff,
  Radio,
  BatteryLow,
  Navigation,
  Send,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export const SimulationBench = ({ vehicles = [], selectedVehicle, onRefresh }) => {
  const [targetVehicleId, setTargetVehicleId] = useState(
    selectedVehicle?.vehicleId || 'CAB-002'
  );
  const [batteryVal, setBatteryVal] = useState(72);
  const [tamperState, setTamperState] = useState(false);
  const [statusLog, setStatusLog] = useState(
    'SIMULATION BENCH READY: Awaiting packet injection commands...'
  );
  const [loadingAction, setLoadingAction] = useState(null);

  const currentVehicle =
    vehicles.find((v) => v.vehicleId === targetVehicleId) || vehicles[0];

  const logResult = (actionName, success, details) => {
    const time = new Date().toLocaleTimeString();
    setStatusLog(
      `[${time}] ${actionName}: ${success ? 'OK (200 Ingested)' : 'FAILED'} - ${details}`
    );
  };

  // 1. Trigger SOS (Hardware SOS Button Interrupt)
  const handleTriggerSOS = async () => {
    setLoadingAction('sos');
    try {
      const res = await api.post('/emergencies', {
        deviceId: currentVehicle?.sosDeviceId || 'SOS-002',
        gatewayId: currentVehicle?.gatewayId || 'GW-002',
        vehicleId: targetVehicleId,
        type: 'SOS',
        priority: 'LEVEL_1_CRITICAL',
        latitude: currentVehicle?.currentLocation?.latitude || 22.8046,
        longitude: currentVehicle?.currentLocation?.longitude || 86.2029,
        speed: currentVehicle?.currentLocation?.speed || 42,
        batteryLevel: batteryVal,
        batteryVoltage: 3.88,
        source: 'SIMULATOR_TEST_BENCH',
      });
      logResult('Trigger SOS', true, `Emergency ID: ${res.data.emergencyId}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      logResult('Trigger SOS', false, err.response?.data?.message || err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Trip Tamper (Enclosure switch opened)
  const handleTripTamper = async () => {
    setLoadingAction('tamper');
    try {
      const nextTamper = !tamperState;
      setTamperState(nextTamper);
      const res = await api.post('/telemetry/tamper', {
        deviceId: currentVehicle?.sosDeviceId || 'SOS-002',
        tamper: nextTamper,
        resistance: nextTamper ? 999.0 : 2.1,
      });

      // Also trigger emergency record if tampered
      if (nextTamper) {
        await api.post('/emergencies', {
          deviceId: currentVehicle?.sosDeviceId || 'SOS-002',
          gatewayId: currentVehicle?.gatewayId || 'GW-002',
          vehicleId: targetVehicleId,
          type: 'TAMPER',
          priority: 'WARNING',
          latitude: currentVehicle?.currentLocation?.latitude || 22.8046,
          longitude: currentVehicle?.currentLocation?.longitude || 86.2029,
          tamperCircuit: 'TAMPER_TRIGGERED (Loop 999Ω OPEN)',
          source: 'SIMULATOR_CHASSIS_SWITCH',
        });
      }

      logResult(
        'Trip Tamper',
        true,
        nextTamper ? 'Chassis Loop OPEN (999Ω)' : 'Loop CLOSED (2.1Ω)'
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      logResult('Trip Tamper', false, err.response?.data?.message || err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Stop Heartbeat (Simulate dead node / RF blockage)
  const handleStopHeartbeat = async () => {
    setLoadingAction('stopHeartbeat');
    try {
      await api.put(`/devices/${currentVehicle?.sosDeviceId || 'SOS-002'}`, {
        status: 'OFFLINE',
        wirelessStatus: 'DISCONNECTED',
      });
      await api.put(`/vehicles/${targetVehicleId}`, {
        status: 'OFFLINE',
      });
      logResult('Stop Heartbeat', true, `Node ${targetVehicleId} marked OFFLINE`);
      if (onRefresh) onRefresh();
    } catch (err) {
      logResult('Stop Heartbeat', false, err.response?.data?.message || err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Restore Heartbeat (Re-establish 2.4GHz link)
  const handleRestoreHeartbeat = async () => {
    setLoadingAction('restoreHeartbeat');
    try {
      const res = await api.post('/telemetry/heartbeat', {
        deviceId: currentVehicle?.sosDeviceId || 'SOS-002',
        gatewayId: currentVehicle?.gatewayId || 'GW-002',
        vehicleId: targetVehicleId,
        batteryLevel: batteryVal,
        batteryVoltage: 3.92,
        tamper: false,
        wirelessConnected: true,
        rssi: -65,
        jitterMs: 11,
      });
      logResult('Restore Heartbeat', true, 'RF handshake locked. Telemetry restored.');
      if (onRefresh) onRefresh();
    } catch (err) {
      logResult('Restore Heartbeat', false, err.response?.data?.message || err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // 5. Sim Low Battery (Inject 18% LiPo brownout advisory)
  const handleSimLowBattery = async () => {
    setLoadingAction('battery');
    try {
      setBatteryVal(18);
      await api.post('/telemetry/battery', {
        deviceId: currentVehicle?.sosDeviceId || 'SOS-002',
        batteryPercentage: 18,
        batteryVoltage: 3.42,
      });
      logResult('Sim Low Battery', true, 'Battery dropped to 18% (Brownout advisory issued)');
      if (onRefresh) onRefresh();
    } catch (err) {
      logResult('Sim Low Battery', false, err.response?.data?.message || err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // 6. Sim Movement (GPS waypoint step simulation)
  const handleSimMovement = async () => {
    setLoadingAction('movement');
    try {
      const currLat = currentVehicle?.currentLocation?.latitude || 22.8046;
      const currLng = currentVehicle?.currentLocation?.longitude || 86.2029;
      const step = 0.003 * (Math.random() > 0.5 ? 1 : -1);

      const res = await api.post('/telemetry/location', {
        vehicleId: targetVehicleId,
        latitude: currLat + step,
        longitude: currLng + step * 0.8,
        speed: Math.floor(30 + Math.random() * 25),
        heading: 'NW 315°',
        satellites: 14,
        hdop: 0.9,
      });
      logResult('Sim Movement', true, `Updated location to [${(currLat + step).toFixed(4)}, ${(currLng + step * 0.8).toFixed(4)}]`);
      if (onRefresh) onRefresh();
    } catch (err) {
      logResult('Sim Movement', false, err.response?.data?.message || err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-[#0b111a] border border-[#1b2838] rounded-md overflow-hidden shadow-sm flex flex-col justify-between">
      {/* Header Strip */}
      <div className="px-3 py-2 bg-[#090e15] border-b border-[#1b2838] flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
              RESEARCH PROTOTYPE SIMULATION BENCH
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-cyan-300 text-[10px] font-mono">
              University Evaluation Suite
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Inject mock telemetry packets via gateway MQTT/REST to validate dispatcher reaction times and fail-safes.
          </div>
        </div>

        {/* Target Vehicle Selector */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-slate-400">TARGET:</span>
          <select
            value={targetVehicleId}
            onChange={(e) => setTargetVehicleId(e.target.value)}
            className="bg-[#121c29] border border-[#223348] text-cyan-400 px-2 py-1 rounded focus:outline-none"
          >
            {vehicles.map((vh) => (
              <option key={vh.vehicleId} value={vh.vehicleId}>
                {vh.vehicleId} ({vh.sosDeviceId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulator Action Buttons matching screenshot */}
      <div className="p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Button 1: Trigger SOS */}
          <button
            onClick={handleTriggerSOS}
            disabled={loadingAction !== null}
            className="py-2 px-3 rounded bg-red-950/50 hover:bg-red-900/60 border border-red-800 text-red-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {loadingAction === 'sos' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Flame className="w-3.5 h-3.5 text-red-400" />
            )}
            <span>Trigger SOS</span>
          </button>

          {/* Button 2: Trip Tamper */}
          <button
            onClick={handleTripTamper}
            disabled={loadingAction !== null}
            className="py-2 px-3 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800 text-amber-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {loadingAction === 'tamper' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{tamperState ? 'Reset Tamper' : 'Trip Tamper'}</span>
          </button>

          {/* Button 3: Stop Heartbeat */}
          <button
            onClick={handleStopHeartbeat}
            disabled={loadingAction !== null}
            className="py-2 px-3 rounded bg-[#16202c] hover:bg-[#1e2c3d] border border-[#24354a] text-slate-300 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {loadingAction === 'stopHeartbeat' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RadioOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Stop Heartbeat</span>
          </button>

          {/* Button 4: Restore Heartbeat */}
          <button
            onClick={handleRestoreHeartbeat}
            disabled={loadingAction !== null}
            className="py-2 px-3 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {loadingAction === 'restoreHeartbeat' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Restore Heartbeat</span>
          </button>

          {/* Button 5: Sim Low Battery */}
          <button
            onClick={handleSimLowBattery}
            disabled={loadingAction !== null}
            className="py-2 px-3 rounded bg-amber-950/30 hover:bg-amber-900/50 border border-amber-800/80 text-amber-400 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {loadingAction === 'battery' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BatteryLow className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Sim Low Battery</span>
          </button>

          {/* Button 6: Sim Movement */}
          <button
            onClick={handleSimMovement}
            disabled={loadingAction !== null}
            className="py-2 px-3 rounded bg-[#132233] hover:bg-[#1a2f47] border border-[#243f60] text-cyan-300 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {loadingAction === 'movement' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Sim Movement</span>
          </button>
        </div>
      </div>

      {/* Real-time Status Readout Box */}
      <div className="px-3 py-2 bg-[#090e15] border-t border-[#1b2838] flex items-center gap-2 text-[10px] font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="text-slate-400 truncate">{statusLog}</span>
      </div>
    </div>
  );
};

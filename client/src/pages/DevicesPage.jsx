import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Cpu,
  Radio,
  Battery,
  Shield,
  Clock,
  Wifi,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export const DevicesPage = () => {
  const [activeTab, setActiveTab] = useState('SOS_DEVICES');
  const [devices, setDevices] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dRes, gRes] = await Promise.all([
        api.get('/devices'),
        api.get('/gateways'),
      ]);
      if (dRes.data.success) {
        setDevices(dRes.data.devices);
        if (!selectedDevice && dRes.data.devices.length > 0) {
          setSelectedDevice(dRes.data.devices[0]);
        }
      }
      if (gRes.data.success) setGateways(gRes.data.gateways);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-4 font-mono">
      {/* Header Banner */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              HARDWARE BENCH: SOS NODES & 4G GATEWAYS
            </span>
            <span className="px-2 py-0.5 rounded bg-[#152334] text-cyan-400 text-xs border border-[#223a54]">
              ESP32-C3 Subsystem
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Transceiver health, LiPo battery decay, RF packet jitter, and tamper circuit loops.
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-[#121c29] p-1 rounded border border-[#223348] text-xs">
          <button
            onClick={() => setActiveTab('SOS_DEVICES')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'SOS_DEVICES'
                ? 'bg-[#1b2b3e] text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SOS Devices ({devices.length})
          </button>
          <button
            onClick={() => setActiveTab('GATEWAYS')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'GATEWAYS'
                ? 'bg-[#1b2b3e] text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gateways ({gateways.length})
          </button>
        </div>
      </div>

      {activeTab === 'SOS_DEVICES' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Device list */}
          <div className="lg:col-span-6 space-y-2">
            {devices.map((d) => {
              const isSelected = selectedDevice?.deviceId === d.deviceId;
              return (
                <div
                  key={d.deviceId}
                  onClick={() => setSelectedDevice(d)}
                  className={`bg-[#0b111a] border rounded-md p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-[#121f2f]'
                      : 'border-[#1b2838] hover:border-[#2a3e56]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          d.status === 'ONLINE'
                            ? 'bg-emerald-400'
                            : d.status === 'EMERGENCY'
                            ? 'bg-red-500 animate-ping'
                            : d.status === 'TAMPERED'
                            ? 'bg-amber-400'
                            : 'bg-slate-500'
                        }`}
                      />
                      <span className="font-bold text-cyan-400">{d.deviceId}</span>
                      <span className="text-slate-400 text-xs">({d.deviceSerialNumber})</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        d.status === 'ONLINE'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : d.status === 'EMERGENCY'
                          ? 'bg-red-950 text-red-300 border-red-800'
                          : d.status === 'TAMPERED'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-300 pt-2 border-t border-[#182332]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">VEHICLE:</span>
                      <span>{d.assignedVehicleId || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">BATTERY:</span>
                      <span className={d.batteryPercentage < 35 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        {d.batteryPercentage}% ({d.batteryVoltage}V)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">TAMPER:</span>
                      <span className={d.tamperStatus === 'TAMPER_TRIGGERED' ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                        {d.tamperStatus}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Device Health Dossier (Section 10 in prompt) */}
          <div className="lg:col-span-6">
            {selectedDevice ? (
              <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 space-y-4">
                <div className="border-b border-[#1b2838] pb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 uppercase">DEVICE HEALTH DOSSIER</div>
                    <div className="text-base font-bold text-cyan-400">{selectedDevice.deviceId}</div>
                  </div>
                  <span className="text-[10px] text-slate-400">Microcontroller: {selectedDevice.microcontroller}</span>
                </div>

                {/* Formatted Device Health section matching prompt */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded bg-[#0f1722] border border-[#1a293c]">
                    <div className="text-slate-400 text-[10px]">BATTERY:</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">
                      {selectedDevice.batteryPercentage}%
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {selectedDevice.batteryVoltage}V // {selectedDevice.batteryChemistry}
                    </div>
                  </div>

                  <div className="p-3 rounded bg-[#0f1722] border border-[#1a293c]">
                    <div className="text-slate-400 text-[10px]">HEARTBEAT:</div>
                    <div className="text-lg font-bold text-cyan-400 mt-0.5">
                      {selectedDevice.status === 'OFFLINE' ? 'Offline' : 'Online'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Jitter: {selectedDevice.heartbeatJitterMs}ms
                    </div>
                  </div>

                  <div className="p-3 rounded bg-[#0f1722] border border-[#1a293c]">
                    <div className="text-slate-400 text-[10px]">WIRELESS LINK:</div>
                    <div className="text-lg font-bold text-slate-100 mt-0.5">
                      {selectedDevice.wirelessStatus}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      RSSI: {selectedDevice.rssi} dBm (2.4GHz)
                    </div>
                  </div>

                  <div className="p-3 rounded bg-[#0f1722] border border-[#1a293c]">
                    <div className="text-slate-400 text-[10px]">TAMPER:</div>
                    <div
                      className={`text-lg font-bold mt-0.5 ${
                        selectedDevice.tamperStatus === 'TAMPER_TRIGGERED'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {selectedDevice.tamperStatus === 'TAMPER_TRIGGERED' ? 'Triggered' : 'Normal'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Loop: {selectedDevice.tamperCircuitResistance} Ω
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-[#0f1722] border border-[#1a293c] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Firmware:</span>
                    <span className="text-slate-200">{selectedDevice.firmwareVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Seen:</span>
                    <span className="text-slate-200">
                      {new Date(selectedDevice.lastHeartbeat).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Vehicle:</span>
                    <span className="text-cyan-400 font-bold">
                      {selectedDevice.assignedVehicleId || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* Gateways section matching Section 11 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {gateways.map((gw) => (
            <div
              key={gw.gatewayId}
              className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-cyan-400">{gw.gatewayId}</div>
                  <div className="text-xs text-slate-400">{gw.gatewaySerialNumber}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                    gw.status === 'ONLINE'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {gw.status}
                </span>
              </div>

              <div className="p-2 rounded bg-[#0e1622] border border-[#172332] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">4G Modem:</span>
                  <span className="text-emerald-400 font-bold">{gw.cellularStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GNSS:</span>
                  <span className="text-cyan-400 font-bold">{gw.gnssStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Signal:</span>
                  <span className="text-slate-200 font-semibold">{gw.signalStrength} ({gw.rssi} dBm)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle:</span>
                  <span className="text-slate-200">{gw.vehicleId || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Firmware:</span>
                  <span className="text-slate-400">{gw.firmwareVersion}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Last Heartbeat:</span>
                <span>{new Date(gw.lastHeartbeat).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Battery,
  Wifi,
  Clock,
  Lock,
  Compass,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const HardwareDiagnosticsBench = ({
  vehicles = [],
  selectedVehicle,
  onSelectVehicle,
  selectedDevice,
  selectedGateway,
}) => {
  const v = selectedVehicle || vehicles[0];
  const dev = selectedDevice;
  const gw = selectedGateway;

  const batteryVolts = dev?.batteryVoltage || (v?.status === 'EMERGENCY' ? 3.88 : 3.96);
  const batteryPct = dev?.batteryPercentage || (v?.status === 'EMERGENCY' ? 72 : 87);
  const rssi = dev?.rssi || -68;
  const jitter = dev?.heartbeatJitterMs || 12;
  const tamperResistance = dev?.tamperCircuitResistance || (dev?.tamperStatus === 'TAMPER_TRIGGERED' ? 999.0 : 2.1);
  const isTampered = dev?.tamperStatus === 'TAMPER_TRIGGERED';
  const hdop = v?.currentLocation?.hdop || 0.9;
  const satellites = v?.currentLocation?.satellites || 14;
  const cellularModem = gw?.cellularModem || 'SIM7600 LTE Cat-M1';

  return (
    <div className="bg-[#0b111a] border border-[#1b2838] rounded-md overflow-hidden shadow-sm">
      {/* Header & Unit Selector */}
      <div className="px-3 py-2 bg-[#090e15] border-b border-[#1b2838] flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>VEHICLE TELEMETRY & HARDWARE BENCH:</span>
              <span className="text-red-400">{v?.vehicleId || 'CAB-002'}</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] font-mono">
              LIVE IOT BUS
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Deep CAN-bus, LoRa/BLE gateway transceivers, and microcontroller hardware loop diagnostics.
          </div>
        </div>

        {/* Unit Selector Tabs */}
        <div className="flex items-center gap-1 text-[10px] font-mono overflow-x-auto">
          <span className="text-slate-500 mr-1 hidden sm:inline">SELECT UNIT:</span>
          {vehicles.map((item) => (
            <button
              key={item.vehicleId}
              onClick={() => onSelectVehicle(item)}
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                v?.vehicleId === item.vehicleId
                  ? item.status === 'EMERGENCY'
                    ? 'bg-red-700 text-white font-bold'
                    : 'bg-[#1e2f44] text-cyan-400 font-bold border border-[#2e4766]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121c29]'
              }`}
            >
              {item.vehicleId} {item.status === 'EMERGENCY' && '(SOS)'}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostic Metric Tiles */}
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Tile 1: Battery Voltage */}
        <div className="bg-[#0e1622] border border-[#172535] rounded p-2.5 text-xs font-mono">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>BATTERY VOLTAGE</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {batteryVolts.toFixed(2)} V
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">
            LiPo 1S Cell ({batteryPct}%)
          </div>
        </div>

        {/* Tile 2: Wireless RSSI */}
        <div className="bg-[#0e1622] border border-[#172535] rounded p-2.5 text-xs font-mono">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>WIRELESS RSSI</span>
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-cyan-400 mt-1">
            {rssi} dBm
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate">
            2.4GHz BLE & LoRa
          </div>
        </div>

        {/* Tile 3: Heartbeat Jitter */}
        <div className="bg-[#0e1622] border border-[#172535] rounded p-2.5 text-xs font-mono">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>HEARTBEAT JITTER</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {jitter} ms
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">
            1000ms Target Pace
          </div>
        </div>

        {/* Tile 4: Tamper Circuit */}
        <div className="bg-[#0e1622] border border-[#172535] rounded p-2.5 text-xs font-mono">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>TAMPER CIRCUIT</span>
            <Lock className={`w-3.5 h-3.5 ${isTampered ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div
            className={`text-lg font-bold mt-1 ${
              isTampered ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {tamperResistance} Ω {isTampered ? 'OPEN' : 'CLOSED'}
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate">
            {isTampered ? 'Switch Tripped' : 'Microswitch Loop OK'}
          </div>
        </div>

        {/* Tile 5: GPS Precision */}
        <div className="bg-[#0e1622] border border-[#172535] rounded p-2.5 text-xs font-mono">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>GPS PRECISION</span>
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            HDOP {hdop}
          </div>
          <div className="text-[10px] text-cyan-400 font-medium">
            {satellites} Satellites 3D Fix
          </div>
        </div>

        {/* Tile 6: Cellular Modem */}
        <div className="bg-[#0e1622] border border-[#172535] rounded p-2.5 text-xs font-mono">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>CELLULAR MODEM</span>
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-slate-100 mt-1 truncate">
            LTE Cat-M1
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate">
            FirstNet / Verizon IoT
          </div>
        </div>
      </div>
    </div>
  );
};

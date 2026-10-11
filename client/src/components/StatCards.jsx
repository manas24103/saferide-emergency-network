import React from 'react';
import {
  AlertCircle,
  Truck,
  WifiOff,
  Unlock,
  BatteryCharging,
} from 'lucide-react';

export const StatCards = ({ stats }) => {
  const activeEmergencies = stats?.activeEmergencies || 0;
  const vehiclesOnline = stats?.vehicles?.online ?? 4;
  const totalVehicles = stats?.vehicles?.total ?? 5;
  const availPercentage = stats?.vehicles?.availPercentage ?? 80;
  const offlineDevices = stats?.devices?.offline ?? 1;
  const tamperAlerts = stats?.devices?.tamperAlerts ?? 1;
  const avgBattery = stats?.devices?.avgBatteryPercentage ?? 71.4;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {/* 1. Active Emergencies Card */}
      <div className="bg-[#0e1622] border border-[#26171b] rounded-md p-3 relative overflow-hidden shadow-sm hover:border-red-900/60 transition-colors">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono font-bold tracking-wider text-red-400 uppercase flex items-center gap-1">
            <span>ACTIVE EMERGENCIES</span>
            <span className="text-red-500 font-bold">*</span>
          </div>
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-red-500 tracking-tight">
            {activeEmergencies} <span className="text-xs uppercase font-normal text-red-400">CRITICAL</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            +1 Pending
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-[#1e1c24] flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>DISPATCH TARGET:</span>
          <span className="text-slate-300 font-semibold">42s AVG</span>
        </div>
      </div>

      {/* 2. Vehicles Online Card */}
      <div className="bg-[#0e1622] border border-[#172433] rounded-md p-3 relative overflow-hidden shadow-sm hover:border-[#22354c] transition-colors">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            VEHICLES ONLINE
          </div>
          <Truck className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {vehiclesOnline} / {totalVehicles}{' '}
            <span className="text-xs uppercase font-normal text-emerald-400">ONLINE</span>
          </div>
          <div className="text-[10px] font-mono text-emerald-400">
            {availPercentage}% Avail
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-[#182333] flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>TELEMETRY STREAM:</span>
          <span className="text-cyan-400 font-semibold">4.2 kB/s</span>
        </div>
      </div>

      {/* 3. Devices Offline Card */}
      <div className="bg-[#0e1622] border border-[#1f1e28] rounded-md p-3 relative overflow-hidden shadow-sm hover:border-amber-900/40 transition-colors">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            DEVICES OFFLINE
          </div>
          <WifiOff className="w-4 h-4 text-slate-400" />
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-slate-200 tracking-tight">
            {offlineDevices} <span className="text-xs uppercase font-normal text-slate-400">VEHICLE</span>
          </div>
          <div className="text-[10px] font-mono text-amber-400 font-semibold">
            CAB-004
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-[#1f222d] flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>HEARTBEAT GAP:</span>
          <span className="text-amber-400 font-semibold">&gt; 3m ago</span>
        </div>
      </div>

      {/* 4. Tamper Alerts Card */}
      <div className="bg-[#0e1622] border border-[#2b1f1a] rounded-md p-3 relative overflow-hidden shadow-sm hover:border-amber-700/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase">
            TAMPER ALERTS
          </div>
          <Unlock className="w-4 h-4 text-amber-400" />
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
            {tamperAlerts} <span className="text-xs uppercase font-normal text-amber-400/80">WARNING</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            CAB-003
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-[#262024] flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>PHYSICAL SWITCH:</span>
          <span className="text-amber-400 font-semibold">CHASSIS OPEN</span>
        </div>
      </div>

      {/* 5. Fleet Battery Avg Card */}
      <div className="bg-[#0e1622] border border-[#172433] rounded-md p-3 relative overflow-hidden shadow-sm hover:border-[#22354c] transition-colors">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            FLEET BATTERY AVG
          </div>
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {avgBattery}%
          </div>
          <div className="text-[10px] font-mono text-emerald-400">
            Nominal
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-[#182333] flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>LOWEST CELL:</span>
          <span className="text-amber-400 font-semibold">31% (CAB-004)</span>
        </div>
      </div>
    </div>
  );
};

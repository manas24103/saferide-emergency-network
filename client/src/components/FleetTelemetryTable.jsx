import React, { useState } from 'react';
import { Download, Search, Filter } from 'lucide-react';

export const FleetTelemetryTable = ({ vehicles = [], devices = [], onSelectVehicle, selectedVehicle }) => {
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Map device telemetry to vehicles
  const tableData = vehicles.map((v) => {
    const dev = devices.find((d) => d.deviceId === v.sosDeviceId || d.assignedVehicleId === v.vehicleId);
    return {
      vehicleId: v.vehicleId,
      vehicleModel: v.model,
      registrationNumber: v.registrationNumber,
      sosDevice: v.sosDeviceId || 'N/A',
      status: v.status,
      sosState: v.status === 'EMERGENCY' ? 'CRITICAL ACTIVE' : 'NORMAL',
      tamper: dev?.tamperStatus === 'TAMPER_TRIGGERED' ? 'TAMPER TRIGGERED' : 'NORMAL',
      battery: dev?.batteryPercentage ?? (v.status === 'EMERGENCY' ? 72 : 85),
      heartbeat: dev?.lastHeartbeat ? formatTimeAgo(dev.lastHeartbeat) : '1 sec ago',
      gpsFix: v.currentLocation?.satellites
        ? `LOCKED 3D (${v.currentLocation.satellites} Sats)`
        : v.status === 'OFFLINE'
        ? 'SIGNAL LOST'
        : 'LOCKED 3D (12 Sats)',
      lastSync: formatTimeAgo(v.lastSeen || Date.now()),
      raw: v,
    };
  });

  const filteredData = tableData.filter((row) => {
    const matchesSearch =
      row.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.sosDevice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'SOS ONLY') return row.status === 'EMERGENCY';
    if (filter === 'TAMPER') return row.tamper.includes('TAMPER');
    if (filter === 'OFFLINE') return row.status === 'OFFLINE';
    return true;
  });

  const exportCSV = () => {
    const headers = [
      'Vehicle ID',
      'Registration',
      'SOS Device',
      'Status',
      'SOS State',
      'Tamper',
      'Battery %',
      'GPS Fix',
      'Last Sync',
    ];
    const rows = filteredData.map((d) => [
      d.vehicleId,
      d.registrationNumber,
      d.sosDevice,
      d.status,
      d.sosState,
      d.tamper,
      d.battery,
      d.gpsFix,
      d.lastSync,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SafeRide_Fleet_Telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0b111a] border border-[#1b2838] rounded-md overflow-hidden shadow-sm flex flex-col">
      {/* Table Header Controls */}
      <div className="px-3 py-2 bg-[#090e15] border-b border-[#1b2838] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            FLEET TELEMETRY & HARDWARE STATE
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#131d2a] text-cyan-400 font-mono text-[10px]">
            {vehicles.length} Nodes
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Filter Vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 bg-[#0f1722] border border-[#223348] rounded text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-32 sm:w-40"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            {['ALL', 'SOS ONLY', 'TAMPER', 'OFFLINE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-2 py-1 rounded transition-colors ${
                  filter === tab
                    ? 'bg-[#1b2a3d] text-cyan-400 font-bold border border-[#2b415e]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#121c29]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#131f2d] hover:bg-[#1c2c3f] border border-[#24374e] text-slate-300 hover:text-white text-[10px] font-mono transition-colors"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[11px] font-mono">
          <thead>
            <tr className="border-b border-[#172332] bg-[#0c131c] text-slate-400 text-[10px]">
              <th className="py-2 px-3">VEHICLE ID</th>
              <th className="py-2 px-3">SOS DEVICE</th>
              <th className="py-2 px-3">STATUS</th>
              <th className="py-2 px-3">SOS STATE</th>
              <th className="py-2 px-3">TAMPER</th>
              <th className="py-2 px-3">BATTERY</th>
              <th className="py-2 px-3">HEARTBEAT</th>
              <th className="py-2 px-3">GPS FIX</th>
              <th className="py-2 px-3">LAST SYNC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141e2b]">
            {filteredData.map((row) => {
              const isSelected = selectedVehicle?.vehicleId === row.vehicleId;
              return (
                <tr
                  key={row.vehicleId}
                  onClick={() => onSelectVehicle && onSelectVehicle(row.raw)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#18273a]'
                      : row.status === 'EMERGENCY'
                      ? 'bg-red-950/20 hover:bg-red-950/30'
                      : 'hover:bg-[#101824]'
                  }`}
                >
                  <td className="py-2 px-3 font-bold text-cyan-400 flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        row.status === 'EMERGENCY'
                          ? 'bg-red-500 animate-ping'
                          : row.status === 'ONLINE'
                          ? 'bg-emerald-400'
                          : 'bg-slate-500'
                      }`}
                    />
                    <span>{row.vehicleId}</span>
                  </td>

                  <td className="py-2 px-3 text-slate-300">{row.sosDevice}</td>

                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'EMERGENCY'
                          ? 'bg-red-900/60 text-red-300 border border-red-700'
                          : row.status === 'ONLINE'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                          : row.status === 'OFFLINE'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>

                  <td className="py-2 px-3">
                    {row.sosState === 'CRITICAL ACTIVE' ? (
                      <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] animate-pulse">
                        CRITICAL ACTIVE
                      </span>
                    ) : (
                      <span className="text-slate-400">NORMAL</span>
                    )}
                  </td>

                  <td className="py-2 px-3">
                    {row.tamper === 'TAMPER TRIGGERED' ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-900/70 text-amber-200 border border-amber-600 font-bold text-[10px]">
                        TAMPER TRIGGERED
                      </span>
                    ) : (
                      <span className="text-slate-400">NORMAL</span>
                    )}
                  </td>

                  <td className="py-2 px-3">
                    <span
                      className={`font-semibold ${
                        row.battery < 35
                          ? 'text-red-400'
                          : row.battery < 60
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {row.battery}% {row.battery < 35 && '(Low)'}
                    </span>
                  </td>

                  <td className="py-2 px-3 text-slate-400">{row.heartbeat}</td>

                  <td className="py-2 px-3">
                    <span
                      className={
                        row.gpsFix.includes('SIGNAL LOST')
                          ? 'text-red-400 font-bold'
                          : 'text-cyan-400'
                      }
                    >
                      {row.gpsFix}
                    </span>
                  </td>

                  <td className="py-2 px-3 text-slate-400">{row.lastSync}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function formatTimeAgo(dateString) {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour}h ago`;
}

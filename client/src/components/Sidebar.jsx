import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  AlertOctagon,
  Truck,
  Cpu,
  MapPin,
  History,
  FileText,
  Users,
  Terminal,
  Radio,
  Sliders,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const Sidebar = ({ emergencyCount = 0, onTriggerRapidDispatch }) => {
  const { user } = useAuth();
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: 'Mission Control', path: '/', icon: Activity },
    {
      name: 'Incident Commander',
      path: '/emergencies',
      icon: AlertOctagon,
      badge: emergencyCount > 0 ? emergencyCount : null,
    },
    { name: 'Fleet Telemetry', path: '/vehicles', icon: Truck },
    { name: 'Hardware Bench', path: '/devices', icon: Cpu },
    { name: 'Geospatial Vector', path: '/map', icon: MapPin },
    { name: 'Event History', path: '/history', icon: History },
    { name: 'Audit Stream', path: '/audit-logs', icon: FileText },
    ...(user?.role === 'SUPER_ADMIN'
      ? [{ name: 'Operator Provisioning', path: '/users', icon: Users }]
      : []),
    { name: 'Research Simulator', path: '/simulator', icon: Terminal, highlight: true },
    { name: 'System Diagnostics', path: '/system-status', icon: Radio },
  ];

  return (
    <aside className="w-64 bg-[#090e15] border-r border-[#192434] flex flex-col justify-between select-none shrink-0 h-[calc(100vh-53px)] sticky top-[53px] overflow-y-auto">
      <div>
        {/* Operator Profile Card Header */}
        <div className="p-3 border-b border-[#16202e] bg-[#0c131d]">
          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
            <span>DISPATCH UNIT 04</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            OPERATOR: <span className="text-slate-200">{user?.name || 'DR. A. VANCE'}</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            STATION ID: {user?.badgeNumber || 'SF-FDC-99'} // {user?.role}
          </div>
        </div>

        {/* Section Heading */}
        <div className="px-3 pt-3 pb-1 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
          TACTICAL COCKPIT
        </div>

        {/* Navigation Items */}
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-all ${
                    isActive
                      ? 'bg-[#182536] text-cyan-400 font-bold border-l-2 border-cyan-400 shadow-sm'
                      : item.highlight
                      ? 'text-amber-400/90 hover:bg-[#141e2c] hover:text-amber-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121b27]'
                  }`
                }
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded bg-red-600/90 text-white text-[10px] font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Rapid Dispatch Override Button */}
        <div className="p-3 mt-3">
          <button
            onClick={onTriggerRapidDispatch}
            className="w-full py-2.5 px-3 rounded bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 active:scale-95 transition-all border border-red-600/40"
          >
            <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>RAPID DISPATCH OVERRIDE</span>
          </button>
        </div>
      </div>

      {/* Bottom Telemetry Box & Diagnostics */}
      <div className="p-3 border-t border-[#16202e] bg-[#0a1018] space-y-2 text-[10px] font-mono">
        <div className="space-y-1 text-slate-400">
          <div className="flex justify-between">
            <span className="text-slate-500">COORDINATES:</span>
            <span className="text-slate-300 font-semibold">22.8046° N, 86.2029° E</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">TIME UTC:</span>
            <span className="text-slate-300">{utcTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">LAST PACKET:</span>
            <span className="text-emerald-400 font-semibold">0.8s ago</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#16212e] flex items-center justify-between text-slate-500 text-[10px]">
          <NavLink to="/system-status" className="hover:text-cyan-400 flex items-center gap-1">
            <Sliders className="w-3 h-3" /> System Config
          </NavLink>
          <NavLink to="/devices" className="hover:text-cyan-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Diagnostics
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

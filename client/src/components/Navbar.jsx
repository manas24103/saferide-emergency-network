import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Bell,
  RefreshCw,
  LogOut,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

export const Navbar = ({ emergencyCount = 0, onRefresh }) => {
  const { user, logout } = useAuth();
  const { connected, latency, soundEnabled, toggleSound } = useSocket();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?unreadOnly=false');
      if (res.data.success) {
        setNotifications(res.data.notifications.slice(0, 8));
        setUnreadCount(res.data.notifications.filter((n) => !n.read).length);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshClick = async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    await fetchNotifications();
    setTimeout(() => setRefreshing(false), 600);
  };


  return (
    <header className="sticky top-0 z-40 bg-[#090e16] border-b border-[#1b2738] select-none">
      {/* Top Main Bar */}
      <div className="px-4 py-2 flex items-center justify-between gap-4">
        {/* Left: Branding & Prototype Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-950/40">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider text-slate-100 uppercase">
                SafeRide Emergency Network
              </div>
              <div className="text-[10px] font-mono tracking-widest text-slate-400">
                WIRELESS SOS FLEET SYSTEM
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#131c2a] border border-[#223348] text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
            <span>RESEARCH PROTOTYPE v2.4</span>
          </div>
        </div>

        {/* Center: System Status & Emergency Counter */}
        <div className="flex items-center gap-3">
          {/* Health Pill */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-mono tracking-wider ${
              connected
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-400'
                : 'bg-amber-950/30 border-amber-800/60 text-amber-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{connected ? `SYSTEM NOMINAL // ${latency}ms` : 'OFFLINE // RECONNECTING'}</span>
          </div>

          {/* Emergency Counter Badge */}
          <Link
            to="/emergencies"
            className={`flex items-center gap-2 px-3 py-1 rounded border text-xs font-mono font-bold tracking-wider transition-all ${
              emergencyCount > 0
                ? 'bg-red-950/60 border-red-700/80 text-red-300 shadow-md shadow-red-950/50 hover:bg-red-900/60'
                : 'bg-[#101824] border-[#1d2b3e] text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                emergencyCount > 0 ? 'bg-red-500 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span>
              EMERGENCY COUNTER: {String(emergencyCount).padStart(2, '0')}{' '}
              {emergencyCount === 1 ? 'SOS' : 'EVENTS'}
            </span>
          </Link>
        </div>

        {/* Right: Sound, Notifications, User Badge */}
        <div className="flex items-center gap-3">
          {/* Audio toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Audio Alerts' : 'Unmute Audio Alerts'}
            className="p-1.5 rounded hover:bg-[#162334] text-slate-300 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Refresh button */}
          <button
            onClick={handleRefreshClick}
            title="Refresh Fleet Data"
            className="p-1.5 rounded hover:bg-[#162334] text-slate-300 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin text-cyan-400' : ''}`}
            />
          </button>

          {/* Notification dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded hover:bg-[#162334] text-slate-300 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0d1622] border border-[#223348] rounded-md shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 border-b border-[#1b2738] flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    NOTIFICATIONS ({unreadCount} UNREAD)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-mono text-cyan-400 hover:underline"
                    >
                      MARK ALL READ
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-[#172230]">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-500 font-mono">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`px-3 py-2 text-xs hover:bg-[#142030] transition-colors ${
                          !n.read ? 'bg-[#162234]/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          {n.severity === 'CRITICAL' ? (
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                          )}
                          <span className="truncate">{n.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 mt-1">
                          {new Date(n.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile card */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#1d2b3e]">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.name || 'Operator'}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {user?.role === 'SUPER_ADMIN'
                  ? 'DISPATCH UNIT 04'
                  : user?.badgeNumber || 'TACTICAL DESK'}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout session"
              className="p-1.5 rounded hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </header>
  );
};

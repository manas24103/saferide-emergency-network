import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, Search, Shield, Filter, RefreshCw } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs?limit=100');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (categoryFilter !== 'ALL' && log.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.userName?.toLowerCase().includes(q) ||
        log.target?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              SYSTEM AUDIT & SECURITY TRAIL
            </span>
            <span className="px-2 py-0.5 rounded bg-[#131d2a] text-cyan-400 text-xs border border-[#1f2f44]">
              Tamper-Proof Action Log
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Immutable log of all operator authorizations, dispatches, acknowledgements, and hardware loop events.
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="p-1.5 rounded bg-[#131f2d] hover:bg-[#1a2b3e] text-slate-300"
          title="Refresh Log Stream"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400">CATEGORY:</span>
          {['ALL', 'EMERGENCY', 'AUTH', 'VEHICLE', 'DEVICE', 'CONFIG'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-1 rounded transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#1b2b3e] text-cyan-400 font-bold border border-[#2d4766]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search Action or Target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-[#0f1722] border border-[#223348] rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-[#182332] bg-[#0c131c] text-slate-400 text-[10px]">
              <th className="py-2.5 px-3">TIMESTAMP</th>
              <th className="py-2.5 px-3">OPERATOR / AGENT</th>
              <th className="py-2.5 px-3">ACTION</th>
              <th className="py-2.5 px-3">CATEGORY</th>
              <th className="py-2.5 px-3">TARGET</th>
              <th className="py-2.5 px-3">DETAILS</th>
              <th className="py-2.5 px-3">IP ADDRESS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#131d2a]">
            {filteredLogs.map((lg) => (
              <tr key={lg._id} className="hover:bg-[#101925] transition-colors">
                <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                  {new Date(lg.timestamp).toLocaleString()}
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-200">
                  {lg.userName} <span className="text-[9px] text-slate-500">({lg.userRole})</span>
                </td>
                <td className="py-2.5 px-3 font-bold text-cyan-400">{lg.action}</td>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded bg-[#131e2c] border border-[#223348] text-[10px]">
                    {lg.category}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-amber-300">{lg.target || '-'}</td>
                <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">{lg.details}</td>
                <td className="py-2.5 px-3 text-slate-500">{lg.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

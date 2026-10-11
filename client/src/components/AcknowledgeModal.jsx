import React, { useState } from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';

export const AcknowledgeModal = ({ isOpen, emergency, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !emergency) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(emergency.emergencyId || emergency._id, notes);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0e1622] border border-red-800/80 rounded-md shadow-2xl max-w-md w-full overflow-hidden text-slate-200 font-mono">
        <div className="bg-red-950/80 px-4 py-3 border-b border-red-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-200 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>ACKNOWLEDGE EMERGENCY INCIDENT</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="bg-[#121c29] p-3 rounded border border-[#1e2e42] text-xs space-y-1">
            <div>
              <span className="text-slate-400">Incident ID:</span>{' '}
              <span className="text-red-400 font-bold">{emergency.emergencyId}</span>
            </div>
            <div>
              <span className="text-slate-400">Vehicle:</span>{' '}
              <span className="text-slate-200">{emergency.vehicleId} ({emergency.vehicleNumber || 'Cab'})</span>
            </div>
            <div>
              <span className="text-slate-400">Coordinates:</span>{' '}
              <span className="text-cyan-400 font-bold">
                {emergency.latitude?.toFixed(4)}, {emergency.longitude?.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Triggered:</span>{' '}
              <span className="text-slate-300">
                {new Date(emergency.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              DISPATCH NOTES / ACTION LOG:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Unit SF-PATROL-04 dispatched to coordinates; driver contacted via in-cab radio."
              className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#15202e] hover:bg-[#1c2c3e] text-slate-300 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/50 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>CONFIRM ACKNOWLEDGEMENT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export const ResolveModal = ({ isOpen, emergency, onClose, onConfirm }) => {
  const [resolutionNotes, setResolutionNotes] = useState(
    'Incident resolved on-site by field units. Occupant and vehicle safe.'
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen || !emergency) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(emergency.emergencyId || emergency._id, resolutionNotes);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0e1622] border border-emerald-800/80 rounded-md shadow-2xl max-w-md w-full overflow-hidden text-slate-200 font-mono">
        <div className="bg-emerald-950/80 px-4 py-3 border-b border-emerald-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-200 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>MARK EMERGENCY RESOLVED</span>
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
              <span className="text-slate-400">Emergency ID:</span>{' '}
              <span className="text-emerald-400 font-bold">{emergency.emergencyId}</span>
            </div>
            <div>
              <span className="text-slate-400">Vehicle ID:</span>{' '}
              <span className="text-slate-200">{emergency.vehicleId}</span>
            </div>
            <div>
              <span className="text-slate-400">Status will be reset to:</span>{' '}
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              FORMAL RESOLUTION REPORT / CLOSING REMARKS:
            </label>
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
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
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>CONFIRM RESOLUTION & CLOSE INCIDENT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

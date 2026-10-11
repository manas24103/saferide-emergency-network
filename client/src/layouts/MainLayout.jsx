import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { RapidDispatchModal } from '../components/RapidDispatchModal';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { AlertCircle, X } from 'lucide-react';

export const MainLayout = () => {
  const { toastMessage, clearToast } = useSocket();
  const [vehicles, setVehicles] = useState([]);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [rapidModalOpen, setRapidModalOpen] = useState(false);

  const fetchGlobalData = async () => {
    try {
      const [vRes, eRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/emergencies/active'),
      ]);
      if (vRes.data.success) setVehicles(vRes.data.vehicles);
      if (eRes.data.success) setActiveEmergencies(eRes.data.emergencies);
    } catch (err) {
      console.warn('Failed to fetch layout global data:', err);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  return (
    <div className="min-h-screen bg-[#080d14] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        emergencyCount={activeEmergencies.length}
        onRefresh={fetchGlobalData}
      />

      {/* Main Tactical Shell */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          emergencyCount={activeEmergencies.length}
          onTriggerRapidDispatch={() => setRapidModalOpen(true)}
        />

        {/* Content Body */}
        <main className="flex-1 p-3 md:p-4 overflow-x-hidden min-w-0">
          <Outlet context={{ fetchGlobalData, activeEmergencies, vehicles }} />
        </main>
      </div>

      {/* Real-time Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[9990] max-w-sm w-full bg-red-950/95 border-2 border-red-600 rounded-md p-3 text-white shadow-2xl shadow-red-950 animate-bounce font-mono">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <div className="font-bold text-xs uppercase">{toastMessage.title}</div>
                <div className="text-[11px] text-red-200 mt-0.5">{toastMessage.message}</div>
              </div>
            </div>
            <button onClick={clearToast} className="text-red-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Rapid Dispatch Modal */}
      <RapidDispatchModal
        isOpen={rapidModalOpen}
        onClose={() => setRapidModalOpen(false)}
        vehicles={vehicles}
        onEmergencyCreated={() => fetchGlobalData()}
      />
    </div>
  );
};

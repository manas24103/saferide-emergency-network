import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Edit2,
  Trash2,
  ExternalLink,
  X,
} from 'lucide-react';

export const VehiclesPage = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicleId: '',
    registrationNumber: '',
    vehicleType: 'Sedan',
    model: 'Toyota Camry Hybrid',
    route: 'Downtown Core Line 1',
    driverName: '',
    driverPhone: '+91 98765 ',
    sosDeviceId: '',
    gatewayId: '',
    latitude: 22.8046,
    longitude: 86.2029,
  });

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      if (res.data.success) {
        setVehicles(res.data.vehicles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', newVehicle);
      setAddModalOpen(false);
      setNewVehicle({
        vehicleId: '',
        registrationNumber: '',
        vehicleType: 'Sedan',
        model: 'Toyota Camry Hybrid',
        route: 'Downtown Core Line 1',
        driverName: '',
        driverPhone: '+91 98765 ',
        sosDeviceId: '',
        gatewayId: '',
        latitude: 22.8046,
        longitude: 86.2029,
      });
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm(`Are you sure you want to decommission vehicle ${vehicleId}?`)) return;
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.vehicleId.toLowerCase().includes(q) ||
        v.registrationNumber.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-mono font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              FLEET VEHICLE REGISTRY & TELEMETRY
            </span>
            <span className="px-2 py-0.5 rounded bg-[#152334] text-cyan-400 font-mono text-xs border border-[#223a54]">
              {vehicles.length} Units Enrolled
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Real-time status of commercial cabs, assigned wireless SOS hardware, and GPS positions.
          </div>
        </div>

        {user?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ENROLL NEW VEHICLE</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">STATUS:</span>
          {['ALL', 'ONLINE', 'EMERGENCY', 'OFFLINE', 'MAINTENANCE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-1 rounded transition-colors ${
                statusFilter === st
                  ? 'bg-[#1b2b3e] text-cyan-400 font-bold border border-[#2c4360]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search Vehicle ID or Driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-[#0f1722] border border-[#223348] rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56"
          />
        </div>
      </div>

      {/* Vehicle Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredVehicles.map((v) => (
          <div
            key={v.vehicleId}
            className={`bg-[#0b111a] border rounded-md p-4 space-y-3 font-mono transition-all ${
              v.status === 'EMERGENCY'
                ? 'border-red-600 bg-red-950/20'
                : 'border-[#1b2838] hover:border-[#2a3e56]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base font-bold text-cyan-400 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      v.status === 'EMERGENCY'
                        ? 'bg-red-500 animate-ping'
                        : v.status === 'ONLINE'
                        ? 'bg-emerald-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span>{v.vehicleId}</span>
                </div>
                <div className="text-xs text-slate-300 font-semibold">{v.registrationNumber}</div>
                <div className="text-[10px] text-slate-400">{v.model}</div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  v.status === 'EMERGENCY'
                    ? 'bg-red-900/60 text-red-300 border-red-700 animate-pulse'
                    : v.status === 'ONLINE'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {v.status}
              </span>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded bg-[#0e1622] border border-[#162232] text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">DRIVER:</span>
                <span className="text-slate-200">{v.driverName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PHONE:</span>
                <span className="text-slate-200">{v.driverPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">SOS DEVICE:</span>
                <span className="text-cyan-400">{v.sosDeviceId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">GATEWAY:</span>
                <span className="text-slate-300">{v.gatewayId}</span>
              </div>
            </div>

            {/* Location & Speed */}
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div>
                <span className="text-slate-500">Route:</span> {v.route}
              </div>
              <div>
                <span className="text-slate-500">Speed:</span>{' '}
                <span className="text-slate-200 font-semibold">{v.currentLocation?.speed || 0} km/h</span> (
                {v.currentLocation?.heading || 'N 0°'})
              </div>
              <div>
                <span className="text-slate-500">Coordinates:</span> [
                {v.currentLocation?.latitude?.toFixed(4)}, {v.currentLocation?.longitude?.toFixed(4)}]
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-[#172332] flex items-center justify-between text-xs">
              <Link
                to={`/vehicles/${v.vehicleId}`}
                className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Full Telemetry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {user?.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => handleDeleteVehicle(v.vehicleId)}
                  className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                  title="Decommission vehicle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Vehicle Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0e1622] border border-[#223348] rounded-md max-w-lg w-full p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2838] mb-3">
              <span className="text-sm font-bold text-slate-100 uppercase">ENROLL NEW FLEET VEHICLE</span>
              <button onClick={() => setAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">VEHICLE ID (e.g. CAB-006):</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.vehicleId}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicleId: e.target.value })}
                    className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">REGISTRATION NUMBER:</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.registrationNumber}
                    onChange={(e) => setNewVehicle({ ...newVehicle, registrationNumber: e.target.value })}
                    className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">VEHICLE MODEL:</label>
                  <input
                    type="text"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">ASSIGNED ROUTE:</label>
                  <input
                    type="text"
                    value={newVehicle.route}
                    onChange={(e) => setNewVehicle({ ...newVehicle, route: e.target.value })}
                    className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">DRIVER NAME:</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.driverName}
                    onChange={(e) => setNewVehicle({ ...newVehicle, driverName: e.target.value })}
                    className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">DRIVER PHONE:</label>
                  <input
                    type="text"
                    value={newVehicle.driverPhone}
                    onChange={(e) => setNewVehicle({ ...newVehicle, driverPhone: e.target.value })}
                    className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">LINKED SOS DEVICE ID:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOS-006"
                    value={newVehicle.sosDeviceId}
                    onChange={(e) => setNewVehicle({ ...newVehicle, sosDeviceId: e.target.value })}
                    className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">LINKED GATEWAY ID:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GW-006"
                    value={newVehicle.gatewayId}
                    onChange={(e) => setNewVehicle({ ...newVehicle, gatewayId: e.target.value })}
                    className="w-full bg-[#121c29] border border-[#223348] rounded p-2 text-slate-100 uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#16212e] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Enroll Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

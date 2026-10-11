import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { LiveMap } from '../components/LiveMap';
import {
  Truck,
  ArrowLeft,
  Cpu,
  Radio,
  Clock,
  Battery,
  Shield,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const VehicleDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await api.get(`/vehicles/${id}`);
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center font-mono text-cyan-400">Loading Vehicle Dossier...</div>;
  }

  if (!data?.vehicle) {
    return <div className="p-8 text-center font-mono text-red-400">Vehicle not found.</div>;
  }

  const { vehicle, sosDevice, gateway, activeEmergencies } = data;

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/vehicles"
            className="p-1.5 rounded bg-[#131d2a] hover:bg-[#1a283a] text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{vehicle.vehicleId}</span>
              <span className="text-xs text-slate-400 font-normal">[{vehicle.registrationNumber}]</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                  vehicle.status === 'EMERGENCY'
                    ? 'bg-red-950 text-red-300 border-red-700'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
              >
                {vehicle.status}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {vehicle.model} // Route: {vehicle.route}
            </div>
          </div>
        </div>

        <div className="text-right text-xs">
          <div className="text-slate-400">Last Seen:</div>
          <div className="text-slate-200">{new Date(vehicle.lastSeen).toLocaleString()}</div>
        </div>
      </div>

      {/* Map & Telemetry Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map */}
        <div className="lg:col-span-8">
          <LiveMap
            vehicles={[vehicle]}
            selectedVehicle={vehicle}
            center={[
              vehicle.currentLocation?.latitude || 22.8046,
              vehicle.currentLocation?.longitude || 86.2029,
            ]}
            zoom={15}
          />
        </div>

        {/* Driver & Hardware Card */}
        <div className="lg:col-span-4 space-y-3">
          {/* Driver Box */}
          <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3 text-xs space-y-1.5">
            <div className="text-cyan-400 font-bold border-b border-[#182536] pb-1 uppercase">
              ASSIGNED DRIVER
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <span className="text-slate-200">{vehicle.driverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Contact:</span>
              <span className="text-slate-200">{vehicle.driverPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Speed:</span>
              <span className="text-emerald-400 font-bold">
                {vehicle.currentLocation?.speed} km/h ({vehicle.currentLocation?.heading})
              </span>
            </div>
          </div>

          {/* SOS Device Box */}
          <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3 text-xs space-y-1.5">
            <div className="text-amber-400 font-bold border-b border-[#182536] pb-1 uppercase flex items-center justify-between">
              <span>WIRELESS SOS HARDWARE</span>
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Device ID:</span>
              <span className="text-slate-200 font-bold">{sosDevice?.deviceId || vehicle.sosDeviceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Battery:</span>
              <span className="text-emerald-400 font-bold">
                {sosDevice?.batteryPercentage || 85}% ({sosDevice?.batteryVoltage || 3.92}V)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tamper Status:</span>
              <span className="text-slate-200">{sosDevice?.tamperStatus || 'NORMAL'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">RSSI:</span>
              <span className="text-cyan-400">{sosDevice?.rssi || -68} dBm</span>
            </div>
          </div>

          {/* Gateway Box */}
          <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3 text-xs space-y-1.5">
            <div className="text-cyan-400 font-bold border-b border-[#182536] pb-1 uppercase flex items-center justify-between">
              <span>VEHICLE 4G GATEWAY</span>
              <Radio className="w-3.5 h-3.5" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gateway ID:</span>
              <span className="text-slate-200 font-bold">{gateway?.gatewayId || vehicle.gatewayId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Modem:</span>
              <span className="text-slate-300 truncate max-w-[170px]">{gateway?.cellularModem || 'SIM7600 LTE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cellular Link:</span>
              <span className="text-emerald-400">{gateway?.cellularStatus || 'CONNECTED'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">GNSS Fix:</span>
              <span className="text-cyan-400">{gateway?.gnssStatus || 'LOCKED_3D'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

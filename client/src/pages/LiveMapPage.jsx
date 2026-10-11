import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { LiveMap } from '../components/LiveMap';
import { Compass, Filter, RefreshCw } from 'lucide-react';

export const LiveMapPage = () => {
  const [searchParams] = useSearchParams();
  const initialVehicleId = searchParams.get('vehicleId');
  const { socket } = useSocket();

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      if (res.data.success) {
        setVehicles(res.data.vehicles);
        if (initialVehicleId) {
          const matched = res.data.vehicles.find((v) => v.vehicleId === initialVehicleId);
          if (matched) setSelectedVehicle(matched);
        } else if (res.data.vehicles.length > 0 && !selectedVehicle) {
          setSelectedVehicle(res.data.vehicles[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [initialVehicleId]);

  useEffect(() => {
    if (!socket) return;
    socket.on('vehicle:location', (data) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v.vehicleId === data.vehicleId
            ? { ...v, currentLocation: data.location, status: data.status || v.status }
            : v
        )
      );
    });
    return () => socket.off('vehicle:location');
  }, [socket]);

  const filteredVehicles = vehicles.filter((v) => {
    if (filter === 'EMERGENCY') return v.status === 'EMERGENCY';
    if (filter === 'ONLINE') return v.status === 'ONLINE';
    if (filter === 'OFFLINE') return v.status === 'OFFLINE';
    return true;
  });

  return (
    <div className="space-y-3 font-mono">
      {/* Top Map Controls */}
      <div className="bg-[#0b111a] border border-[#1b2838] rounded-md p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-100 flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            LIVE GEOSPATIAL VECTOR MAP
          </span>
          <span className="text-slate-400">
            ({filteredVehicles.length} Active Nodes Plotted)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">FILTER:</span>
          {['ALL', 'EMERGENCY', 'ONLINE', 'OFFLINE'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-2 py-1 rounded transition-colors ${
                filter === st
                  ? 'bg-[#1b2c40] text-cyan-400 font-bold border border-[#2d4766]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={fetchVehicles}
            className="p-1 rounded hover:bg-[#162436] text-slate-400"
            title="Refresh Map Coordinates"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Tactical Map */}
      <div className="h-[calc(100vh-185px)] min-h-[500px]">
        <LiveMap
          vehicles={filteredVehicles}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={(v) => setSelectedVehicle(v)}
          zoom={14}
        />
      </div>
    </div>
  );
};

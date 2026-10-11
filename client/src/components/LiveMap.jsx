import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Marker Generator
const createTacticalMarker = (vehicle, isSelected) => {
  const isEmergency = vehicle.status === 'EMERGENCY';
  const isTampered = vehicle.status === 'TAMPERED';
  const isOffline = vehicle.status === 'OFFLINE';

  const borderColor = isEmergency
    ? '#ef4444'
    : isTampered
    ? '#f59e0b'
    : isOffline
    ? '#64748b'
    : '#10b981';

  const bgColor = isEmergency
    ? 'rgba(239, 68, 68, 0.95)'
    : isTampered
    ? 'rgba(245, 158, 11, 0.9)'
    : isOffline
    ? 'rgba(30, 41, 59, 0.85)'
    : 'rgba(16, 185, 129, 0.9)';

  const labelText = isEmergency
    ? `${vehicle.vehicleId}: SOS ACTIVE`
    : isOffline
    ? `${vehicle.vehicleId}: OFFLINE`
    : `${vehicle.vehicleId}: ${vehicle.currentLocation?.speed || 0} km/h`;

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
      ${
        isEmergency
          ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(239, 68, 68, 0.4); animation: radar-pulse 1.6s infinite; pointer-events: none; top: -6px;"></div>`
          : ''
      }
      <div style="
        background: #090e17;
        color: #f8fafc;
        border: 1px solid ${borderColor};
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span style="width: 6px; height: 6px; border-radius: 9999px; background: ${borderColor}; display: inline-block;"></span>
        ${labelText}
      </div>
      <div style="
        width: 14px;
        height: 14px;
        background: ${bgColor};
        border: 2px solid #ffffff;
        border-radius: 9999px;
        margin-top: 2px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'tactical-vehicle-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Auto-center map on selected vehicle
const MapController = ({ selectedVehicle }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate map dimensions on mount to ensure smooth tile rendering
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedVehicle?.currentLocation?.latitude && selectedVehicle?.currentLocation?.longitude) {
      map.panTo([
        selectedVehicle.currentLocation.latitude,
        selectedVehicle.currentLocation.longitude,
      ]);
    }
  }, [selectedVehicle, map]);
  return null;
};

export const LiveMap = ({
  vehicles = [],
  selectedVehicle,
  onSelectVehicle,
  center = [22.8046, 86.2029],
  zoom = 14,
}) => {
  const defaultPosition = center;
  const [mapTheme, setMapTheme] = React.useState('tactical'); // 'tactical' | 'street'

  // Selected vehicle trail coordinates
  const breadcrumbPositions = selectedVehicle?.breadcrumbs?.map((b) => [
    b.latitude,
    b.longitude,
  ]) || [];

  return (
    <div className="bg-[#0b111a] border border-[#1b2838] rounded-md overflow-hidden relative shadow-md isolate z-0">
      {/* Tactical Map Header Strip */}
      <div className="px-3 py-2 bg-[#090e15] border-b border-[#1b2838] flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">
            GEOSPATIAL VECTOR MATRIX // ZONE ALPHA
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#131d2a] text-slate-400 border border-[#1f2e42] text-[10px]">
            TRANSIT SECTOR GRID
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <button
            type="button"
            onClick={() => setMapTheme((prev) => (prev === 'tactical' ? 'street' : 'tactical'))}
            className="px-2 py-0.5 rounded bg-[#131d2a] hover:bg-[#1a293c] text-cyan-400 border border-[#1e2f44] text-[10px] transition-colors cursor-pointer"
            title="Toggle map visual style"
          >
            {mapTheme === 'tactical' ? 'MODE: TACTICAL DARK' : 'MODE: STANDARD STREET'}
          </button>
          <div className="flex items-center gap-1.5 text-red-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>SOS CLUSTER: {vehicles.filter((v) => v.status === 'EMERGENCY').length}</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">GIS LIVE 3D LOCK</span>
        </div>
      </div>

      {/* Map Body */}
      <div className={`h-[380px] w-full relative ${mapTheme === 'tactical' ? 'map-tactical-theme' : 'map-street-theme'}`}>
        <MapContainer
          center={defaultPosition}
          zoom={zoom}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          scrollWheelZoom={true}
        >
          {/* OpenStreetMap tiles (free, reliable, no API key required) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <MapController selectedVehicle={selectedVehicle} />

          {/* Breadcrumb Trail */}
          {breadcrumbPositions.length > 1 && (
            <Polyline
              positions={breadcrumbPositions}
              color="#ef4444"
              weight={3}
              opacity={0.8}
              dashArray="6, 8"
            />
          )}

          {/* Vehicle Markers */}
          {vehicles.map((v) => {
            const lat = v.currentLocation?.latitude || defaultPosition[0];
            const lng = v.currentLocation?.longitude || defaultPosition[1];
            const isSelected = selectedVehicle?.vehicleId === v.vehicleId;

            return (
              <Marker
                key={v.vehicleId}
                position={[lat, lng]}
                icon={createTacticalMarker(v, isSelected)}
                eventHandlers={{
                  click: () => onSelectVehicle && onSelectVehicle(v),
                }}
              >
                <Popup>
                  <div className="font-mono text-xs text-slate-100 p-1">
                    <div className="font-bold text-cyan-400 border-b border-slate-700 pb-1 mb-1 flex justify-between">
                      <span>{v.vehicleId}</span>
                      <span
                        className={
                          v.status === 'EMERGENCY'
                            ? 'text-red-400 font-bold'
                            : 'text-emerald-400'
                        }
                      >
                        {v.status}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-400">Model:</span> {v.model}
                      </div>
                      <div>
                        <span className="text-slate-400">Reg:</span> {v.registrationNumber}
                      </div>
                      <div>
                        <span className="text-slate-400">Driver:</span> {v.driverName}
                      </div>
                      <div>
                        <span className="text-slate-400">Speed:</span> {v.currentLocation?.speed} km/h ({v.currentLocation?.heading})
                      </div>
                      <div>
                        <span className="text-slate-400">SOS Device:</span> {v.sosDeviceId}
                      </div>
                      <div>
                        <span className="text-slate-400">Gateway:</span> {v.gatewayId}
                      </div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-slate-700 flex justify-between text-[10px]">
                      <span className="text-slate-400">Last Sync:</span>
                      <span className="text-slate-200">
                        {new Date(v.lastSeen).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Tactical Map Overlay HUD */}
        <div className="absolute top-2 left-2 z-[10] bg-[#090e15]/90 border border-[#1e2e42] rounded p-2 text-[10px] font-mono text-slate-400 pointer-events-none backdrop-blur-sm hidden sm:block">
          <div>SECTOR: DOWNTOWN CORE [GRID SF-41]</div>
          <div>DATUM: WGS-84 / EPSG 4326</div>
          <div>BASESTATION RSSI: -64 dBm [TOWER D-12]</div>
        </div>
      </div>
    </div>
  );
};

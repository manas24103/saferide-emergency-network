import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { StatCards } from '../components/StatCards';
import { LiveMap } from '../components/LiveMap';
import { CriticalAlertCard } from '../components/CriticalAlertCard';
import { FleetTelemetryTable } from '../components/FleetTelemetryTable';
import { EventAuditStream } from '../components/EventAuditStream';
import { HardwareDiagnosticsBench } from '../components/HardwareDiagnosticsBench';
import { SimulationBench } from '../components/SimulationBench';
import { AcknowledgeModal } from '../components/AcknowledgeModal';
import { ResolveModal } from '../components/ResolveModal';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [devices, setDevices] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [ackModalOpen, setAckModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [activeEmergencyTarget, setActiveEmergencyTarget] = useState(null);

  // Fetch all dashboard data from backend
  const loadDashboardData = async () => {
    try {
      const [statsRes, vRes, dRes, gRes, eRes, logRes] = await Promise.all([
        api.get('/system/stats'),
        api.get('/vehicles'),
        api.get('/devices'),
        api.get('/gateways'),
        api.get('/emergencies/active'),
        api.get('/audit-logs?limit=25'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (vRes.data.success) {
        setVehicles(vRes.data.vehicles);
        if (!selectedVehicle && vRes.data.vehicles.length > 0) {
          // Select emergency vehicle or first vehicle
          const emgV = vRes.data.vehicles.find((v) => v.status === 'EMERGENCY') || vRes.data.vehicles[0];
          setSelectedVehicle(emgV);
        }
      }
      if (dRes.data.success) setDevices(dRes.data.devices);
      if (gRes.data.success) setGateways(gRes.data.gateways);
      if (eRes.data.success) setEmergencies(eRes.data.emergencies);
      if (logRes.data.success) setAuditLogs(logRes.data.logs);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('emergency:new', (newEmg) => {
      setEmergencies((prev) => [newEmg, ...prev.filter((e) => e.emergencyId !== newEmg.emergencyId)]);
      loadDashboardData();
    });

    socket.on('emergency:updated', (updEmg) => {
      setEmergencies((prev) =>
        updEmg.status === 'RESOLVED'
          ? prev.filter((e) => e.emergencyId !== updEmg.emergencyId)
          : prev.map((e) => (e.emergencyId === updEmg.emergencyId ? updEmg : e))
      );
      loadDashboardData();
    });

    socket.on('vehicle:location', (data) => {
      setVehicles((prev) =>
        prev.map((v) =>
          v.vehicleId === data.vehicleId
            ? { ...v, currentLocation: data.location, status: data.status || v.status }
            : v
        )
      );
      if (selectedVehicle?.vehicleId === data.vehicleId) {
        setSelectedVehicle((prev) => ({
          ...prev,
          currentLocation: data.location,
          status: data.status || prev.status,
        }));
      }
    });

    socket.on('device:heartbeat', (data) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === data.deviceId
            ? {
                ...d,
                batteryPercentage: data.batteryPercentage,
                batteryVoltage: data.batteryVoltage,
                tamperStatus: data.tamperStatus,
                wirelessStatus: data.wirelessStatus,
                rssi: data.rssi,
                heartbeatJitterMs: data.jitterMs,
                lastHeartbeat: new Date(),
              }
            : d
        )
      );
    });

    socket.on('device:status', (updDev) => {
      setDevices((prev) =>
        prev.map((d) => (d.deviceId === updDev.deviceId ? updDev : d))
      );
    });

    socket.on('audit:new', (newLog) => {
      setAuditLogs((prev) => [newLog, ...prev.slice(0, 30)]);
    });

    return () => {
      socket.off('emergency:new');
      socket.off('emergency:updated');
      socket.off('vehicle:location');
      socket.off('device:heartbeat');
      socket.off('device:status');
      socket.off('audit:new');
    };
  }, [socket, selectedVehicle]);

  // Handle acknowledge
  const handleOpenAcknowledge = (emg) => {
    setActiveEmergencyTarget(emg);
    setAckModalOpen(true);
  };

  const handleConfirmAcknowledge = async (id, notes) => {
    try {
      await api.put(`/emergencies/${id}/acknowledge`, { notes });
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Handle resolve
  const handleOpenResolve = (emg) => {
    setActiveEmergencyTarget(emg);
    setResolveModalOpen(true);
  };

  const handleConfirmResolve = async (id, resolutionNotes) => {
    try {
      await api.put(`/emergencies/${id}/resolve`, { resolutionNotes });
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Selected device and gateway
  const selectedDevice = devices.find(
    (d) => d.deviceId === selectedVehicle?.sosDeviceId || d.assignedVehicleId === selectedVehicle?.vehicleId
  );
  const selectedGateway = gateways.find(
    (g) => g.gatewayId === selectedVehicle?.gatewayId || g.vehicleId === selectedVehicle?.vehicleId
  );

  // Highest priority active emergency
  const primaryEmergency = emergencies.length > 0 ? emergencies[0] : null;

  return (
    <div className="space-y-4">
      {/* 1. TOP STAT CARDS */}
      <StatCards stats={stats} />

      {/* 2. GEOSPATIAL VECTOR MATRIX & CRITICAL ALERT CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-8">
          <LiveMap
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(v) => setSelectedVehicle(v)}
          />
        </div>

        <div className="lg:col-span-4">
          <CriticalAlertCard
            emergency={primaryEmergency}
            onAcknowledge={handleOpenAcknowledge}
            onResolve={handleOpenResolve}
            onOpenTelemetry={(emg) => {
              const matched = vehicles.find((v) => v.vehicleId === emg.vehicleId);
              if (matched) setSelectedVehicle(matched);
            }}
          />
        </div>
      </div>

      {/* 3. FLEET TELEMETRY & EVENT AUDIT STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-8">
          <FleetTelemetryTable
            vehicles={vehicles}
            devices={devices}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(v) => setSelectedVehicle(v)}
          />
        </div>

        <div className="lg:col-span-4">
          <EventAuditStream events={auditLogs} />
        </div>
      </div>

      {/* 4. HARDWARE BENCH & RESEARCH SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-6">
          <HardwareDiagnosticsBench
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(v) => setSelectedVehicle(v)}
            selectedDevice={selectedDevice}
            selectedGateway={selectedGateway}
          />
        </div>

        <div className="lg:col-span-6">
          <SimulationBench
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onRefresh={loadDashboardData}
          />
        </div>
      </div>

      {/* Modals */}
      <AcknowledgeModal
        isOpen={ackModalOpen}
        emergency={activeEmergencyTarget}
        onClose={() => setAckModalOpen(false)}
        onConfirm={handleConfirmAcknowledge}
      />

      <ResolveModal
        isOpen={resolveModalOpen}
        emergency={activeEmergencyTarget}
        onClose={() => setResolveModalOpen(false)}
        onConfirm={handleConfirmResolve}
      />
    </div>
  );
};

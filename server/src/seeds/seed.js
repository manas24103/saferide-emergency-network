import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import SOSDevice from '../models/SOSDevice.js';
import Gateway from '../models/Gateway.js';
import Emergency from '../models/Emergency.js';
import Telemetry from '../models/Telemetry.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import SystemSetting from '../models/SystemSetting.js';
import { connectDB, closeDB } from '../config/db.js';

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to database...');
    await connectDB();

    console.log('[Seeder] Cleaning existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      SOSDevice.deleteMany({}),
      Gateway.deleteMany({}),
      Emergency.deleteMany({}),
      Telemetry.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      SystemSetting.deleteMany({}),
    ]);

    console.log('[Seeder] Creating system settings...');
    await SystemSetting.create({
      heartbeatTimeoutSeconds: 60,
      batteryLowThreshold: 25,
      batteryCriticalThreshold: 15,
      soundAlertsEnabled: true,
      dispatchSector: 'Zone Alpha // Transit Sector',
      telemetryStreamRateHz: 1,
    });

    console.log('[Seeder] Provisioning users...');
    const superAdmin = await User.create({
      name: 'Dr. A. Vance',
      email: 'admin@saferide.io',
      password: 'Password@123',
      role: 'SUPER_ADMIN',
      badgeNumber: 'SF-FDC-99',
      status: 'ACTIVE',
      lastLogin: new Date(),
    });

    const operator = await User.create({
      name: 'Sarah Jenkins',
      email: 'operator@saferide.io',
      password: 'Password@123',
      role: 'CONTROL_ROOM_OPERATOR',
      badgeNumber: 'TAC-OP-02',
      status: 'ACTIVE',
      lastLogin: new Date(Date.now() - 3600000),
    });

    const driver = await User.create({
      name: 'Rajesh Kumar',
      email: 'driver@saferide.io',
      password: 'Password@123',
      role: 'DRIVER',
      badgeNumber: 'DRV-CAB-002',
      status: 'ACTIVE',
      lastLogin: new Date(Date.now() - 7200000),
    });

    console.log('[Seeder] Provisioning SOS Hardware Devices...');
    const devicesData = [
      {
        deviceId: 'SOS-001',
        deviceSerialNumber: 'SN-ESP32C3-9901',
        assignedVehicleId: 'CAB-001',
        firmwareVersion: 'v1.4.2-PROD',
        batteryPercentage: 87,
        batteryVoltage: 3.96,
        status: 'ONLINE',
        tamperStatus: 'NORMAL',
        tamperCircuitResistance: 2.1,
        wirelessStatus: 'CONNECTED',
        rssi: -65,
        heartbeatJitterMs: 10,
        lastHeartbeat: new Date(Date.now() - 2000),
      },
      {
        deviceId: 'SOS-002',
        deviceSerialNumber: 'SN-ESP32C3-9902',
        assignedVehicleId: 'CAB-002',
        firmwareVersion: 'v1.4.2-PROD',
        batteryPercentage: 72,
        batteryVoltage: 3.88,
        status: 'EMERGENCY',
        tamperStatus: 'NORMAL',
        tamperCircuitResistance: 2.1,
        wirelessStatus: 'CONNECTED',
        rssi: -68,
        heartbeatJitterMs: 12,
        lastHeartbeat: new Date(Date.now() - 1000),
      },
      {
        deviceId: 'SOS-003',
        deviceSerialNumber: 'SN-ESP32C3-9903',
        assignedVehicleId: 'CAB-003',
        firmwareVersion: 'v1.4.2-PROD',
        batteryPercentage: 54,
        batteryVoltage: 3.75,
        status: 'TAMPERED',
        tamperStatus: 'TAMPER_TRIGGERED',
        tamperCircuitResistance: 999.0, // Open circuit switch
        wirelessStatus: 'CONNECTED',
        rssi: -72,
        heartbeatJitterMs: 15,
        lastHeartbeat: new Date(Date.now() - 5000),
      },
      {
        deviceId: 'SOS-004',
        deviceSerialNumber: 'SN-ESP32C3-9904',
        assignedVehicleId: 'CAB-004',
        firmwareVersion: 'v1.4.1-BETA',
        batteryPercentage: 31,
        batteryVoltage: 3.52,
        status: 'OFFLINE',
        tamperStatus: 'NORMAL',
        tamperCircuitResistance: 2.1,
        wirelessStatus: 'DISCONNECTED',
        rssi: -95,
        heartbeatJitterMs: 45,
        lastHeartbeat: new Date(Date.now() - 180000), // 3 min ago
      },
      {
        deviceId: 'SOS-005',
        deviceSerialNumber: 'SN-ESP32C3-9905',
        assignedVehicleId: 'CAB-005',
        firmwareVersion: 'v1.4.2-PROD',
        batteryPercentage: 94,
        batteryVoltage: 4.05,
        status: 'ONLINE',
        tamperStatus: 'NORMAL',
        tamperCircuitResistance: 2.1,
        wirelessStatus: 'CONNECTED',
        rssi: -62,
        heartbeatJitterMs: 9,
        lastHeartbeat: new Date(Date.now() - 1500),
      },
    ];
    const createdDevices = await SOSDevice.insertMany(devicesData);

    console.log('[Seeder] Provisioning 4G/GNSS Gateways...');
    const gatewaysData = [
      {
        gatewayId: 'GW-001',
        gatewaySerialNumber: 'GW-CELL-4001',
        vehicleId: 'CAB-001',
        cellularStatus: 'CONNECTED',
        cellularModem: 'SIM7600G-H / LTE Cat-M1',
        carrier: 'Airtel IoT',
        signalStrength: 'EXCELLENT',
        rssi: -64,
        gnssStatus: 'LOCKED_3D',
        satellitesVisible: 11,
        hdop: 1.0,
        status: 'ONLINE',
        lastHeartbeat: new Date(Date.now() - 2000),
      },
      {
        gatewayId: 'GW-002',
        gatewaySerialNumber: 'GW-CELL-4002',
        vehicleId: 'CAB-002',
        cellularStatus: 'CONNECTED',
        cellularModem: '4G LTE Cat-M1 (Band 4, -68 dBm)',
        carrier: 'FirstNet / Verizon IoT',
        signalStrength: 'GOOD',
        rssi: -68,
        gnssStatus: 'LOCKED_3D',
        satellitesVisible: 14,
        hdop: 0.9,
        status: 'ONLINE',
        lastHeartbeat: new Date(Date.now() - 1000),
      },
      {
        gatewayId: 'GW-003',
        gatewaySerialNumber: 'GW-CELL-4003',
        vehicleId: 'CAB-003',
        cellularStatus: 'CONNECTED',
        cellularModem: 'SIM7600G-H / LTE Cat-M1',
        carrier: 'Jio IoT',
        signalStrength: 'GOOD',
        rssi: -71,
        gnssStatus: 'LOCKED_3D',
        satellitesVisible: 9,
        hdop: 1.2,
        status: 'ONLINE',
        lastHeartbeat: new Date(Date.now() - 5000),
      },
      {
        gatewayId: 'GW-004',
        gatewaySerialNumber: 'GW-CELL-4004',
        vehicleId: 'CAB-004',
        cellularStatus: 'NO_SERVICE',
        cellularModem: 'SIM7600G-H / LTE Cat-M1',
        carrier: 'Airtel IoT',
        signalStrength: 'NONE',
        rssi: -110,
        gnssStatus: 'NO_FIX',
        satellitesVisible: 0,
        hdop: 9.9,
        status: 'OFFLINE',
        lastHeartbeat: new Date(Date.now() - 180000),
      },
      {
        gatewayId: 'GW-005',
        gatewaySerialNumber: 'GW-CELL-4005',
        vehicleId: 'CAB-005',
        cellularStatus: 'CONNECTED',
        cellularModem: 'SIM7600G-H / LTE Cat-M1',
        carrier: 'Vodafone IoT',
        signalStrength: 'EXCELLENT',
        rssi: -60,
        gnssStatus: 'LOCKED_3D',
        satellitesVisible: 12,
        hdop: 0.95,
        status: 'ONLINE',
        lastHeartbeat: new Date(Date.now() - 1500),
      },
    ];
    const createdGateways = await Gateway.insertMany(gatewaysData);

    console.log('[Seeder] Provisioning Fleet Vehicles...');
    // Base coordinates around realistic urban transit zone:
    // We can use 22.8046, 86.2029 (Jamshedpur/Metro Hub) with slight offsets
    const baseLat = 22.8046;
    const baseLng = 86.2029;

    const vehiclesData = [
      {
        vehicleId: 'CAB-001',
        registrationNumber: 'DL-01-AB-1081',
        vehicleType: 'Sedan',
        model: 'Swift Dzire Tour',
        route: 'North Station Expressway',
        driverName: 'Amit Verma',
        driverPhone: '+91 98234 11223',
        sosDeviceId: 'SOS-001',
        sosDevice: createdDevices[0]._id,
        gatewayId: 'GW-001',
        gateway: createdGateways[0]._id,
        status: 'ONLINE',
        currentLocation: {
          latitude: baseLat + 0.008,
          longitude: baseLng - 0.006,
          speed: 28,
          heading: 'NE 45°',
          satellites: 11,
          hdop: 1.0,
          corridor: 'Outer Ring Expressway North',
          updatedAt: new Date(),
        },
        breadcrumbs: [
          { latitude: baseLat + 0.005, longitude: baseLng - 0.009, speed: 25, timestamp: new Date(Date.now() - 600000) },
          { latitude: baseLat + 0.007, longitude: baseLng - 0.007, speed: 27, timestamp: new Date(Date.now() - 300000) },
          { latitude: baseLat + 0.008, longitude: baseLng - 0.006, speed: 28, timestamp: new Date() },
        ],
        lastSeen: new Date(),
      },
      {
        vehicleId: 'CAB-002',
        registrationNumber: 'DL-02-XY-9002',
        vehicleType: 'Sedan',
        model: 'Camry Hybrid Unit #108',
        route: 'Downtown Core Line 1',
        driverName: 'Rajesh Kumar',
        driverPhone: '+91 98765 43210',
        driver: driver._id,
        sosDeviceId: 'SOS-002',
        sosDevice: createdDevices[1]._id,
        gatewayId: 'GW-002',
        gateway: createdGateways[1]._id,
        status: 'EMERGENCY',
        currentLocation: {
          latitude: baseLat,
          longitude: baseLng,
          speed: 42,
          heading: 'NW 315°',
          satellites: 14,
          hdop: 0.9,
          corridor: 'Market St & 4th Ave, Transit Sector',
          updatedAt: new Date(),
        },
        breadcrumbs: [
          { latitude: baseLat - 0.010, longitude: baseLng + 0.012, speed: 35, timestamp: new Date(Date.now() - 600000) },
          { latitude: baseLat - 0.006, longitude: baseLng + 0.008, speed: 38, timestamp: new Date(Date.now() - 360000) },
          { latitude: baseLat - 0.002, longitude: baseLng + 0.003, speed: 40, timestamp: new Date(Date.now() - 120000) },
          { latitude: baseLat, longitude: baseLng, speed: 42, timestamp: new Date() },
        ],
        lastSeen: new Date(),
      },
      {
        vehicleId: 'CAB-003',
        registrationNumber: 'DL-03-GH-4412',
        vehicleType: 'SUV',
        model: 'Innova Crysta MPV',
        route: 'Industrial Tech Park Loop',
        driverName: 'Vikram Singh',
        driverPhone: '+91 98111 22334',
        sosDeviceId: 'SOS-003',
        sosDevice: createdDevices[2]._id,
        gatewayId: 'GW-003',
        gateway: createdGateways[2]._id,
        status: 'ONLINE',
        currentLocation: {
          latitude: baseLat - 0.007,
          longitude: baseLng - 0.005,
          speed: 0,
          heading: 'S 180°',
          satellites: 9,
          hdop: 1.2,
          corridor: 'Tech Park Gate 2 Loading Zone',
          updatedAt: new Date(),
        },
        breadcrumbs: [
          { latitude: baseLat - 0.007, longitude: baseLng - 0.005, speed: 0, timestamp: new Date() },
        ],
        lastSeen: new Date(),
      },
      {
        vehicleId: 'CAB-004',
        registrationNumber: 'DL-04-TR-3120',
        vehicleType: 'Hatchback',
        model: 'Tigor EV Fleet',
        route: 'Suburban Line 9',
        driverName: 'Sunil Sharma',
        driverPhone: '+91 98444 55667',
        sosDeviceId: 'SOS-004',
        sosDevice: createdDevices[3]._id,
        gatewayId: 'GW-004',
        gateway: createdGateways[3]._id,
        status: 'OFFLINE',
        currentLocation: {
          latitude: baseLat + 0.015,
          longitude: baseLng + 0.012,
          speed: 0,
          heading: 'E 90°',
          satellites: 0,
          hdop: 9.9,
          corridor: 'Depot Substation Yard',
          updatedAt: new Date(Date.now() - 180000),
        },
        breadcrumbs: [],
        lastSeen: new Date(Date.now() - 180000),
      },
      {
        vehicleId: 'CAB-005',
        registrationNumber: 'DL-05-KL-7705',
        vehicleType: 'Sedan',
        model: 'Verito Commercial',
        route: 'Airport Highway Express',
        driverName: 'Deepak Rao',
        driverPhone: '+91 98999 88776',
        sosDeviceId: 'SOS-005',
        sosDevice: createdDevices[4]._id,
        gatewayId: 'GW-005',
        gateway: createdGateways[4]._id,
        status: 'ONLINE',
        currentLocation: {
          latitude: baseLat - 0.012,
          longitude: baseLng - 0.014,
          speed: 51,
          heading: 'SW 225°',
          satellites: 12,
          hdop: 0.95,
          corridor: 'South Aerodrome Highway Mile 4',
          updatedAt: new Date(),
        },
        breadcrumbs: [
          { latitude: baseLat - 0.008, longitude: baseLng - 0.010, speed: 48, timestamp: new Date(Date.now() - 300000) },
          { latitude: baseLat - 0.012, longitude: baseLng - 0.014, speed: 51, timestamp: new Date() },
        ],
        lastSeen: new Date(),
      },
    ];

    const createdVehicles = await Vehicle.insertMany(vehiclesData);

    // Update driver's assigned vehicle
    driver.assignedVehicle = createdVehicles[1]._id;
    await driver.save();

    console.log('[Seeder] Creating Active and Historical Emergencies...');
    // 1. Critical active SOS alert matching screenshot
    await Emergency.create({
      emergencyId: 'EMG-2026-8802',
      vehicleId: 'CAB-002',
      vehicleNumber: 'DL-02-XY-9002',
      vehicleModel: 'Camry Hybrid Unit #108',
      deviceId: 'SOS-002',
      gatewayId: 'GW-002',
      latitude: baseLat,
      longitude: baseLng,
      speed: 42,
      heading: 'NW 315°',
      corridor: 'Market & 4th St, SF Transit Sector',
      timestamp: new Date(Date.now() - 78000), // ~1 min 18s ago
      batteryLevel: 72,
      batteryVoltage: 3.88,
      tamperCircuit: 'NORMAL (Circuit Closed 2.1Ω)',
      emergencyType: 'SOS',
      priority: 'LEVEL_1_CRITICAL',
      source: 'ESP32_SOS_BUTTON',
      status: 'ACTIVE',
      timeline: [
        {
          time: new Date(Date.now() - 80000),
          event: 'Physical SOS Triggered by Occupant',
          actor: 'Occupant SOS Button (ESP32-C3)',
          notes: 'Hardware interrupt pin GPIO 9 triggered on Device SOS-002',
        },
        {
          time: new Date(Date.now() - 79000),
          event: 'Gateway Received SOS via 2.4GHz BLE & LoRa',
          actor: 'Vehicle Gateway GW-002',
          notes: 'Packet RSSI -68 dBm, Jitter 12ms',
        },
        {
          time: new Date(Date.now() - 78000),
          event: 'GNSS Coordinates Acquired and Ingested',
          actor: 'SIM7600 4G LTE Cat-M1 Modem',
          notes: 'Fix locked [22.8046, 86.2029], Speed 42 km/h, Heading NW 315°',
        },
        {
          time: new Date(Date.now() - 77000),
          event: 'Central Tactical Cockpit Broadcast Dispatched',
          actor: 'SafeRide Ingest Core',
          notes: 'Level 1 Critical Priority Banner Activated on all consoles',
        },
      ],
    });

    // 2. Tamper Alert
    await Emergency.create({
      emergencyId: 'EMG-2026-8803',
      vehicleId: 'CAB-003',
      vehicleNumber: 'DL-03-GH-4412',
      vehicleModel: 'Innova Crysta MPV',
      deviceId: 'SOS-003',
      gatewayId: 'GW-003',
      latitude: baseLat - 0.007,
      longitude: baseLng - 0.005,
      speed: 0,
      heading: 'S 180°',
      corridor: 'Tech Park Gate 2',
      timestamp: new Date(Date.now() - 360000), // 6 min ago
      batteryLevel: 54,
      batteryVoltage: 3.75,
      tamperCircuit: 'TAMPER_TRIGGERED (Loop 999Ω OPEN)',
      emergencyType: 'TAMPER',
      priority: 'WARNING',
      source: 'ENCLOSURE_MICROSWITCH',
      status: 'ACKNOWLEDGED',
      acknowledgedBy: operator._id,
      acknowledgedByName: operator.name,
      acknowledgedAt: new Date(Date.now() - 300000),
      timeline: [
        {
          time: new Date(Date.now() - 360000),
          event: 'Enclosure Switch Tripped (Tamper Alert)',
          actor: 'Tamper Loop Sensor',
          notes: 'Chassis opened while vehicle was stationary at Tech Park',
        },
        {
          time: new Date(Date.now() - 300000),
          event: 'Alert Acknowledged by Tactical Desk',
          actor: `${operator.name} (${operator.badgeNumber})`,
          notes: 'Driver contacted via phone; confirmed routine enclosure check',
        },
      ],
    });

    // 3. Resolved Emergency
    await Emergency.create({
      emergencyId: 'EMG-2026-8799',
      vehicleId: 'CAB-001',
      vehicleNumber: 'DL-01-AB-1081',
      vehicleModel: 'Swift Dzire Tour',
      deviceId: 'SOS-001',
      gatewayId: 'GW-001',
      latitude: baseLat + 0.004,
      longitude: baseLng - 0.007,
      speed: 0,
      heading: 'NE 45°',
      corridor: 'North Highway Exit 3',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      batteryLevel: 89,
      batteryVoltage: 3.98,
      tamperCircuit: 'NORMAL (Circuit Closed 2.1Ω)',
      emergencyType: 'SOS',
      priority: 'LEVEL_1_CRITICAL',
      source: 'ESP32_SOS_BUTTON',
      status: 'RESOLVED',
      acknowledgedBy: operator._id,
      acknowledgedByName: operator.name,
      acknowledgedAt: new Date(Date.now() - 7140000),
      respondingAt: new Date(Date.now() - 7000000),
      resolvedBy: superAdmin._id,
      resolvedByName: superAdmin.name,
      resolvedAt: new Date(Date.now() - 5400000),
      resolutionNotes: 'Medical emergency: passenger safely attended by highway paramedic unit.',
      timeline: [
        { time: new Date(Date.now() - 7200000), event: 'SOS Triggered by Driver', actor: 'Hardware Button' },
        { time: new Date(Date.now() - 7140000), event: 'Acknowledged by Sarah Jenkins', actor: 'Operator' },
        { time: new Date(Date.now() - 7000000), event: 'Highway Patrol En Route', actor: 'Field Dispatch' },
        { time: new Date(Date.now() - 5400000), event: 'Incident Resolved and Cleared', actor: 'Dr. A. Vance' },
      ],
    });

    console.log('[Seeder] Creating Notifications...');
    await Notification.create([
      {
        type: 'NEW_SOS',
        title: 'CRITICAL SOS ALERT: CAB-002',
        message: 'Physical SOS triggered by occupant on CAB-002 (SOS-002) at Market & 4th St',
        severity: 'CRITICAL',
        relatedEmergencyId: 'EMG-2026-8802',
        vehicleId: 'CAB-002',
        timestamp: new Date(Date.now() - 78000),
        read: false,
      },
      {
        type: 'TAMPER_ALERT',
        title: 'TAMPER WARNING: CAB-003',
        message: 'SOS-003 enclosure switch tripped (Chassis Open)',
        severity: 'WARNING',
        relatedEmergencyId: 'EMG-2026-8803',
        vehicleId: 'CAB-003',
        timestamp: new Date(Date.now() - 360000),
        read: false,
      },
      {
        type: 'DEVICE_OFFLINE',
        title: 'HEARTBEAT LOST: CAB-004',
        message: 'SOS-004 device heartbeat lost (>180s) on CAB-004',
        severity: 'WARNING',
        vehicleId: 'CAB-004',
        timestamp: new Date(Date.now() - 180000),
        read: false,
      },
      {
        type: 'LOW_BATTERY',
        title: 'LOW BATTERY ADVISORY: CAB-004',
        message: 'SOS-004 battery reached 31% (Lowest cell advisory)',
        severity: 'WARNING',
        vehicleId: 'CAB-004',
        timestamp: new Date(Date.now() - 240000),
        read: true,
      },
    ]);

    console.log('[Seeder] Creating Event Audit Stream Logs...');
    await AuditLog.create([
      {
        userName: 'Dr. A. Vance',
        userRole: 'SUPER_ADMIN',
        action: 'SYSTEM_BOOTSTRAP',
        category: 'CONFIG',
        target: 'Tactical Cockpit v2.4',
        details: 'Initial mission control parameters initialized and validated.',
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        userName: 'System Watchdog',
        userRole: 'SYSTEM',
        action: 'HEARTBEAT_TIMEOUT',
        category: 'DEVICE',
        target: 'SOS-004',
        details: 'Watchdog marked device SOS-004 OFFLINE after 180s silent interval.',
        timestamp: new Date(Date.now() - 180000),
      },
      {
        userName: 'Hardware Ingest',
        userRole: 'SYSTEM',
        action: 'TAMPER_TRIGGERED',
        category: 'EMERGENCY',
        target: 'CAB-003',
        details: 'Microswitch loop resistance jumped to 999Ω (Chassis Open).',
        timestamp: new Date(Date.now() - 360000),
      },
      {
        userName: 'Hardware Ingest',
        userRole: 'SYSTEM',
        action: 'SOS_TRIGGERED',
        category: 'EMERGENCY',
        target: 'CAB-002',
        details: 'Physical SOS interrupt triggered on GPIO 9. Priority Level 1 dispatched.',
        timestamp: new Date(Date.now() - 78000),
      },
    ]);

    console.log('\n======================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('------------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('1. Super Admin: admin@saferide.io / Password@123');
    console.log('2. Operator:    operator@saferide.io / Password@123');
    console.log('3. Driver:      driver@saferide.io / Password@123');
    console.log('======================================================\n');

    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error(`[Seeder] Error during database seeding: ${err.message}`);
    process.exit(1);
  }
};

seedDatabase();

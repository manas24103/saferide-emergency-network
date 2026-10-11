import SOSDevice from '../models/SOSDevice.js';
import Gateway from '../models/Gateway.js';
import Vehicle from '../models/Vehicle.js';
import Telemetry from '../models/Telemetry.js';
import Notification from '../models/Notification.js';
import { emitEvent } from '../sockets/socketManager.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Ingest periodic heartbeat from ESP32-C3 via Gateway
// @route   POST /api/telemetry/heartbeat
// @access  Public / Hardware Gateway
export const receiveHeartbeat = async (req, res, next) => {
  try {
    const {
      deviceId,
      gatewayId,
      vehicleId,
      batteryLevel = 88,
      batteryVoltage = 3.92,
      tamper = false,
      wirelessConnected = true,
      rssi = -68,
      jitterMs = 12,
      timestamp = new Date(),
    } = req.body;

    if (!deviceId || !gatewayId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId and gatewayId are required for heartbeat telemetry',
      });
    }

    // 1. Update SOS Device
    let device = await SOSDevice.findOne({ deviceId });
    if (!device) {
      device = new SOSDevice({
        deviceId,
        deviceSerialNumber: `SN-ESP32-${deviceId}`,
        assignedVehicleId: vehicleId || null,
      });
    }

    device.batteryPercentage = batteryLevel;
    device.batteryVoltage = batteryVoltage;
    device.tamperStatus = tamper ? 'TAMPER_TRIGGERED' : 'NORMAL';
    device.tamperCircuitResistance = tamper ? 999.0 : 2.1;
    device.wirelessStatus = wirelessConnected ? 'CONNECTED' : 'DISCONNECTED';
    device.rssi = rssi;
    device.heartbeatJitterMs = jitterMs;
    device.lastHeartbeat = new Date(timestamp);
    if (device.status === 'OFFLINE') {
      device.status = 'ONLINE';
    }

    // Append to heartbeat history (keep last 30 samples)
    device.heartbeatHistory.push({
      timestamp: new Date(timestamp),
      jitterMs,
      batteryPercentage: batteryLevel,
      batteryVoltage,
      rssi,
    });
    if (device.heartbeatHistory.length > 30) {
      device.heartbeatHistory.shift();
    }
    await device.save();

    // 2. Update Gateway
    let gateway = await Gateway.findOne({ gatewayId });
    if (!gateway) {
      gateway = new Gateway({
        gatewayId,
        gatewaySerialNumber: `GW-ESP32-${gatewayId}`,
        vehicleId: vehicleId || device.assignedVehicleId || null,
      });
    }
    gateway.lastHeartbeat = new Date(timestamp);
    gateway.status = 'ONLINE';
    await gateway.save();

    // 3. Update Vehicle if associated
    const vId = vehicleId || device.assignedVehicleId || gateway.vehicleId;
    if (vId) {
      await Vehicle.findOneAndUpdate(
        { vehicleId: vId },
        { lastSeen: new Date(timestamp), ...(device.status === 'OFFLINE' ? { status: 'ONLINE' } : {}) }
      );
    }

    // 4. Store Telemetry sample
    await Telemetry.create({
      vehicleId: vId || 'UNKNOWN',
      deviceId,
      gatewayId,
      batteryLevel,
      batteryVoltage,
      tamperStatus: device.tamperStatus,
      tamperCircuitResistance: device.tamperCircuitResistance,
      rssi,
      heartbeatJitterMs: jitterMs,
      timestamp: new Date(timestamp),
    });

    // 5. Broadcast real-time Socket.IO events
    emitEvent('device:heartbeat', {
      deviceId,
      gatewayId,
      vehicleId: vId,
      batteryPercentage: batteryLevel,
      batteryVoltage,
      tamperStatus: device.tamperStatus,
      wirelessStatus: device.wirelessStatus,
      rssi,
      jitterMs,
      timestamp,
    });

    emitEvent('gateway:status', {
      gatewayId,
      status: 'ONLINE',
      lastHeartbeat: timestamp,
    });

    return res.status(200).json({
      success: true,
      message: 'Telemetry heartbeat processed successfully',
      deviceState: {
        deviceId: device.deviceId,
        status: device.status,
        batteryPercentage: device.batteryPercentage,
        tamperStatus: device.tamperStatus,
        lastHeartbeat: device.lastHeartbeat,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update vehicle GPS location from Gateway GNSS
// @route   POST /api/telemetry/location
// @access  Public / Gateway / Simulator
export const updateLocation = async (req, res, next) => {
  try {
    const {
      vehicleId,
      latitude,
      longitude,
      speed = 0,
      heading = 'NW 315°',
      satellites = 14,
      hdop = 0.9,
      corridor,
    } = req.body;

    if (!vehicleId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'vehicleId, latitude, and longitude are required',
      });
    }

    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehicle ${vehicleId} not found`,
      });
    }

    vehicle.currentLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      speed: Number(speed),
      heading: heading || vehicle.currentLocation.heading,
      hdop: Number(hdop),
      satellites: Number(satellites),
      corridor: corridor || vehicle.currentLocation.corridor,
      updatedAt: new Date(),
    };
    vehicle.lastSeen = new Date();

    vehicle.breadcrumbs.push({
      latitude: Number(latitude),
      longitude: Number(longitude),
      speed: Number(speed),
      timestamp: new Date(),
    });
    if (vehicle.breadcrumbs.length > 50) {
      vehicle.breadcrumbs.shift();
    }

    await vehicle.save();

    // Broadcast location update
    emitEvent('vehicle:location', {
      vehicleId,
      location: vehicle.currentLocation,
      status: vehicle.status,
    });

    return res.status(200).json({
      success: true,
      message: 'Location updated',
      location: vehicle.currentLocation,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update battery telemetry
// @route   POST /api/telemetry/battery
// @access  Public / Gateway / Simulator
export const updateBattery = async (req, res, next) => {
  try {
    const { deviceId, batteryPercentage, batteryVoltage } = req.body;

    if (!deviceId || batteryPercentage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'deviceId and batteryPercentage required',
      });
    }

    const device = await SOSDevice.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    device.batteryPercentage = Number(batteryPercentage);
    if (batteryVoltage !== undefined) {
      device.batteryVoltage = Number(batteryVoltage);
    }

    if (device.batteryPercentage < 20) {
      device.status = 'LOW_BATTERY';
      // Create warning notification
      await Notification.create({
        type: 'LOW_BATTERY',
        title: `Low Battery Advisory: ${deviceId}`,
        message: `Device ${deviceId} on vehicle ${device.assignedVehicleId || 'N/A'} is at ${device.batteryPercentage}% battery (${device.batteryVoltage}V)`,
        severity: 'WARNING',
        vehicleId: device.assignedVehicleId,
      });
    }
    await device.save();

    emitEvent('device:battery', {
      deviceId,
      batteryPercentage: device.batteryPercentage,
      batteryVoltage: device.batteryVoltage,
      status: device.status,
    });

    return res.status(200).json({
      success: true,
      device,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update tamper circuit telemetry
// @route   POST /api/telemetry/tamper
// @access  Public / Gateway / Simulator
export const updateTamper = async (req, res, next) => {
  try {
    const { deviceId, tamper, resistance } = req.body;

    if (!deviceId || tamper === undefined) {
      return res.status(400).json({
        success: false,
        message: 'deviceId and tamper state required',
      });
    }

    const device = await SOSDevice.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    device.tamperStatus = tamper ? 'TAMPER_TRIGGERED' : 'NORMAL';
    device.tamperCircuitResistance = resistance !== undefined ? resistance : (tamper ? 999.0 : 2.1);
    if (tamper) {
      device.status = 'TAMPERED';
      await Notification.create({
        type: 'TAMPER_ALERT',
        title: `TAMPER DETECTED: ${deviceId}`,
        message: `Tamper microswitch loop triggered on device ${deviceId} (Chassis open, loop resistance: ${device.tamperCircuitResistance}Ω)`,
        severity: 'CRITICAL',
        vehicleId: device.assignedVehicleId,
      });
    } else {
      if (device.status === 'TAMPERED') {
        device.status = 'ONLINE';
      }
    }
    await device.save();

    emitEvent('device:tamper', {
      deviceId,
      tamperStatus: device.tamperStatus,
      tamperCircuitResistance: device.tamperCircuitResistance,
      status: device.status,
    });

    return res.status(200).json({
      success: true,
      device,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Gateway Status (Cellular / GNSS)
// @route   POST /api/telemetry/gateway-status
// @access  Public / Gateway / Simulator
export const updateGatewayStatus = async (req, res, next) => {
  try {
    const {
      gatewayId,
      cellularStatus = 'CONNECTED',
      signalStrength = 'GOOD',
      rssi = -68,
      gnssStatus = 'LOCKED_3D',
      satellites = 14,
      hdop = 0.9,
      status = 'ONLINE',
    } = req.body;

    if (!gatewayId) {
      return res.status(400).json({ success: false, message: 'gatewayId required' });
    }

    const gateway = await Gateway.findOneAndUpdate(
      { gatewayId },
      {
        cellularStatus,
        signalStrength,
        rssi,
        gnssStatus,
        satellitesVisible: satellites,
        hdop,
        status,
        lastHeartbeat: new Date(),
      },
      { new: true, upsert: true }
    );

    emitEvent('gateway:status', gateway);

    return res.status(200).json({
      success: true,
      gateway,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get telemetry stream logs
// @route   GET /api/telemetry/recent
// @access  Private
export const getRecentTelemetry = async (req, res, next) => {
  try {
    const { vehicleId, limit = 20 } = req.query;
    const filter = vehicleId ? { vehicleId } : {};

    const telemetry = await Telemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      telemetry,
    });
  } catch (err) {
    next(err);
  }
};

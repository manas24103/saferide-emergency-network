import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import SOSDevice from '../models/SOSDevice.js';
import Gateway from '../models/Gateway.js';
import Emergency from '../models/Emergency.js';
import SystemSetting from '../models/SystemSetting.js';
import { getIO } from '../sockets/socketManager.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Health check endpoint
// @route   GET /api/health
// @access  Public
export const getHealth = async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  const io = getIO();
  const socketConnected = !!io;

  const [activeEmergencies, onlineVehicles, onlineDevices, onlineGateways] = await Promise.all([
    Emergency.countDocuments({ status: { $in: ['ACTIVE', 'ACKNOWLEDGED', 'RESPONDING'] } }),
    Vehicle.countDocuments({ status: 'ONLINE' }),
    SOSDevice.countDocuments({ status: 'ONLINE' }),
    Gateway.countDocuments({ status: 'ONLINE' }),
  ]);

  return res.status(200).json({
    status: 'ONLINE',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      backend: 'ONLINE',
      database: dbState,
      socketServer: socketConnected ? 'CONNECTED' : 'DISCONNECTED',
    },
    metrics: {
      activeEmergencies,
      onlineVehicles,
      onlineDevices,
      onlineGateways,
    },
  });
};

// @desc    Dashboard Metrics & KPI Overview
// @route   GET /api/system/stats
// @access  Private
export const getSystemStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeEmergencies,
      emergenciesToday,
      totalVehicles,
      onlineVehicles,
      offlineVehicles,
      emergencyVehicles,
      totalDevices,
      onlineDevices,
      offlineDevices,
      lowBatteryDevices,
      tamperAlerts,
      totalGateways,
      onlineGateways,
      recentEmergencies,
    ] = await Promise.all([
      Emergency.countDocuments({ status: { $in: ['ACTIVE', 'ACKNOWLEDGED', 'RESPONDING'] } }),
      Emergency.countDocuments({ timestamp: { $gte: today } }),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'ONLINE' }),
      Vehicle.countDocuments({ status: 'OFFLINE' }),
      Vehicle.countDocuments({ status: 'EMERGENCY' }),
      SOSDevice.countDocuments(),
      SOSDevice.countDocuments({ status: 'ONLINE' }),
      SOSDevice.countDocuments({ status: 'OFFLINE' }),
      SOSDevice.countDocuments({ batteryPercentage: { $lt: 25 } }),
      SOSDevice.countDocuments({ tamperStatus: 'TAMPER_TRIGGERED' }),
      Gateway.countDocuments(),
      Gateway.countDocuments({ status: 'ONLINE' }),
      Emergency.find()
        .sort({ timestamp: -1 })
        .limit(5)
        .populate('acknowledgedBy', 'name')
        .populate('resolvedBy', 'name'),
    ]);

    // Average fleet battery
    const devices = await SOSDevice.find().select('batteryPercentage');
    const avgBattery = devices.length > 0
      ? (devices.reduce((acc, d) => acc + (d.batteryPercentage || 0), 0) / devices.length).toFixed(1)
      : 85.0;

    return res.status(200).json({
      success: true,
      stats: {
        activeEmergencies,
        emergenciesToday,
        vehicles: {
          total: totalVehicles,
          online: onlineVehicles,
          offline: offlineVehicles,
          emergency: emergencyVehicles,
          availPercentage: totalVehicles > 0 ? Math.round((onlineVehicles / totalVehicles) * 100) : 100,
        },
        devices: {
          total: totalDevices,
          online: onlineDevices,
          offline: offlineDevices,
          lowBattery: lowBatteryDevices,
          tamperAlerts,
          avgBatteryPercentage: Number(avgBattery),
        },
        gateways: {
          total: totalGateways,
          online: onlineGateways,
          statusText: `${onlineGateways}/${totalGateways} Active`,
        },
        recentEmergencies,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get system settings
// @route   GET /api/system/settings
// @access  Private
export const getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

// @desc    Update system settings
// @route   PUT /api/system/settings
// @access  Private (SUPER_ADMIN)
export const updateSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'SYSTEM_SETTINGS_UPDATED',
      category: 'CONFIG',
      target: 'System Settings',
      details: 'Super admin modified system watchdog parameters',
    });

    return res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      settings,
    });
  } catch (err) {
    next(err);
  }
};

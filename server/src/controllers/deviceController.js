import SOSDevice from '../models/SOSDevice.js';
import Vehicle from '../models/Vehicle.js';
import { emitEvent } from '../sockets/socketManager.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all SOS devices
// @route   GET /api/devices
// @access  Private
export const getDevices = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { deviceId: { $regex: search, $options: 'i' } },
        { deviceSerialNumber: { $regex: search, $options: 'i' } },
        { assignedVehicleId: { $regex: search, $options: 'i' } },
      ];
    }

    const devices = await SOSDevice.find(query).sort({ deviceId: 1 });

    return res.status(200).json({
      success: true,
      count: devices.length,
      devices,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single SOS device by ID
// @route   GET /api/devices/:id
// @access  Private
export const getDeviceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    const device = isObjectId
      ? await SOSDevice.findById(id).populate('assignedVehicle')
      : await SOSDevice.findOne({ deviceId: id.toUpperCase() }).populate('assignedVehicle');

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    return res.status(200).json({
      success: true,
      device,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new SOS device
// @route   POST /api/devices
// @access  Private (SUPER_ADMIN)
export const createDevice = async (req, res, next) => {
  try {
    const {
      deviceId,
      deviceSerialNumber,
      microcontroller,
      firmwareVersion,
      assignedVehicleId,
      batteryPercentage = 95,
      batteryVoltage = 3.98,
    } = req.body;

    const existing = await SOSDevice.findOne({ deviceId: deviceId.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Device ${deviceId} already exists` });
    }

    const device = await SOSDevice.create({
      deviceId: deviceId.toUpperCase(),
      deviceSerialNumber: deviceSerialNumber || `SN-ESP32-${deviceId.toUpperCase()}`,
      microcontroller: microcontroller || 'ESP32-C3 RISC-V 160MHz',
      firmwareVersion: firmwareVersion || 'v1.4.2-PROD',
      assignedVehicleId: assignedVehicleId ? assignedVehicleId.toUpperCase() : null,
      batteryPercentage,
      batteryVoltage,
      status: 'ONLINE',
      tamperStatus: 'NORMAL',
      tamperCircuitResistance: 2.1,
      wirelessStatus: 'CONNECTED',
      rssi: -65,
      heartbeatJitterMs: 10,
      lastHeartbeat: new Date(),
    });

    if (assignedVehicleId) {
      await Vehicle.findOneAndUpdate(
        { vehicleId: assignedVehicleId.toUpperCase() },
        { sosDeviceId: device.deviceId, sosDevice: device._id }
      );
    }

    emitEvent('device:created', device);

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DEVICE_PROVISIONED',
      category: 'DEVICE',
      target: device.deviceId,
      details: `SOS device ${device.deviceId} provisioned`,
    });

    return res.status(201).json({
      success: true,
      message: 'SOS device registered successfully',
      device,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update SOS device
// @route   PUT /api/devices/:id
// @access  Private (SUPER_ADMIN)
export const updateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    const device = isObjectId
      ? await SOSDevice.findById(id)
      : await SOSDevice.findOne({ deviceId: id.toUpperCase() });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    const updatable = [
      'firmwareVersion',
      'assignedVehicleId',
      'status',
      'tamperStatus',
      'batteryPercentage',
      'batteryVoltage',
      'wirelessStatus',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        device[field] = req.body[field];
      }
    });

    await device.save();

    emitEvent('device:status', device);

    return res.status(200).json({
      success: true,
      message: 'Device updated successfully',
      device,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete SOS device
// @route   DELETE /api/devices/:id
// @access  Private (SUPER_ADMIN)
export const deleteDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    const device = isObjectId
      ? await SOSDevice.findById(id)
      : await SOSDevice.findOne({ deviceId: id.toUpperCase() });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    await device.deleteOne();

    return res.status(200).json({
      success: true,
      message: `Device ${device.deviceId} removed`,
    });
  } catch (err) {
    next(err);
  }
};

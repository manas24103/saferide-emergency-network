import Gateway from '../models/Gateway.js';
import Vehicle from '../models/Vehicle.js';
import { emitEvent } from '../sockets/socketManager.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all gateways
// @route   GET /api/gateways
// @access  Private
export const getGateways = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { gatewayId: { $regex: search, $options: 'i' } },
        { gatewaySerialNumber: { $regex: search, $options: 'i' } },
        { vehicleId: { $regex: search, $options: 'i' } },
      ];
    }

    const gateways = await Gateway.find(query).sort({ gatewayId: 1 });

    return res.status(200).json({
      success: true,
      count: gateways.length,
      gateways,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single gateway
// @route   GET /api/gateways/:id
// @access  Private
export const getGatewayById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    const gateway = isObjectId
      ? await Gateway.findById(id).populate('vehicle')
      : await Gateway.findOne({ gatewayId: id.toUpperCase() }).populate('vehicle');

    if (!gateway) {
      return res.status(404).json({ success: false, message: 'Gateway not found' });
    }

    return res.status(200).json({
      success: true,
      gateway,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new gateway
// @route   POST /api/gateways
// @access  Private (SUPER_ADMIN)
export const createGateway = async (req, res, next) => {
  try {
    const {
      gatewayId,
      gatewaySerialNumber,
      vehicleId,
      cellularModem,
      carrier,
      firmwareVersion,
    } = req.body;

    const existing = await Gateway.findOne({ gatewayId: gatewayId.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Gateway ${gatewayId} already exists` });
    }

    const gateway = await Gateway.create({
      gatewayId: gatewayId.toUpperCase(),
      gatewaySerialNumber: gatewaySerialNumber || `GW-ESP32-${gatewayId.toUpperCase()}`,
      vehicleId: vehicleId ? vehicleId.toUpperCase() : null,
      cellularModem: cellularModem || 'SIM7600G-H / LTE Cat-M1 (Band 4)',
      carrier: carrier || 'Airtel IoT / FirstNet Band 14',
      firmwareVersion: firmwareVersion || 'v2.1.0-GATEWAY-RTOS',
      status: 'ONLINE',
      cellularStatus: 'CONNECTED',
      signalStrength: 'GOOD',
      gnssStatus: 'LOCKED_3D',
      satellitesVisible: 14,
      hdop: 0.9,
      lastHeartbeat: new Date(),
    });

    if (vehicleId) {
      await Vehicle.findOneAndUpdate(
        { vehicleId: vehicleId.toUpperCase() },
        { gatewayId: gateway.gatewayId, gateway: gateway._id }
      );
    }

    emitEvent('gateway:created', gateway);

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'GATEWAY_PROVISIONED',
      category: 'GATEWAY',
      target: gateway.gatewayId,
      details: `Gateway ${gateway.gatewayId} provisioned`,
    });

    return res.status(201).json({
      success: true,
      message: 'Gateway registered successfully',
      gateway,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update gateway
// @route   PUT /api/gateways/:id
// @access  Private (SUPER_ADMIN)
export const updateGateway = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    const gateway = isObjectId
      ? await Gateway.findById(id)
      : await Gateway.findOne({ gatewayId: id.toUpperCase() });

    if (!gateway) {
      return res.status(404).json({ success: false, message: 'Gateway not found' });
    }

    const updatable = [
      'vehicleId',
      'cellularStatus',
      'cellularModem',
      'carrier',
      'signalStrength',
      'gnssStatus',
      'satellitesVisible',
      'hdop',
      'status',
      'firmwareVersion',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        gateway[field] = req.body[field];
      }
    });

    await gateway.save();

    emitEvent('gateway:status', gateway);

    return res.status(200).json({
      success: true,
      message: 'Gateway updated successfully',
      gateway,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete gateway
// @route   DELETE /api/gateways/:id
// @access  Private (SUPER_ADMIN)
export const deleteGateway = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    const gateway = isObjectId
      ? await Gateway.findById(id)
      : await Gateway.findOne({ gatewayId: id.toUpperCase() });

    if (!gateway) {
      return res.status(404).json({ success: false, message: 'Gateway not found' });
    }

    await gateway.deleteOne();

    return res.status(200).json({
      success: true,
      message: `Gateway ${gateway.gatewayId} deleted`,
    });
  } catch (err) {
    next(err);
  }
};

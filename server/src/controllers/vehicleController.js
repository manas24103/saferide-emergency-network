import Vehicle from '../models/Vehicle.js';
import SOSDevice from '../models/SOSDevice.js';
import Gateway from '../models/Gateway.js';
import Emergency from '../models/Emergency.js';
import { emitEvent } from '../sockets/socketManager.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
export const getVehicles = async (req, res, next) => {
  try {
    const { status, type, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (type && type !== 'ALL') {
      query.vehicleType = type;
    }
    if (search) {
      query.$or = [
        { vehicleId: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } },
      ];
    }

    const vehicles = await Vehicle.find(query).sort({ vehicleId: 1 });

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private
export const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    const vehicle = isObjectId
      ? await Vehicle.findById(id).populate('driver', 'name email phone badgeNumber')
      : await Vehicle.findOne({ vehicleId: id.toUpperCase() }).populate('driver', 'name email phone badgeNumber');

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Also fetch associated hardware devices and active emergencies
    const sosDevice = await SOSDevice.findOne({ deviceId: vehicle.sosDeviceId });
    const gateway = await Gateway.findOne({ gatewayId: vehicle.gatewayId });
    const activeEmergencies = await Emergency.find({
      vehicleId: vehicle.vehicleId,
      status: { $in: ['ACTIVE', 'ACKNOWLEDGED', 'RESPONDING'] },
    });

    return res.status(200).json({
      success: true,
      vehicle,
      sosDevice,
      gateway,
      activeEmergencies,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new vehicle
// @route   POST /api/vehicles
// @access  Private (SUPER_ADMIN)
export const createVehicle = async (req, res, next) => {
  try {
    const {
      vehicleId,
      registrationNumber,
      vehicleType,
      model,
      route,
      driverName,
      driverPhone,
      sosDeviceId,
      gatewayId,
      latitude = 22.8046,
      longitude = 86.2029,
    } = req.body;

    const existing = await Vehicle.findOne({ vehicleId: vehicleId.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Vehicle ${vehicleId} already exists` });
    }

    const vehicle = await Vehicle.create({
      vehicleId: vehicleId.toUpperCase(),
      registrationNumber: registrationNumber.toUpperCase(),
      vehicleType: vehicleType || 'Sedan',
      model: model || 'Commercial Cab Unit',
      route: route || 'Transit Sector Zone',
      driverName: driverName || 'Designated Driver',
      driverPhone: driverPhone || '+91 98765 00000',
      sosDeviceId: sosDeviceId.toUpperCase(),
      gatewayId: gatewayId.toUpperCase(),
      status: 'ONLINE',
      currentLocation: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed: 0,
        heading: 'N 0°',
        satellites: 12,
        hdop: 1.0,
      },
      breadcrumbs: [
        {
          latitude: Number(latitude),
          longitude: Number(longitude),
          speed: 0,
          timestamp: new Date(),
        },
      ],
    });

    // Link device and gateway
    await SOSDevice.findOneAndUpdate(
      { deviceId: sosDeviceId.toUpperCase() },
      { assignedVehicleId: vehicle.vehicleId, assignedVehicle: vehicle._id }
    );
    await Gateway.findOneAndUpdate(
      { gatewayId: gatewayId.toUpperCase() },
      { vehicleId: vehicle.vehicleId, vehicle: vehicle._id }
    );

    emitEvent('vehicle:created', vehicle);

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'VEHICLE_CREATED',
      category: 'VEHICLE',
      target: vehicle.vehicleId,
      details: `Created vehicle ${vehicle.vehicleId} [${vehicle.registrationNumber}]`,
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (SUPER_ADMIN)
export const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    const vehicle = isObjectId
      ? await Vehicle.findById(id)
      : await Vehicle.findOne({ vehicleId: id.toUpperCase() });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const updatable = [
      'registrationNumber',
      'vehicleType',
      'model',
      'route',
      'driverName',
      'driverPhone',
      'status',
      'sosDeviceId',
      'gatewayId',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        vehicle[field] = req.body[field];
      }
    });

    await vehicle.save();

    emitEvent('vehicle:updated', vehicle);

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'VEHICLE_UPDATED',
      category: 'VEHICLE',
      target: vehicle.vehicleId,
      details: `Vehicle ${vehicle.vehicleId} updated`,
    });

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (SUPER_ADMIN)
export const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    const vehicle = isObjectId
      ? await Vehicle.findById(id)
      : await Vehicle.findOne({ vehicleId: id.toUpperCase() });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    await vehicle.deleteOne();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'VEHICLE_DELETED',
      category: 'VEHICLE',
      target: vehicle.vehicleId,
      details: `Vehicle ${vehicle.vehicleId} removed from system`,
    });

    return res.status(200).json({
      success: true,
      message: `Vehicle ${vehicle.vehicleId} deleted`,
    });
  } catch (err) {
    next(err);
  }
};

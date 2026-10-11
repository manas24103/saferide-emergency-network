import Emergency from '../models/Emergency.js';
import Vehicle from '../models/Vehicle.js';
import SOSDevice from '../models/SOSDevice.js';
import Notification from '../models/Notification.js';
import { emitEvent } from '../sockets/socketManager.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Create new Emergency (Hardware ESP32 Gateway or Simulator)
// @route   POST /api/emergencies
// @access  Public / Gateway Authenticated / Simulator
export const createEmergency = async (req, res, next) => {
  try {
    const {
      deviceId,
      gatewayId,
      vehicleId,
      type = 'SOS',
      priority = 'LEVEL_1_CRITICAL',
      latitude,
      longitude,
      speed = 0,
      heading = 'NW 315°',
      corridor,
      batteryLevel = 75,
      batteryVoltage = 3.88,
      tamperCircuit = 'NORMAL (Circuit Closed 2.1Ω)',
      source = 'ESP32_SOS_BUTTON',
      timestamp = new Date(),
    } = req.body;

    if (!deviceId || !gatewayId || !vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId, gatewayId, and vehicleId are required',
      });
    }

    // Lookup vehicle to get registration number and corridor if available
    const vehicle = await Vehicle.findOne({ vehicleId });
    const lat = latitude !== undefined ? Number(latitude) : (vehicle?.currentLocation?.latitude || 22.8046);
    const lng = longitude !== undefined ? Number(longitude) : (vehicle?.currentLocation?.longitude || 86.2029);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const emergencyId = `EMG-${new Date().getFullYear()}-${randomSuffix}`;

    const emergency = await Emergency.create({
      emergencyId,
      vehicleId,
      vehicleNumber: vehicle ? vehicle.registrationNumber : `CAB-${vehicleId}`,
      vehicleModel: vehicle ? `${vehicle.model} (Unit #${vehicle.vehicleId})` : 'Commercial Fleet Cab',
      deviceId,
      gatewayId,
      latitude: lat,
      longitude: lng,
      speed: speed || (vehicle?.currentLocation?.speed || 0),
      heading: heading || (vehicle?.currentLocation?.heading || 'NW 315°'),
      corridor: corridor || vehicle?.currentLocation?.corridor || 'Downtown Core Transit Sector',
      timestamp: new Date(timestamp),
      batteryLevel,
      batteryVoltage,
      tamperCircuit,
      emergencyType: type,
      priority,
      source,
      status: 'ACTIVE',
      timeline: [
        {
          time: new Date(timestamp),
          event: `${type} Event Triggered via ${source}`,
          actor: 'ESP32-C3 Hardware',
          notes: `Signal received from Device ${deviceId} via Gateway ${gatewayId}`,
        },
        {
          time: new Date(),
          event: 'Incident Ingested into Central Emergency Network',
          actor: 'Mission Control Ingest Engine',
          notes: `GPS fix locked: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
        },
      ],
    });

    // Update Vehicle state to EMERGENCY
    if (vehicle) {
      vehicle.status = 'EMERGENCY';
      vehicle.currentLocation.latitude = lat;
      vehicle.currentLocation.longitude = lng;
      vehicle.currentLocation.updatedAt = new Date();
      vehicle.lastSeen = new Date();
      vehicle.breadcrumbs.push({
        latitude: lat,
        longitude: lng,
        speed: speed || 0,
        timestamp: new Date(),
      });
      // Keep last 50 breadcrumbs
      if (vehicle.breadcrumbs.length > 50) {
        vehicle.breadcrumbs.shift();
      }
      await vehicle.save();
    }

    // Update SOS Device state to EMERGENCY
    await SOSDevice.findOneAndUpdate(
      { deviceId },
      {
        status: type === 'TAMPER' ? 'TAMPERED' : 'EMERGENCY',
        batteryPercentage: batteryLevel,
        batteryVoltage: batteryVoltage,
        lastHeartbeat: new Date(),
      }
    );

    // Create Notification for Control Room Operators
    const notification = await Notification.create({
      type: type === 'TAMPER' ? 'TAMPER_ALERT' : 'NEW_SOS',
      title: `CRITICAL ALERT: ${type} on ${vehicleId}`,
      message: `${type} triggered on vehicle ${vehicleId} (Device ${deviceId}) at coords [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
      severity: 'CRITICAL',
      relatedEmergencyId: emergencyId,
      vehicleId,
    });

    // Broadcast Socket.IO Events in real-time
    emitEvent('emergency:new', emergency);
    emitEvent('notification:new', notification);
    emitEvent('vehicle:status', {
      vehicleId,
      status: 'EMERGENCY',
      location: { latitude: lat, longitude: lng },
    });

    // Log Audit Entry
    await logAudit({
      userId: req.user ? req.user._id : null,
      userName: req.user ? req.user.name : 'ESP32 Gateway Ingest',
      userRole: req.user ? req.user.role : 'HARDWARE_GATEWAY',
      action: 'EMERGENCY_TRIGGERED',
      category: 'EMERGENCY',
      target: emergencyId,
      details: `${type} alert received for Vehicle ${vehicleId} from Gateway ${gatewayId}`,
      metadata: { emergencyId, vehicleId, deviceId, latitude: lat, longitude: lng },
    });

    return res.status(201).json({
      success: true,
      message: 'Emergency event recorded and dispatched to all operators',
      emergencyId: emergency.emergencyId,
      emergency,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all emergencies (with filtering and pagination)
// @route   GET /api/emergencies
// @access  Private
export const getEmergencies = async (req, res, next) => {
  try {
    const { status, vehicleId, deviceId, type, startDate, endDate, priority, limit = 50 } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (vehicleId) {
      query.vehicleId = vehicleId;
    }
    if (deviceId) {
      query.deviceId = deviceId;
    }
    if (type && type !== 'ALL') {
      query.emergencyType = type;
    }
    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const emergencies = await Emergency.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .populate('acknowledgedBy', 'name badgeNumber role')
      .populate('resolvedBy', 'name badgeNumber role');

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      emergencies,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active/pending emergencies
// @route   GET /api/emergencies/active
// @access  Private
export const getActiveEmergencies = async (req, res, next) => {
  try {
    const activeEmergencies = await Emergency.find({
      status: { $in: ['ACTIVE', 'ACKNOWLEDGED', 'RESPONDING'] },
    })
      .sort({ timestamp: -1 })
      .populate('acknowledgedBy', 'name badgeNumber role')
      .populate('resolvedBy', 'name badgeNumber role');

    return res.status(200).json({
      success: true,
      count: activeEmergencies.length,
      emergencies: activeEmergencies,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single emergency by ID or emergencyId
// @route   GET /api/emergencies/:id
// @access  Private
export const getEmergencyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

    const emergency = isObjectId
      ? await Emergency.findById(id)
          .populate('acknowledgedBy', 'name badgeNumber role')
          .populate('resolvedBy', 'name badgeNumber role')
      : await Emergency.findOne({ emergencyId: id })
          .populate('acknowledgedBy', 'name badgeNumber role')
          .populate('resolvedBy', 'name badgeNumber role');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: `Emergency not found with ID ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      emergency,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Acknowledge emergency
// @route   PUT /api/emergencies/:id/acknowledge
// @access  Private (Control Room Operator, Super Admin)
export const acknowledgeEmergency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const emergency = isObjectId
      ? await Emergency.findById(id)
      : await Emergency.findOne({ emergencyId: id });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency record not found',
      });
    }

    if (emergency.status === 'RESOLVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot acknowledge an already resolved emergency',
      });
    }

    emergency.status = 'ACKNOWLEDGED';
    emergency.acknowledgedBy = req.user._id;
    emergency.acknowledgedByName = req.user.name;
    emergency.acknowledgedAt = new Date();

    emergency.timeline.push({
      time: new Date(),
      event: 'Incident Acknowledged by Control Room Operator',
      actor: `${req.user.name} (${req.user.badgeNumber})`,
      notes: notes || 'Operator acknowledged alert and dispatched rapid field assessment unit.',
    });

    await emergency.save();

    // Create Notification
    const notification = await Notification.create({
      type: 'EMERGENCY_ACKNOWLEDGED',
      title: `Emergency Acknowledged: ${emergency.vehicleId}`,
      message: `Operator ${req.user.name} acknowledged emergency ${emergency.emergencyId}`,
      severity: 'INFO',
      relatedEmergencyId: emergency.emergencyId,
      vehicleId: emergency.vehicleId,
    });

    emitEvent('emergency:updated', emergency);
    emitEvent('notification:new', notification);

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'EMERGENCY_ACKNOWLEDGED',
      category: 'EMERGENCY',
      target: emergency.emergencyId,
      details: `Operator acknowledged emergency for Vehicle ${emergency.vehicleId}`,
      metadata: { emergencyId: emergency.emergencyId, notes },
    });

    return res.status(200).json({
      success: true,
      message: 'Emergency acknowledged successfully',
      emergency,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark emergency as responding (Field units en route)
// @route   PUT /api/emergencies/:id/respond
// @access  Private
export const markResponding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { unitId = 'SF-PATROL-04', notes } = req.body;

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const emergency = isObjectId
      ? await Emergency.findById(id)
      : await Emergency.findOne({ emergencyId: id });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency record not found',
      });
    }

    emergency.status = 'RESPONDING';
    emergency.respondingAt = new Date();

    emergency.timeline.push({
      time: new Date(),
      event: `Field Response Unit Dispatched [${unitId}]`,
      actor: `${req.user.name} (${req.user.badgeNumber})`,
      notes: notes || `Field tactical team ${unitId} en-route to coords [${emergency.latitude}, ${emergency.longitude}]`,
    });

    await emergency.save();

    emitEvent('emergency:updated', emergency);

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'EMERGENCY_RESPONDING',
      category: 'EMERGENCY',
      target: emergency.emergencyId,
      details: `Field unit ${unitId} responding to ${emergency.vehicleId}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Field response initiated',
      emergency,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Resolve emergency
// @route   PUT /api/emergencies/:id/resolve
// @access  Private (Control Room Operator, Super Admin)
export const resolveEmergency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionNotes = 'Incident resolved on-site by law enforcement / field team. Occupant safe.' } = req.body;

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const emergency = isObjectId
      ? await Emergency.findById(id)
      : await Emergency.findOne({ emergencyId: id });

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency record not found',
      });
    }

    emergency.status = 'RESOLVED';
    emergency.resolvedBy = req.user._id;
    emergency.resolvedByName = req.user.name;
    emergency.resolvedAt = new Date();
    emergency.resolutionNotes = resolutionNotes;

    emergency.timeline.push({
      time: new Date(),
      event: 'Incident Formally Resolved and Closed',
      actor: `${req.user.name} (${req.user.badgeNumber})`,
      notes: resolutionNotes,
    });

    await emergency.save();

    // Restore Vehicle status to ONLINE if no other active emergencies exist
    const otherActive = await Emergency.find({
      vehicleId: emergency.vehicleId,
      status: { $in: ['ACTIVE', 'ACKNOWLEDGED', 'RESPONDING'] },
    });

    if (otherActive.length === 0) {
      await Vehicle.findOneAndUpdate(
        { vehicleId: emergency.vehicleId },
        { status: 'ONLINE' }
      );
      await SOSDevice.findOneAndUpdate(
        { deviceId: emergency.deviceId },
        { status: 'ONLINE', tamperStatus: 'NORMAL' }
      );

      emitEvent('vehicle:status', {
        vehicleId: emergency.vehicleId,
        status: 'ONLINE',
      });
    }

    // Notification
    const notification = await Notification.create({
      type: 'EMERGENCY_RESOLVED',
      title: `Emergency Resolved: ${emergency.vehicleId}`,
      message: `Emergency ${emergency.emergencyId} on vehicle ${emergency.vehicleId} resolved by ${req.user.name}`,
      severity: 'SUCCESS',
      relatedEmergencyId: emergency.emergencyId,
      vehicleId: emergency.vehicleId,
    });

    emitEvent('emergency:updated', emergency);
    emitEvent('notification:new', notification);

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'EMERGENCY_RESOLVED',
      category: 'EMERGENCY',
      target: emergency.emergencyId,
      details: `Emergency resolved: ${resolutionNotes}`,
      metadata: { emergencyId: emergency.emergencyId, resolutionNotes },
    });

    return res.status(200).json({
      success: true,
      message: 'Emergency resolved successfully and vehicle status cleared',
      emergency,
    });
  } catch (err) {
    next(err);
  }
};

import mongoose from 'mongoose';

const gatewaySchema = new mongoose.Schema(
  {
    gatewayId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    gatewaySerialNumber: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleId: {
      type: String,
      default: null,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    cellularStatus: {
      type: String,
      enum: ['CONNECTED', 'CONNECTING', 'NO_SERVICE'],
      default: 'CONNECTED',
    },
    cellularModem: {
      type: String,
      default: 'SIM7600G-H / LTE Cat-M1 (Band 4)',
    },
    carrier: {
      type: String,
      default: 'Airtel IoT / FirstNet Band 14',
    },
    signalStrength: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NONE'],
      default: 'GOOD',
    },
    rssi: {
      type: Number,
      default: -68, // dBm
    },
    gnssStatus: {
      type: String,
      enum: ['LOCKED_3D', 'LOCKED_2D', 'ACQUIRING', 'NO_FIX'],
      default: 'LOCKED_3D',
    },
    satellitesVisible: {
      type: Number,
      default: 14,
    },
    hdop: {
      type: Number,
      default: 0.9,
    },
    firmwareVersion: {
      type: String,
      default: 'v2.1.0-GATEWAY-RTOS',
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'DEGRADED'],
      default: 'ONLINE',
      index: true,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Gateway', gatewaySchema);

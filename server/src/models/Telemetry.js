import mongoose from 'mongoose';

const telemetrySchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    gatewayId: {
      type: String,
      required: true,
      index: true,
    },
    latitude: {
      type: Number,
      default: 22.8046,
    },
    longitude: {
      type: Number,
      default: 86.2029,
    },
    speed: {
      type: Number,
      default: 0,
    },
    heading: {
      type: String,
      default: 'NW 315°',
    },
    batteryLevel: {
      type: Number,
      default: 85,
    },
    batteryVoltage: {
      type: Number,
      default: 3.88,
    },
    tamperStatus: {
      type: String,
      default: 'NORMAL',
    },
    tamperCircuitResistance: {
      type: Number,
      default: 2.1,
    },
    rssi: {
      type: Number,
      default: -68,
    },
    heartbeatJitterMs: {
      type: Number,
      default: 12,
    },
    satellites: {
      type: Number,
      default: 14,
    },
    hdop: {
      type: Number,
      default: 0.9,
    },
    cellularModem: {
      type: String,
      default: 'SIM7600 LTE Cat-M1',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Telemetry', telemetrySchema);

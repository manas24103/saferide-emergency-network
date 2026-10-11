import mongoose from 'mongoose';

const sosDeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    deviceSerialNumber: {
      type: String,
      required: true,
      trim: true,
    },
    microcontroller: {
      type: String,
      default: 'ESP32-C3 RISC-V 160MHz',
    },
    firmwareVersion: {
      type: String,
      default: 'v1.4.2-PROD',
    },
    assignedVehicleId: {
      type: String,
      default: null,
      index: true,
    },
    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'EMERGENCY', 'TAMPERED', 'LOW_BATTERY'],
      default: 'ONLINE',
      index: true,
    },
    batteryPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 88,
    },
    batteryVoltage: {
      type: Number,
      default: 3.92, // Volts
    },
    batteryChemistry: {
      type: String,
      default: 'LiPo 1S 1200mAh',
    },
    tamperStatus: {
      type: String,
      enum: ['NORMAL', 'TAMPER_TRIGGERED'],
      default: 'NORMAL',
    },
    tamperCircuitResistance: {
      type: Number,
      default: 2.1, // Ohms (closed microswitch loop)
    },
    wirelessStatus: {
      type: String,
      enum: ['CONNECTED', 'DEGRADED', 'DISCONNECTED'],
      default: 'CONNECTED',
    },
    wirelessProtocol: {
      type: String,
      default: '2.4GHz BLE 5.0 / LoRa ESP-NOW',
    },
    rssi: {
      type: Number,
      default: -68, // dBm
    },
    heartbeatJitterMs: {
      type: Number,
      default: 12,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
      index: true,
    },
    heartbeatHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        jitterMs: Number,
        batteryPercentage: Number,
        batteryVoltage: Number,
        rssi: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('SOSDevice', sosDeviceSchema);

import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema(
  {
    emergencyId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    vehicleId: {
      type: String,
      required: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      default: '',
    },
    vehicleModel: {
      type: String,
      default: 'Camry Hybrid Unit #108',
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
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,
      default: 0,
    },
    heading: {
      type: String,
      default: 'NW 315°',
    },
    corridor: {
      type: String,
      default: 'Market & 4th St, Transit Sector',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    batteryLevel: {
      type: Number,
      default: 80,
    },
    batteryVoltage: {
      type: Number,
      default: 3.88,
    },
    tamperCircuit: {
      type: String,
      default: 'NORMAL (Circuit Closed 2.1Ω)',
    },
    emergencyType: {
      type: String,
      enum: ['SOS', 'TAMPER', 'LOW_BATTERY', 'DEVICE_OFFLINE', 'GATEWAY_OFFLINE'],
      default: 'SOS',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LEVEL_1_CRITICAL', 'LEVEL_2_HIGH', 'WARNING', 'ADVISORY'],
      default: 'LEVEL_1_CRITICAL',
    },
    source: {
      type: String,
      default: 'ESP32_SOS_BUTTON',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESPONDING', 'RESOLVED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acknowledgedByName: {
      type: String,
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    respondingAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedByName: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    timeline: [
      {
        time: {
          type: Date,
          default: Date.now,
        },
        event: {
          type: String,
          required: true,
        },
        actor: {
          type: String,
          default: 'System Core',
        },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Emergency', emergencySchema);

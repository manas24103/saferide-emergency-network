import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ['Sedan', 'Hatchback', 'SUV', 'City Bus', 'Van', 'Shuttle'],
      default: 'Sedan',
    },
    model: {
      type: String,
      default: 'Toyota Camry Hybrid',
    },
    route: {
      type: String,
      default: 'Central Transit Corridor',
    },
    driverName: {
      type: String,
      default: 'Assigned Driver',
    },
    driverPhone: {
      type: String,
      default: '+91 98765 43210',
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sosDeviceId: {
      type: String,
      required: true,
      index: true,
    },
    sosDevice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SOSDevice',
      default: null,
    },
    gatewayId: {
      type: String,
      required: true,
      index: true,
    },
    gateway: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gateway',
      default: null,
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'EMERGENCY', 'MAINTENANCE'],
      default: 'ONLINE',
      index: true,
    },
    currentLocation: {
      latitude: {
        type: Number,
        default: 22.8046, // Realistic coordinates (e.g. Jamshedpur / Urban Metro)
      },
      longitude: {
        type: Number,
        default: 86.2029,
      },
      speed: {
        type: Number,
        default: 32, // km/h
      },
      heading: {
        type: String,
        default: 'NW 315°',
      },
      hdop: {
        type: Number,
        default: 0.9,
      },
      satellites: {
        type: Number,
        default: 14,
      },
      corridor: {
        type: String,
        default: 'Market St & 4th Ave Sector',
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    breadcrumbs: [
      {
        latitude: Number,
        longitude: Number,
        speed: Number,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Vehicle', vehicleSchema);

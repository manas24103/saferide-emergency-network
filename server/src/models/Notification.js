import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'NEW_SOS',
        'TAMPER_ALERT',
        'LOW_BATTERY',
        'DEVICE_OFFLINE',
        'GATEWAY_OFFLINE',
        'EMERGENCY_ACKNOWLEDGED',
        'EMERGENCY_RESOLVED',
        'SYSTEM_ALERT',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'WARNING', 'INFO', 'SUCCESS'],
      default: 'INFO',
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedEmergencyId: {
      type: String,
      default: null,
    },
    vehicleId: {
      type: String,
      default: null,
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

export default mongoose.model('Notification', notificationSchema);

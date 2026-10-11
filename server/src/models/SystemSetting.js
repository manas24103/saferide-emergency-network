import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    heartbeatTimeoutSeconds: {
      type: Number,
      default: 60,
    },
    batteryLowThreshold: {
      type: Number,
      default: 25,
    },
    batteryCriticalThreshold: {
      type: Number,
      default: 15,
    },
    soundAlertsEnabled: {
      type: Boolean,
      default: true,
    },
    autoAcknowledgeAdvisory: {
      type: Boolean,
      default: false,
    },
    dispatchSector: {
      type: String,
      default: 'San Francisco Transit Sector - Zone Alpha',
    },
    telemetryStreamRateHz: {
      type: Number,
      default: 1,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('SystemSetting', systemSettingSchema);

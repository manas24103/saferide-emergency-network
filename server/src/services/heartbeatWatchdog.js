import SOSDevice from '../models/SOSDevice.js';
import Gateway from '../models/Gateway.js';
import Vehicle from '../models/Vehicle.js';
import Notification from '../models/Notification.js';
import SystemSetting from '../models/SystemSetting.js';
import { emitEvent } from '../sockets/socketManager.js';

let watchdogInterval = null;

export const startHeartbeatWatchdog = () => {
  if (watchdogInterval) clearInterval(watchdogInterval);

  console.log('[HeartbeatWatchdog] Initialized device watchdog monitoring (15s interval)');

  watchdogInterval = setInterval(async () => {
    try {
      const setting = await SystemSetting.findOne();
      const timeoutSeconds = setting?.heartbeatTimeoutSeconds || 60;
      const cutoffDate = new Date(Date.now() - timeoutSeconds * 1000);

      // Find active devices that have missed heartbeats
      const timedOutDevices = await SOSDevice.find({
        status: { $in: ['ONLINE', 'TAMPERED'] },
        lastHeartbeat: { $lt: cutoffDate },
      });

      for (const dev of timedOutDevices) {
        dev.status = 'OFFLINE';
        dev.wirelessStatus = 'DISCONNECTED';
        await dev.save();

        emitEvent('device:status', dev);

        // Mark associated vehicle as OFFLINE if not in emergency
        if (dev.assignedVehicleId) {
          const v = await Vehicle.findOne({ vehicleId: dev.assignedVehicleId });
          if (v && v.status !== 'EMERGENCY') {
            v.status = 'OFFLINE';
            await v.save();
            emitEvent('vehicle:status', {
              vehicleId: v.vehicleId,
              status: 'OFFLINE',
            });
          }
        }

        // Emit notification
        const notification = await Notification.create({
          type: 'DEVICE_OFFLINE',
          title: `DEVICE HEARTBEAT LOST: ${dev.deviceId}`,
          message: `Device ${dev.deviceId} missed heartbeat for >${timeoutSeconds}s (Vehicle: ${dev.assignedVehicleId || 'Unassigned'})`,
          severity: 'WARNING',
          vehicleId: dev.assignedVehicleId,
        });

        emitEvent('notification:new', notification);
        console.log(`[Watchdog] Device ${dev.deviceId} marked OFFLINE (heartbeat expired)`);
      }

      // Check gateways too
      const timedOutGateways = await Gateway.find({
        status: 'ONLINE',
        lastHeartbeat: { $lt: cutoffDate },
      });

      for (const gw of timedOutGateways) {
        gw.status = 'OFFLINE';
        gw.cellularStatus = 'NO_SERVICE';
        await gw.save();
        emitEvent('gateway:status', gw);
      }
    } catch (err) {
      console.error(`[HeartbeatWatchdog] Error during heartbeat sweep: ${err.message}`);
    }
  }, 15000);
};

export const stopHeartbeatWatchdog = () => {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
};

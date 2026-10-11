import AuditLog from '../models/AuditLog.js';
import { emitEvent } from '../sockets/socketManager.js';

export const logAudit = async ({
  userId = null,
  userName = 'System Core',
  userRole = 'SYSTEM',
  action,
  category = 'EMERGENCY',
  target = '',
  details = '',
  ipAddress = '127.0.0.1',
  metadata = {},
}) => {
  try {
    const entry = await AuditLog.create({
      userId,
      userName,
      userRole,
      action,
      category,
      target,
      details,
      ipAddress,
      metadata,
    });

    // Broadcast audit event to connected tactical cockpits
    emitEvent('audit:new', entry);
    return entry;
  } catch (err) {
    console.error(`[AuditLogger] Error writing audit log: ${err.message}`);
  }
};

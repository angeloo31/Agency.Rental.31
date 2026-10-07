import AuditLog from '../models/AuditLog.js';

export async function logAction({ req, userId, username, userRole, action, resource, details }) {
  try {
    const finalUserId = userId || req?.user?._id || null;
    const finalUsername = username || req?.user?.username || 'Guest/System';
    const finalUserRole = userRole || req?.user?.role || 'Guest';
    const ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '';

    await AuditLog.create({
      userId: finalUserId,
      username: finalUsername,
      userRole: finalUserRole,
      action,
      resource,
      details: typeof details === 'object' ? JSON.stringify(details) : (details || ''),
      ipAddress
    });
  } catch (err) {
    console.error('[AuditLog Error] Failed to record log:', err.message);
  }
}

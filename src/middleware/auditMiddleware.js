const AuditService = require('../services/AuditService');

const auditMiddleware = (req, res, next) => {
  const { method, path, user } = req;

  const event = {
    user: user ? user.username : 'anonymous',
    action: `${method} ${path}`,
    timestamp: new Date().toISOString(),
  };

  AuditService.logEvent(event);

  next();
};

module.exports = auditMiddleware;
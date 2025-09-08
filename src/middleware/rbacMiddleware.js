const SecurityService = require('../services/SecurityService');

const rbacMiddleware = (action) => {
  return (req, res, next) => {
    const { role } = req.user;

    if (!SecurityService.hasPermission(role, action)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};

module.exports = rbacMiddleware;
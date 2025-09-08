const roles = {
  admin: ['create', 'read', 'update', 'delete'],
  editor: ['create', 'read', 'update'],
  viewer: ['read'],
};

class SecurityService {
  static hasPermission(role, action) {
    return roles[role] && Array.isArray(roles[role]) && roles[role].includes(action);
  }
}

module.exports = SecurityService;
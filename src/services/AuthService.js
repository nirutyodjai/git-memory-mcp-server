const jwt = require('jsonwebtoken');

// In a real application, you would fetch users from a database
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'password', // In a real app, this would be a hashed password
    role: 'admin',
  },
  {
    id: 2,
    username: 'editor',
    password: 'password',
    role: 'editor',
  },
  {
    id: 3,
    username: 'viewer',
    password: 'password',
    role: 'viewer',
  },
];

class AuthService {
  static async login(username, password) {
    const user = users.find((u) => u.username === username && u.password === password);

    if (!user) {
      return null;
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      'your-jwt-secret', // Use an environment variable for the secret in a real app
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      'your-jwt-secret',
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken, user };
  }

  static async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, 'your-jwt-secret');
      const user = users.find((u) => u.id === decoded.id);

      if (!user) {
        return null;
      }

      const newAccessToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        'your-jwt-secret',
        { expiresIn: '1h' }
      );

      return newAccessToken;
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;
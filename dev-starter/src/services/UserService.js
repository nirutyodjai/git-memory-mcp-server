const users = [
  { id: 1, name: 'Test User', email: 'test@example.com', password: 'password' },
];

class UserService {
  static async getUser(userId) {
    return users.find(u => u.id === userId);
  }

  static async updateUser(userId, updates) {
    const user = await this.getUser(userId);
    if (user) {
      Object.assign(user, updates);
    }
    return user;
  }
}

module.exports = UserService;
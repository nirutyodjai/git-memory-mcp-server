const axios = require('axios');

class Auth {
    constructor(config) {
        this.config = config;
        this.token = null;
    }

    async getToken() {
        if (!this.token) {
            await this.login();
        }
        return this.token;
    }

    async login() {
        try {
            const response = await axios.post(`${this.config.baseURL}/auth/login`, {
                username: this.config.username,
                password: this.config.password,
            });
            this.token = response.data.token;
        } catch (error) {
            console.error('Failed to login:', error);
            throw new Error('Authentication failed');
        }
    }
}

module.exports = Auth;
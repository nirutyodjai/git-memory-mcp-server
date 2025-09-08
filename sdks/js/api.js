const axios = require('axios');

class API {
    constructor(auth) {
        this.auth = auth;
        this.client = axios.create({
            baseURL: this.auth.config.baseURL,
        });

        this.client.interceptors.request.use(async (config) => {
            const token = await this.auth.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    async get(endpoint) {
        return this.client.get(endpoint);
    }

    async post(endpoint, data) {
        return this.client.post(endpoint, data);
    }

    async put(endpoint, data) {
        return this.client.put(endpoint, data);
    }

    async delete(endpoint) {
        return this.client.delete(endpoint);
    }
}

module.exports = API;
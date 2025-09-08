const tf = require('@tensorflow/tfjs-node');

class PredictiveScaler {
    constructor(serverManager) {
        this.serverManager = serverManager;
        this.model = null;
        this.history = [];
        this.isTraining = false;

        this.initialize();
    }

    async initialize() {
        await this.trainModel();
        setInterval(() => this.runPrediction(), 60 * 1000); // Run every minute
    }

    async trainModel() {
        if (this.isTraining) return;
        this.isTraining = true;

        // Mock historical data
        const historicalData = this.getHistoricalData();
        if (historicalData.length < 20) {
            this.isTraining = false;
            return;
        }

        const xs = tf.tensor2d(historicalData.map(d => d.load));
        const ys = tf.tensor2d(historicalData.map(d => d.servers));

        this.model = tf.sequential();
        this.model.add(tf.layers.dense({ units: 10, inputShape: [1], activation: 'relu' }));
        this.model.add(tf.layers.dense({ units: 1, activation: 'linear' }));

        this.model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

        await this.model.fit(xs, ys, { epochs: 50 });

        this.isTraining = false;
        console.log('🤖 Predictive scaling model trained');
    }

    async runPrediction() {
        if (!this.model) return;

        const currentLoad = this.serverManager.getCurrentLoad();
        const prediction = this.model.predict(tf.tensor2d([currentLoad], [1, 1]));
        const recommendedServers = Math.ceil(prediction.dataSync()[0]);

        this.history.push({ timestamp: new Date(), currentLoad, recommendedServers });

        await this.serverManager.scale(recommendedServers);
    }

    getHistoricalData() {
        // In a real implementation, this would come from a database
        return this.history;
    }

    getPredictionHistory() {
        return this.history;
    }
}

module.exports = PredictiveScaler;
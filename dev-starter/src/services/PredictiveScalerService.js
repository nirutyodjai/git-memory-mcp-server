const tf = require('@tensorflow/tfjs-node');

class PredictiveScalerService {
    constructor() {
        this.history = [];
        this.model = null;
    }

    async trainModel() {
        this.model = tf.sequential();
        this.model.add(tf.layers.dense({units: 1, inputShape: [1]}));
        this.model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});
        const xs = tf.tensor2d(this.history.map((h, i) => i), [this.history.length, 1]);
        const ys = tf.tensor2d(this.history, [this.history.length, 1]);
        await this.model.fit(xs, ys, {epochs: 10});
    }

    async predict() {
        if (this.history.length < 10) {
            return null;
        }
        if (!this.model) {
            await this.trainModel();
        }
        const prediction = this.model.predict(tf.tensor2d([this.history.length], [1, 1]));
        return Array.from(prediction.dataSync());
    }

    addHistory(load) {
        this.history.push(load);
        if (this.history.length > 100) {
            this.history.shift();
        }
    }

    getStatus() {
        return {
            history: this.history,
        };
    }
}

module.exports = new PredictiveScalerService();
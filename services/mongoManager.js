/**
 * MongoManager Service - Clean Version
 */
const mongoose = require('mongoose');
const EventEmitter = require('events');

class MongoManager extends EventEmitter {
    constructor(uri, options = {}) {
        super();
        this.uri = uri;
        this.options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            ...options
        };
        this.connected = false;
        this.operationQueue = [];
    }

    async connect() {
        console.log('🔌 Connecting to MongoDB...');
        try {
            await mongoose.connect(this.uri, this.options);
            this.connected = true;
            console.log('✅ MongoDB connected successfully!');
            this.emit('connected');
            this.processQueue();
        } catch (err) {
            console.error('❌ MongoDB connection failed:', err.message);
            this.connected = false;
            this.emit('disconnected');
        }

        mongoose.connection.on('connected', () => {
            this.connected = true;
            this.emit('connected');
            this.processQueue();
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB error:', err);
            this.emit('error', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected!');
            this.connected = false;
            this.emit('disconnected');
        });
    }

    isConnected() {
        return this.connected && mongoose.connection.readyState === 1;
    }

    enqueue(operation) {
        console.log('📥 Queued operation (offline):', operation.type);
        this.operationQueue.push(operation);
    }

    async processQueue() {
        if (this.operationQueue.length === 0) return;
        console.log(`🔄 Processing ${this.operationQueue.length} queued operations...`);

        while (this.operationQueue.length > 0) {
            const op = this.operationQueue.shift();
            try {
                // Basic implementation of replaying operations
                // In a real app, you'd need logic to actually execute these based on 'op.type'
                // For now, we just log them as processed or you can implement the logic if you know the structure
                console.log('Processing op:', op);
                // logic to execute op... 
                if (op.type === 'CREATE' && op.collection === 'User') {
                    const Model = mongoose.model(op.collection);
                    await new Model(op.data).save();
                }
                // Add other types if needed, or just keep it simple
            } catch (err) {
                console.error('Error processing queued op:', err);
            }
        }
    }
}

// Singleton Pattern
let instance = null;

module.exports = {
    init: (uri, options) => {
        if (!instance) {
            instance = new MongoManager(uri, options);
        }
        return instance;
    },
    getInstance: () => instance
};

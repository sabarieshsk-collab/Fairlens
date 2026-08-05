const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!mongoUri || mongoUri.includes('<db_password>') || mongoUri.includes('your_mongodb_atlas_connection_string')) {
    throw new Error('MONGODB_URI is not configured');
  }

  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB Connected');
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB Disconnected');
  });

  if (mongoUri.startsWith('mongodb+srv://')) {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    family: 4,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    minPoolSize: 2,
  });

  console.log('✅ MongoDB Connected successfully');
};

module.exports = connectDB;
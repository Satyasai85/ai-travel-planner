const mongoose = require('mongoose');

/**
 * Establishes a single, reused connection to MongoDB Atlas via Mongoose.
 * Throws (rejects) on failure so the caller can decide how to handle startup errors.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined in the environment.');
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    // Mongoose 8 uses sensible defaults; these keep intent explicit.
    // Fail fast (10s) instead of hanging when the cluster is unreachable.
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  return conn;
}

module.exports = connectDB;

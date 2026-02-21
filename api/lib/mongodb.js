/**
 * MongoDB connection caching for Vercel serverless functions.
 *
 * Why caching is necessary:
 *   Serverless functions are stateless — each invocation can spin up a new
 *   process. Without caching, every request would open a new TCP connection to
 *   MongoDB Atlas, quickly exhausting the free-tier connection pool (500 max).
 *
 *   The pattern below reuses the connection across warm invocations of the same
 *   function instance (Node.js process stays alive for a short window).
 *   `global.mongoose` persists across hot reloads in the same process.
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

// Cached connection state stored on the global object so it survives
// between invocations in the same warm Lambda / serverless runtime.
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set.');
  }

  // Return the existing live connection immediately
  if (cached.conn) return cached.conn;

  // Reuse an in-flight connection promise so concurrent cold-start requests
  // don't each open a new TCP connection.
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,   // fail fast — don't queue ops while disconnected
      maxPoolSize: 10,         // keep pool small; each function instance shares this
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    cached.promise = mongoose.connect(MONGO_URI, opts).then(m => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;

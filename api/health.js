// GET /api/health — liveness / readiness check
const { handleCors } = require('./lib/cors');
const connectDB = require('./lib/mongodb');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    await connectDB();
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', message: err.message });
  }
};

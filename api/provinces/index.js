// GET /api/provinces — all provinces sorted by number
const { handleCors } = require('../lib/cors');
const connectDB = require('../lib/mongodb');
const Province = require('../../backend/src/models/Province');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();
    const provinces = await Province.find().sort({ number: 1 });
    res.json(provinces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/provinces/:name — single province by name
const { handleCors } = require('../../lib/cors');
const connectDB = require('../../lib/mongodb');
const Province = require('../../../backend/src/models/Province');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const province = await Province.findOne({ name: req.query.name });
    if (!province) return res.status(404).json({ error: 'Province not found' });
    res.json(province);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

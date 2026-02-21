// GET /api/feedback/:projectId — list feedback for a project
const { handleCors } = require('../../lib/cors');
const connectDB = require('../../lib/mongodb');
const Feedback = require('../../../backend/src/models/Feedback');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const feedback = await Feedback.find({ projectId: req.query.projectId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/feedback — submit new feedback
const { handleCors } = require('../lib/cors');
const connectDB = require('../lib/mongodb');
const Feedback = require('../../backend/src/models/Feedback');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const { projectId, walletAddress, rating, comment } = req.body;

    if (!projectId || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields: projectId, rating, comment' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (comment.length > 500) {
      return res.status(400).json({ error: 'Comment too long (max 500 chars)' });
    }

    const feedback = new Feedback({
      projectId,
      walletAddress: walletAddress || 'anonymous',
      rating,
      comment,
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

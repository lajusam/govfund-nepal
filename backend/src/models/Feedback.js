const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    projectId: { type: String, required: true, index: true },
    walletAddress: { type: String, default: 'anonymous' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now, expires: 31536000 }, // TTL: auto-delete after 365 days
});

feedbackSchema.index({ projectId: 1, createdAt: -1 });
// TTL index — MongoDB automatically removes documents 365 days after createdAt
feedbackSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('Feedback', feedbackSchema);

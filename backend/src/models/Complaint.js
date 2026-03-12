const mongoose = require('mongoose');

const COMPLAINT_TYPES = [
    'Budget Misuse',
    'Project Delay',
    'Fake Progress Report',
    'Contractor Corruption',
    'Environmental Damage',
    'Other',
];

const complaintSchema = new mongoose.Schema({
    projectId: { type: String, required: true, index: true },
    province: { type: String, default: '' },
    district: { type: String, default: '' },
    walletAddress: { type: String, required: true, index: true },
    complaintType: { type: String, required: true, enum: COMPLAINT_TYPES },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 5000 },
    evidence: [{
        cid: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, default: 'document' },
    }],
    reactions: {
        support: { type: Number, default: 0 },
        disagree: { type: Number, default: 0 },
        investigation: { type: Number, default: 0 },
    },
    voters: [{
        walletAddress: { type: String, required: true },
        reaction: { type: String, enum: ['support', 'disagree', 'investigation'], required: true },
    }],
}, {
    timestamps: true,
});

// One wallet can only create ONE complaint per project
complaintSchema.index({ projectId: 1, walletAddress: 1 }, { unique: true });
// Sort by popularity
complaintSchema.index({ 'reactions.support': -1, 'reactions.disagree': 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
module.exports.COMPLAINT_TYPES = COMPLAINT_TYPES;

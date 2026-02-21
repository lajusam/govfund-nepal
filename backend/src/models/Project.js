const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    province: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    sector: { type: String, required: true, index: true },
    contractor: { type: String, required: true },
    totalBudget: { type: Number, required: true },
    allocatedBudget: { type: Number, default: 0 },
    releasedAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Completed', 'Suspended'], default: 'Active' },
    milestoneCount: { type: Number, required: true },
    milestonesCompleted: { type: Number, default: 0 },
    adminWallet: { type: String, required: true },
    estimatedCompletion: { type: Date, required: true },
    onChainAddress: { type: String, default: '' },
    // Off-chain enrichment
    description: { type: String, default: '' },
    milestones: [{
        index: Number,
        title: String,
        description: String,
        status: { type: String, enum: ['Pending', 'InProgress', 'Completed', 'Delayed'], default: 'Pending' },
        updatedAt: { type: Date, default: Date.now },
    }],
    documents: [{
        ipfsHash: String,
        name: String,
        uploadedAt: { type: Date, default: Date.now },
        onChainIndex: Number,
    }],
    fundReleases: [{
        amount: Number,
        date: { type: Date, default: Date.now },
        txSignature: String,
        description: String,
    }],
    budgetAllocations: [{
        amount: Number,
        date: { type: Date, default: Date.now },
        txSignature: String,
        description: String,
    }],
    solanaExplorerUrl: { type: String, default: '' },
}, {
    timestamps: true,
});

projectSchema.index({ province: 1, district: 1, sector: 1 });
projectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', projectSchema);

const mongoose = require('mongoose');

const ministrySchema = new mongoose.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    percentage: { type: Number, required: true },
}, { _id: false });

const provinceGrantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    grant: { type: Number, required: true },
}, { _id: false });

const utilizationSchema = new mongoose.Schema({
    category: { type: String, required: true },
    allocated: { type: Number, required: true },
    spent: { type: Number, required: true },
    percentage: { type: Number, required: true },
}, { _id: false });

const nationalBudgetSchema = new mongoose.Schema({
    fiscalYear: { type: String, required: true, unique: true, index: true },

    // Total budget split
    totalBudget: { type: Number, required: true },
    recurrentExpenditure: { type: Number, required: true },
    capitalExpenditure: { type: Number, required: true },
    financialManagement: { type: Number, required: true },

    // Province-wise federal grants
    provinceGrants: [provinceGrantSchema],

    // Ministry-wise breakdown
    ministries: [ministrySchema],

    // Allocated vs Spent utilization
    utilization: [utilizationSchema],

    // IPFS verification
    ipfsCid: { type: String, default: '' },
    ipfsGatewayUrl: { type: String, default: '' },
}, {
    timestamps: true,
});

module.exports = mongoose.model('NationalBudget', nationalBudgetSchema);

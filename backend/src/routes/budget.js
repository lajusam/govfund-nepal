const express = require('express');
const router = express.Router();
const NationalBudget = require('../models/NationalBudget');

// GET /api/budget/summary — total budget split
router.get('/summary', async (req, res) => {
    try {
        const budget = await NationalBudget.findOne().sort({ createdAt: -1 });
        if (!budget) return res.status(404).json({ error: 'No budget data found' });
        res.json({
            fiscalYear: budget.fiscalYear,
            totalBudget: budget.totalBudget,
            recurrentExpenditure: budget.recurrentExpenditure,
            capitalExpenditure: budget.capitalExpenditure,
            financialManagement: budget.financialManagement,
        });
    } catch (err) {
        console.error('[budget] Summary error:', err.message);
        res.status(500).json({ error: 'Failed to fetch budget summary' });
    }
});

// GET /api/budget/provinces — province-wise federal grants
router.get('/provinces', async (req, res) => {
    try {
        const budget = await NationalBudget.findOne().sort({ createdAt: -1 });
        if (!budget) return res.status(404).json({ error: 'No budget data found' });
        res.json(budget.provinceGrants);
    } catch (err) {
        console.error('[budget] Provinces error:', err.message);
        res.status(500).json({ error: 'Failed to fetch province grants' });
    }
});

// GET /api/budget/ministries — ministry-wise breakdown
router.get('/ministries', async (req, res) => {
    try {
        const budget = await NationalBudget.findOne().sort({ createdAt: -1 });
        if (!budget) return res.status(404).json({ error: 'No budget data found' });
        res.json(budget.ministries);
    } catch (err) {
        console.error('[budget] Ministries error:', err.message);
        res.status(500).json({ error: 'Failed to fetch ministry breakdown' });
    }
});

// GET /api/budget/utilization — allocated vs spent
router.get('/utilization', async (req, res) => {
    try {
        const budget = await NationalBudget.findOne().sort({ createdAt: -1 });
        if (!budget) return res.status(404).json({ error: 'No budget data found' });
        res.json(budget.utilization);
    } catch (err) {
        console.error('[budget] Utilization error:', err.message);
        res.status(500).json({ error: 'Failed to fetch utilization data' });
    }
});

// GET /api/budget/all — all sections in one call
router.get('/all', async (req, res) => {
    try {
        const budget = await NationalBudget.findOne().sort({ createdAt: -1 });
        if (!budget) return res.status(404).json({ error: 'No budget data found' });
        res.json({
            fiscalYear: budget.fiscalYear,
            summary: {
                totalBudget: budget.totalBudget,
                recurrentExpenditure: budget.recurrentExpenditure,
                capitalExpenditure: budget.capitalExpenditure,
                financialManagement: budget.financialManagement,
            },
            provinceGrants: budget.provinceGrants,
            ministries: budget.ministries,
            utilization: budget.utilization,
            ipfsCid: budget.ipfsCid,
            ipfsGatewayUrl: budget.ipfsGatewayUrl,
        });
    } catch (err) {
        console.error('[budget] All error:', err.message);
        res.status(500).json({ error: 'Failed to fetch budget data' });
    }
});

// GET /api/budget/verify — IPFS CID and gateway URL for public verification
router.get('/verify', async (req, res) => {
    try {
        const budget = await NationalBudget.findOne().sort({ createdAt: -1 });
        if (!budget) return res.status(404).json({ error: 'No budget data found' });
        if (!budget.ipfsCid) {
            return res.json({
                verified: false,
                message: 'Budget data has not been uploaded to IPFS yet',
                ipfsCid: null,
                ipfsGatewayUrl: null,
            });
        }
        res.json({
            verified: true,
            fiscalYear: budget.fiscalYear,
            ipfsCid: budget.ipfsCid,
            ipfsGatewayUrl: budget.ipfsGatewayUrl || `https://gateway.pinata.cloud/ipfs/${budget.ipfsCid}`,
        });
    } catch (err) {
        console.error('[budget] Verify error:', err.message);
        res.status(500).json({ error: 'Failed to verify budget data' });
    }
});

module.exports = router;

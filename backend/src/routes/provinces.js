const express = require('express');
const router = express.Router();
const Province = require('../models/Province');

// GET all provinces with hierarchy
router.get('/', async (req, res) => {
    try {
        const provinces = await Province.find().sort({ number: 1 });
        res.json(provinces);
    } catch (err) {
        console.error('[provinces] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch provinces' });
    }
});

// GET single province
router.get('/:name', async (req, res) => {
    try {
        const province = await Province.findOne({ name: req.params.name });
        if (!province) return res.status(404).json({ error: 'Province not found' });
        res.json(province);
    } catch (err) {
        console.error('[provinces] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch province' });
    }
});

module.exports = router;

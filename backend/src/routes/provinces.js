const express = require('express');
const router = express.Router();
const Province = require('../models/Province');

// GET all provinces with hierarchy
router.get('/', async (req, res) => {
    try {
        const provinces = await Province.find().sort({ number: 1 });
        res.json(provinces);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single province
router.get('/:name', async (req, res) => {
    try {
        const province = await Province.findOne({ name: req.params.name });
        if (!province) return res.status(404).json({ error: 'Province not found' });
        res.json(province);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

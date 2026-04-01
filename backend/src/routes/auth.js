const express = require('express');
const router = express.Router();

const ADMIN_WALLET = process.env.ADMIN_WALLET || '4MMhsQ2odgEdAowV3Si6L44jRhTZAepuFjPeWGSgA3h2';
const ADMIN_WALLETS = [
    ADMIN_WALLET,
    process.env.ADMIN_WALLET_2 || '8HACvxLFboKua6ARScPZsqHVCMAQ7MniL8AhNDxomV9Y',
].filter(Boolean);

// GET /api/auth/is-admin?wallet=<base58 address>
router.get('/is-admin', (req, res) => {
    const wallet = req.query.wallet;
    if (!wallet) {
        return res.status(400).json({ error: 'wallet query parameter required' });
    }
    res.json({ isAdmin: ADMIN_WALLETS.includes(wallet) });
});

module.exports = router;

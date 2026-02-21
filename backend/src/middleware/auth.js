/**
 * Wallet-based admin authentication middleware.
 * Verifies that the request comes from the admin wallet by checking
 * a signed message (nacl signature verification).
 * 
 * Headers required:
 *   x-wallet-address: base58 public key
 *   x-wallet-signature: base58 signature of the message
 *   x-wallet-message: the original message that was signed
 */
const bs58 = require('bs58');
const nacl = require('tweetnacl');

const ADMIN_WALLET = process.env.ADMIN_WALLET || '4MMhsQ2odgEdAowV3Si6L44jRhTZAepuFjPeWGSgA3h2';

/**
 * Verifies the connected wallet is the admin wallet.
 * For admin-protected routes (create, allocate, release, etc.)
 */
const verifyAdmin = (req, res, next) => {
    const walletAddress = req.headers['x-wallet-address'];
    const signature = req.headers['x-wallet-signature'];
    const message = req.headers['x-wallet-message'];

    if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required in x-wallet-address header' });
    }

    // Check wallet matches admin
    if (walletAddress !== ADMIN_WALLET) {
        return res.status(403).json({
            error: 'Unauthorized: only the admin wallet can perform this action',
            expected: ADMIN_WALLET,
            received: walletAddress,
        });
    }

    // If signature is provided, verify it cryptographically
    if (signature && message) {
        try {
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = bs58.decode(signature);
            const publicKeyBytes = bs58.decode(walletAddress);
            const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
            if (!verified) {
                return res.status(403).json({ error: 'Invalid wallet signature' });
            }
        } catch (err) {
            return res.status(403).json({ error: 'Signature verification failed', message: err.message });
        }
    }

    req.walletAddress = walletAddress;
    next();
};

/**
 * Optional middleware: just extracts wallet address if present (no admin check).
 * Used for routes where we want to know who is calling but don't require admin.
 */
const extractWallet = (req, res, next) => {
    req.walletAddress = req.headers['x-wallet-address'] || null;
    req.isAdmin = req.walletAddress === ADMIN_WALLET;
    next();
};

module.exports = { verifyAdmin, extractWallet, ADMIN_WALLET };

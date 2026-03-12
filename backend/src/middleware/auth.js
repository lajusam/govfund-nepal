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
const bs58 = require('bs58').default || require('bs58');
const nacl = require('tweetnacl');

const ADMIN_WALLET = process.env.ADMIN_WALLET || '4MMhsQ2odgEdAowV3Si6L44jRhTZAepuFjPeWGSgA3h2';

// All authorized admin wallets — both the original and the newly added one.
// Any wallet in this list can perform admin operations via the backend.
const ADMIN_WALLETS = [
    ADMIN_WALLET,
    process.env.ADMIN_WALLET_2 || '8HACvxLFboKua6ARScPZsqHVCMAQ7MniL8AhNDxomV9Y',
].filter(Boolean);

/**
 * Verifies the connected wallet is one of the authorized admin wallets.
 * For admin-protected routes (create, allocate, release, etc.)
 */
const verifyAdmin = (req, res, next) => {
    const walletAddress = req.headers['x-wallet-address'];
    const signature = req.headers['x-wallet-signature'];
    const message = req.headers['x-wallet-message'];

    if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required in x-wallet-address header' });
    }

    // Check wallet matches any authorized admin
    if (!ADMIN_WALLETS.includes(walletAddress)) {
        return res.status(403).json({
            error: 'Unauthorized: wallet is not an authorized admin',
        });
    }

    // SECURITY FIX: Signature verification is now MANDATORY.
    // Without this, anyone who knows the admin wallet address (publicly visible
    // on-chain) could spoof admin requests by simply setting the header.
    if (!signature || !message) {
        return res.status(401).json({ error: 'Wallet signature and message are required for admin authentication' });
    }

    try {
        // Encode message to UTF-8 bytes (must match frontend TextEncoder output)
        const messageBytes = new Uint8Array(new TextEncoder().encode(message));
        // Decode ed25519 signature from base58 (64 bytes)
        const signatureBytes = new Uint8Array(bs58.decode(signature));
        if (signatureBytes.length !== 64) {
            return res.status(403).json({ error: 'Invalid signature format' });
        }
        // Decode Solana public key from base58 (32 bytes)
        const publicKeyBytes = new Uint8Array(bs58.decode(walletAddress));
        if (publicKeyBytes.length !== 32) {
            return res.status(403).json({ error: 'Invalid wallet address format' });
        }
        // Verify ed25519 detached signature
        const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
        if (!verified) {
            return res.status(403).json({ error: 'Invalid wallet signature' });
        }
    } catch (err) {
        console.error('[auth] Admin signature verification error:', err.message);
        return res.status(403).json({ error: 'Signature verification failed' });
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
    req.isAdmin = ADMIN_WALLETS.includes(req.walletAddress);
    next();
};

/**
 * Verifies any wallet signature (not limited to admins).
 * Used for citizen-facing routes that need wallet authentication.
 */
const verifyWallet = (req, res, next) => {
    const walletAddress = req.headers['x-wallet-address'];
    const signature = req.headers['x-wallet-signature'];
    const message = req.headers['x-wallet-message'];

    if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required' });
    }
    if (!signature || !message) {
        return res.status(401).json({ error: 'Wallet signature and message are required' });
    }

    try {
        // Encode message to UTF-8 bytes (must match frontend TextEncoder output)
        const messageBytes = new Uint8Array(new TextEncoder().encode(message));
        // Decode ed25519 signature from base58 (64 bytes)
        const signatureBytes = new Uint8Array(bs58.decode(signature));
        if (signatureBytes.length !== 64) {
            return res.status(403).json({ error: 'Invalid signature format' });
        }
        // Decode Solana public key from base58 (32 bytes)
        const publicKeyBytes = new Uint8Array(bs58.decode(walletAddress));
        if (publicKeyBytes.length !== 32) {
            return res.status(403).json({ error: 'Invalid wallet address format' });
        }
        // Verify ed25519 detached signature
        const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
        if (!verified) {
            return res.status(403).json({ error: 'Invalid wallet signature' });
        }
    } catch (err) {
        console.error('[auth] Wallet signature verification error:', err.message);
        return res.status(403).json({ error: 'Signature verification failed' });
    }

    req.walletAddress = walletAddress;
    req.isAdmin = ADMIN_WALLETS.includes(walletAddress);
    next();
};

module.exports = { verifyAdmin, extractWallet, verifyWallet, ADMIN_WALLET, ADMIN_WALLETS };

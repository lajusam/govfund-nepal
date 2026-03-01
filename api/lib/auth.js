/**
 * Wallet-based admin authentication for serverless functions.
 *
 * Adapted from backend/src/middleware/auth.js — the same logic but without
 * Express's next() pattern. Returns true if auth passed, false if it already
 * sent a 401/403 response so the handler should return immediately.
 */

const bs58 = require('bs58');
const nacl = require('tweetnacl');

const ADMIN_WALLET =
  process.env.ADMIN_WALLET || '4MMhsQ2odgEdAowV3Si6L44jRhTZAepuFjPeWGSgA3h2';

// All authorized admin wallets for serverless functions.
const ADMIN_WALLETS = [
  ADMIN_WALLET,
  process.env.ADMIN_WALLET_2 || '8HACvxLFboKua6ARScPZsqHVCMAQ7MniL8AhNDxomV9Y',
].filter(Boolean);

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @returns {boolean} true = authorised, false = response already sent
 */
function verifyAdmin(req, res) {
  const walletAddress = req.headers['x-wallet-address'];
  const signature = req.headers['x-wallet-signature'];
  const message = req.headers['x-wallet-message'];

  if (!walletAddress) {
    res.status(401).json({ error: 'Wallet address required in x-wallet-address header' });
    return false;
  }

  if (!ADMIN_WALLETS.includes(walletAddress)) {
    res.status(403).json({
      error: 'Unauthorized: only an authorized admin wallet can perform this action',
      expected: ADMIN_WALLETS,
      received: walletAddress,
    });
    return false;
  }

  // Cryptographic signature verification (optional but strongly recommended)
  if (signature && message) {
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(walletAddress);
      const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      if (!verified) {
        res.status(403).json({ error: 'Invalid wallet signature' });
        return false;
      }
    } catch (err) {
      res.status(403).json({ error: 'Signature verification failed', message: err.message });
      return false;
    }
  }

  return true;
}

module.exports = { verifyAdmin, ADMIN_WALLET, ADMIN_WALLETS };

/**
 * Wallet-based admin authentication for serverless functions.
 *
 * Adapted from backend/src/middleware/auth.js — the same logic but without
 * Express's next() pattern. Returns true if auth passed, false if it already
 * sent a 401/403 response so the handler should return immediately.
 */

const bs58 = require('bs58').default || require('bs58');
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
      error: 'Unauthorized: wallet is not an authorized admin',
    });
    return false;
  }

  // SECURITY FIX: Signature verification is now MANDATORY.
  if (!signature || !message) {
    res.status(401).json({ error: 'Wallet signature and message are required for admin authentication' });
    return false;
  }

  try {
    // Encode message to UTF-8 bytes (must match frontend TextEncoder output)
    const messageBytes = new Uint8Array(new TextEncoder().encode(message));
    // Decode ed25519 signature from base58 (64 bytes)
    const signatureBytes = new Uint8Array(bs58.decode(signature));
    if (signatureBytes.length !== 64) {
      res.status(403).json({ error: 'Invalid signature format' });
      return false;
    }
    // Decode Solana public key from base58 (32 bytes)
    const publicKeyBytes = new Uint8Array(bs58.decode(walletAddress));
    if (publicKeyBytes.length !== 32) {
      res.status(403).json({ error: 'Invalid wallet address format' });
      return false;
    }
    // Verify ed25519 detached signature
    const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    if (!verified) {
      res.status(403).json({ error: 'Invalid wallet signature' });
      return false;
    }
  } catch (err) {
    console.error('[auth] Admin signature verification error:', err.message);
    res.status(403).json({ error: 'Signature verification failed' });
    return false;
  }

  return true;
}

module.exports = { verifyAdmin, ADMIN_WALLET, ADMIN_WALLETS };

/**
 * CORS helper for Vercel serverless functions.
 *
 * Express's `cors()` middleware isn't usable directly in serverless functions
 * (there is no middleware chain). Instead we set response headers manually and
 * short-circuit OPTIONS preflight requests.
 */

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // set this in Vercel environment variables
].filter(Boolean);

/**
 * Sets CORS headers and handles the OPTIONS preflight.
 *
 * @returns {boolean} true if the request was a preflight (already responded),
 *                    false if normal processing should continue.
 */
function handleCors(req, res) {
  const origin = req.headers.origin;

  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    // Production: only allow the deployed frontend
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,x-wallet-address,x-wallet-signature,x-wallet-message',
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Respond immediately to browser preflight — no further processing needed
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

module.exports = { handleCors };

// GET /api/admin/config — public config: admin wallet + program ID for frontend
const { handleCors } = require('../../lib/cors');
const { ADMIN_WALLET } = require('../../lib/auth');
const {
  PROGRAM_ID,
  RPC_URL,
} = require('../../../backend/src/services/solana');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.json({
    adminWallet: ADMIN_WALLET,
    programId: PROGRAM_ID,
    rpcUrl: RPC_URL,
    network: 'devnet',
  });
};

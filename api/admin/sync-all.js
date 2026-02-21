// GET /api/admin/sync-all — re-fetch ALL projects from chain and update MongoDB cache
const { handleCors } = require('../../lib/cors');
const { verifyAdmin } = require('../../lib/auth');
const connectDB = require('../../lib/mongodb');
const Project = require('../../../backend/src/models/Project');
const {
  fetchAllProjectsFromChain,
  getAccountExplorerUrl,
} = require('../../../backend/src/services/solana');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdmin(req, res)) return;

  try {
    await connectDB();

    const onChainProjects = await fetchAllProjectsFromChain();
    let synced = 0;

    for (const p of onChainProjects) {
      await Project.findOneAndUpdate(
        { projectId: p.projectId },
        {
          projectId: p.projectId,
          name: p.name,
          province: p.province,
          district: p.district,
          sector: p.sector,
          contractor: p.contractor,
          totalBudget: p.totalBudget,
          allocatedBudget: p.allocatedBudget,
          releasedAmount: p.releasedAmount,
          status: p.status,
          milestoneCount: p.milestoneCount,
          milestonesCompleted: p.milestonesCompleted,
          adminWallet: p.admin,
          estimatedCompletion: new Date(p.estimatedCompletion),
          onChainAddress: p.publicKey,
          solanaExplorerUrl: getAccountExplorerUrl(p.publicKey),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      synced++;
    }

    res.json({ message: `Synced ${synced} projects from blockchain`, count: synced });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

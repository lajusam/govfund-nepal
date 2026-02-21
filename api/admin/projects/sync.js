// POST /api/admin/projects/sync — sync a newly created project from chain → MongoDB
const { handleCors } = require('../../../lib/cors');
const { verifyAdmin } = require('../../../lib/auth');
const connectDB = require('../../../lib/mongodb');
const Project = require('../../../../backend/src/models/Project');
const {
  fetchProjectFromChain,
  getAccountExplorerUrl,
  getExplorerUrl,
} = require('../../../../backend/src/services/solana');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdmin(req, res)) return;

  try {
    await connectDB();

    const { projectId, txSignature, description } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const onChainProject = await fetchProjectFromChain(projectId);
    if (!onChainProject) {
      return res.status(404).json({
        error: 'Project not found on-chain. Ensure the transaction was confirmed.',
      });
    }

    const project = await Project.findOneAndUpdate(
      { projectId },
      {
        projectId: onChainProject.projectId,
        name: onChainProject.name,
        province: onChainProject.province,
        district: onChainProject.district,
        sector: onChainProject.sector,
        contractor: onChainProject.contractor,
        totalBudget: onChainProject.totalBudget,
        allocatedBudget: onChainProject.allocatedBudget,
        releasedAmount: onChainProject.releasedAmount,
        status: onChainProject.status,
        milestoneCount: onChainProject.milestoneCount,
        milestonesCompleted: onChainProject.milestonesCompleted,
        adminWallet: onChainProject.admin,
        estimatedCompletion: new Date(onChainProject.estimatedCompletion),
        onChainAddress: onChainProject.publicKey,
        solanaExplorerUrl: getAccountExplorerUrl(onChainProject.publicKey),
        description: description || '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({
      message: 'Project synced from blockchain',
      project,
      onChain: onChainProject,
      explorerUrl: txSignature ? getExplorerUrl(txSignature) : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

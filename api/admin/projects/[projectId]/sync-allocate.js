// POST /api/admin/projects/:projectId/sync-allocate — sync budget allocation from chain → MongoDB
const { handleCors } = require('../../../../lib/cors');
const { verifyAdmin } = require('../../../../lib/auth');
const connectDB = require('../../../../lib/mongodb');
const Project = require('../../../../../backend/src/models/Project');
const {
  fetchProjectFromChain,
  getExplorerUrl,
} = require('../../../../../backend/src/services/solana');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyAdmin(req, res)) return;

  try {
    await connectDB();

    const { projectId } = req.query;
    const { txSignature, amount, description } = req.body;

    const onChainProject = await fetchProjectFromChain(projectId);
    if (!onChainProject) {
      return res.status(404).json({ error: 'Project not found on-chain' });
    }

    const project = await Project.findOneAndUpdate(
      { projectId },
      {
        allocatedBudget: onChainProject.allocatedBudget,
        $push: {
          budgetAllocations: {
            amount: amount || 0,
            date: new Date(),
            txSignature: txSignature || '',
            description: description || 'Budget allocation synced from chain',
          },
        },
      },
      { new: true },
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found in cache. Run /sync first.' });
    }

    res.json({
      message: 'Budget allocation synced from blockchain',
      project,
      onChain: onChainProject,
      explorerUrl: txSignature ? getExplorerUrl(txSignature) : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

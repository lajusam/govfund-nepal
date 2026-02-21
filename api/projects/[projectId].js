// GET /api/projects/:projectId — single project, blockchain first with MongoDB fallback
const { handleCors } = require('../../lib/cors');
const connectDB = require('../../lib/mongodb');
const Project = require('../../../backend/src/models/Project');
const { fetchProjectFromChain } = require('../../../backend/src/services/solana');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const { projectId } = req.query;

    // Try blockchain (source of truth)
    let chainProject = null;
    try {
      chainProject = await fetchProjectFromChain(projectId);
    } catch (err) {
      console.warn(`Solana fetch failed for ${projectId}:`, err.message);
    }

    // Get MongoDB cache for off-chain metadata
    const cached = await Project.findOne({ projectId }).lean();

    if (chainProject) {
      return res.json({
        ...chainProject,
        description: cached?.description || '',
        milestones: cached?.milestones || [],
        documents: cached?.documents || [],
        fundReleases: cached?.fundReleases || [],
        budgetAllocations: cached?.budgetAllocations || [],
        solanaExplorerUrl: cached?.solanaExplorerUrl || '',
      });
    }

    if (cached) return res.json(cached);

    res.status(404).json({ error: 'Project not found on-chain or in cache' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

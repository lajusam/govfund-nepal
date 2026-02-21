// GET /api/projects/:projectId/milestones
const { handleCors } = require('../../../lib/cors');
const connectDB = require('../../../lib/mongodb');
const Project = require('../../../../backend/src/models/Project');
const {
  fetchProjectFromChain,
  fetchMilestonesFromChain,
} = require('../../../../backend/src/services/solana');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const { projectId } = req.query;

    let chainProject = null;
    try {
      chainProject = await fetchProjectFromChain(projectId);
    } catch {}

    if (chainProject) {
      const milestones = await fetchMilestonesFromChain(projectId, chainProject.milestoneCount);
      if (milestones.length > 0) return res.json(milestones);
    }

    const cached = await Project.findOne({ projectId });
    res.json(cached?.milestones || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

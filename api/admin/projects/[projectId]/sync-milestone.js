// POST /api/admin/projects/:projectId/sync-milestone — sync milestone update from chain → MongoDB
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
    const { txSignature, index, title, description, status } = req.body;

    const onChainProject = await fetchProjectFromChain(projectId);
    if (!onChainProject) {
      return res.status(404).json({ error: 'Project not found on-chain' });
    }

    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found in cache. Run /sync first.' });
    }

    const milestoneIndex = parseInt(index);
    const existingIdx = project.milestones.findIndex(m => m.index === milestoneIndex);
    const milestoneData = {
      index: milestoneIndex,
      title: title || `Milestone ${milestoneIndex + 1}`,
      description: description || '',
      status: status || 'Pending',
      updatedAt: new Date(),
    };

    if (existingIdx >= 0) {
      project.milestones[existingIdx] = milestoneData;
    } else {
      project.milestones.push(milestoneData);
    }

    project.milestonesCompleted = onChainProject.milestonesCompleted;
    await project.save();

    res.json({
      message: 'Milestone synced from blockchain',
      project,
      onChain: onChainProject,
      explorerUrl: txSignature ? getExplorerUrl(txSignature) : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

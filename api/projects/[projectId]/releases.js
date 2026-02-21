// GET /api/projects/:projectId/releases — fund release history (off-chain only)
const { handleCors } = require('../../../lib/cors');
const connectDB = require('../../../lib/mongodb');
const Project = require('../../../../backend/src/models/Project');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const { projectId } = req.query;
    const project = await Project.findOne({ projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.fundReleases || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/projects/:projectId/documents
const { handleCors } = require('../../../lib/cors');
const connectDB = require('../../../lib/mongodb');
const Project = require('../../../../backend/src/models/Project');
const {
  fetchProjectFromChain,
  fetchDocumentsFromChain,
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
      const docs = await fetchDocumentsFromChain(projectId, chainProject.documentCount);
      if (docs.length > 0) return res.json(docs);
    }

    const cached = await Project.findOne({ projectId });
    res.json(cached?.documents || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

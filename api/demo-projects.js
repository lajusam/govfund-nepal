// GET /api/demo-projects — fetch all seeded/cached projects from MongoDB
const { handleCors } = require('./lib/cors');
const connectDB = require('./lib/mongodb');
const Project = require('../backend/src/models/Project');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    await connectDB();
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    console.error('Error fetching demo projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects', message: err.message });
  }
};

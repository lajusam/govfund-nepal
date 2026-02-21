// GET /api — root endpoint listing all available routes
const { handleCors } = require('./lib/cors');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  res.json({
    message: 'GovFund Nepal API is running!',
    routes: [
      '/api/projects',
      '/api/provinces',
      '/api/analytics',
      '/api/admin/config',
      '/api/feedback',
      '/api/health',
      '/api/demo-projects',
    ],
  });
};

// GET /api/analytics — aggregated budget and project statistics
const { handleCors } = require('../lib/cors');
const connectDB = require('../lib/mongodb');
const Project = require('../../backend/src/models/Project');
const { fetchAllProjectsFromChain } = require('../../backend/src/services/solana');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    // 1. MongoDB projects (includes seeded demo data)
    const mongoProjects = await Project.find().lean();

    // 2. On-chain projects (may fail — graceful degradation)
    let chainProjects = [];
    try {
      chainProjects = await fetchAllProjectsFromChain();
    } catch (err) {
      console.warn('Analytics: Solana fetch failed, using MongoDB only:', err.message);
    }

    // 3. Merge — chain overrides MongoDB
    const mergedMap = new Map();

    for (const mp of mongoProjects) {
      mergedMap.set(mp.projectId, {
        totalBudget: mp.totalBudget,
        allocatedBudget: mp.allocatedBudget || 0,
        releasedAmount: mp.releasedAmount || 0,
        status: mp.status,
        milestoneCount: mp.milestoneCount,
        milestonesCompleted: mp.milestonesCompleted || 0,
        province: mp.province,
        sector: mp.sector,
      });
    }

    for (const cp of chainProjects) {
      mergedMap.set(cp.projectId, {
        totalBudget: cp.totalBudget,
        allocatedBudget: cp.allocatedBudget,
        releasedAmount: cp.releasedAmount,
        status: cp.status,
        milestoneCount: cp.milestoneCount,
        milestonesCompleted: cp.milestonesCompleted,
        province: cp.province,
        sector: cp.sector,
      });
    }

    const projects = Array.from(mergedMap.values());

    const totalBudget = projects.reduce((sum, p) => sum + p.totalBudget, 0);
    const totalAllocated = projects.reduce((sum, p) => sum + p.allocatedBudget, 0);
    const totalReleased = projects.reduce((sum, p) => sum + p.releasedAmount, 0);
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    // Province-wise aggregation
    const provinceMap = {};
    projects.forEach(p => {
      if (!provinceMap[p.province]) {
        provinceMap[p.province] = { budget: 0, released: 0, count: 0 };
      }
      provinceMap[p.province].budget += p.totalBudget;
      provinceMap[p.province].released += p.releasedAmount;
      provinceMap[p.province].count += 1;
    });

    const provinceStats = Object.entries(provinceMap).map(([name, data]) => ({
      province: name,
      ...data,
    }));

    // Sector-wise aggregation
    const sectorMap = {};
    projects.forEach(p => {
      if (!sectorMap[p.sector]) {
        sectorMap[p.sector] = { budget: 0, released: 0, count: 0 };
      }
      sectorMap[p.sector].budget += p.totalBudget;
      sectorMap[p.sector].released += p.releasedAmount;
      sectorMap[p.sector].count += 1;
    });

    const sectorStats = Object.entries(sectorMap).map(([name, data]) => ({
      sector: name,
      ...data,
    }));

    res.json({
      overview: {
        totalBudget,
        totalAllocated,
        totalReleased,
        totalProjects,
        activeProjects,
        completedProjects,
        utilizationRate:
          totalAllocated > 0 ? ((totalReleased / totalAllocated) * 100).toFixed(1) : 0,
      },
      provinceStats,
      sectorStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

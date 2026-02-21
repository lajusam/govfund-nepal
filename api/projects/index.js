// GET /api/projects — merged on-chain + MongoDB project list with optional filters
// Query params: ?province=&district=&sector=&status=
const { handleCors } = require('../lib/cors');
const connectDB = require('../lib/mongodb');
const Project = require('../../backend/src/models/Project');
const { fetchAllProjectsFromChain } = require('../../backend/src/services/solana');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const { province, district, sector, status } = req.query;

    // 1. Always fetch MongoDB projects (includes seeded demo data)
    const mongoProjects = await Project.find().select('-__v').lean();

    // 2. Try to fetch on-chain projects
    let chainProjects = [];
    try {
      chainProjects = await fetchAllProjectsFromChain();
    } catch (err) {
      console.warn('Solana fetch failed, using MongoDB only:', err.message);
    }

    // 3. Merge — chain data overrides MongoDB for matching projectIds
    const mergedMap = new Map();

    for (const mp of mongoProjects) {
      mergedMap.set(mp.projectId, {
        projectId: mp.projectId,
        name: mp.name,
        province: mp.province,
        district: mp.district,
        sector: mp.sector,
        contractor: mp.contractor,
        totalBudget: mp.totalBudget,
        allocatedBudget: mp.allocatedBudget || 0,
        releasedAmount: mp.releasedAmount || 0,
        status: mp.status,
        milestoneCount: mp.milestoneCount,
        milestonesCompleted: mp.milestonesCompleted || 0,
        admin: mp.adminWallet || '',
        estimatedCompletion: mp.estimatedCompletion,
        description: mp.description || '',
        milestones: mp.milestones || [],
        documents: mp.documents || [],
        fundReleases: mp.fundReleases || [],
        budgetAllocations: mp.budgetAllocations || [],
        solanaExplorerUrl: mp.solanaExplorerUrl || '',
        onChainAddress: mp.onChainAddress || '',
        onChain: false,
      });
    }

    for (const cp of chainProjects) {
      const existing = mergedMap.get(cp.projectId);
      mergedMap.set(cp.projectId, {
        ...cp,
        description: existing?.description || '',
        milestones: existing?.milestones || [],
        documents: existing?.documents || [],
        fundReleases: existing?.fundReleases || [],
        budgetAllocations: existing?.budgetAllocations || [],
        solanaExplorerUrl: existing?.solanaExplorerUrl || '',
        onChain: true,
      });

      // Auto-sync: insert on-chain projects missing from MongoDB
      if (!existing) {
        try {
          await Project.findOneAndUpdate(
            { projectId: cp.projectId },
            {
              projectId: cp.projectId,
              name: cp.name,
              province: cp.province,
              district: cp.district,
              sector: cp.sector,
              contractor: cp.contractor,
              totalBudget: cp.totalBudget,
              allocatedBudget: cp.allocatedBudget,
              releasedAmount: cp.releasedAmount,
              status: cp.status,
              milestoneCount: cp.milestoneCount,
              milestonesCompleted: cp.milestonesCompleted,
              adminWallet: cp.admin,
              estimatedCompletion: new Date(cp.estimatedCompletion),
              onChainAddress: cp.publicKey,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );
        } catch (syncErr) {
          console.warn(`[auto-sync] Failed to sync ${cp.projectId}:`, syncErr.message);
        }
      }
    }

    // 4. Apply filters
    let projects = Array.from(mergedMap.values());
    if (province) projects = projects.filter(p => p.province === province);
    if (district) projects = projects.filter(p => p.district === district);
    if (sector) projects = projects.filter(p => p.sector === sector);
    if (status) projects = projects.filter(p => p.status === status);

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

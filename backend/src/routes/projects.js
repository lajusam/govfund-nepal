const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const {
    fetchAllProjectsFromChain,
    fetchProjectFromChain,
    fetchMilestonesFromChain,
    fetchDocumentsFromChain,
} = require('../services/solana');

/**
 * READ-ONLY routes for the public.
 * Strategy:
 *   1. Try to fetch from Solana (source of truth)
 *   2. Fall back to MongoDB cache if Solana RPC is slow or unavailable
 *   3. Merge off-chain metadata (description, fund release history) from MongoDB
 */

// GET all projects — merges on-chain + MongoDB (so both seeded and new projects appear)
router.get('/', async (req, res) => {
    try {
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

        // 3. Build a merged list — chain data overrides MongoDB for matching projectIds,
        //    MongoDB-only projects (seeded ones not on-chain) are kept as-is.
        const mergedMap = new Map();

        // Start with all MongoDB projects
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
                pda: mp.onChainAddress || '',
                onChain: false,
            });
        }

        // Override / add with on-chain data (source of truth for financials)
        for (const cp of chainProjects) {
            const existing = mergedMap.get(cp.projectId);
            mergedMap.set(cp.projectId, {
                ...cp,
                pda: cp.publicKey,
                description: existing?.description || '',
                milestones: existing?.milestones || [],
                documents: existing?.documents || [],
                fundReleases: existing?.fundReleases || [],
                budgetAllocations: existing?.budgetAllocations || [],
                solanaExplorerUrl: existing?.solanaExplorerUrl || '',
                onChain: true,
            });

            // Auto-sync: if this on-chain project isn't in MongoDB yet, insert it
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
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    console.log(`[auto-sync] Synced on-chain project to MongoDB: ${cp.projectId}`);
                } catch (syncErr) {
                    console.warn(`[auto-sync] Failed to sync ${cp.projectId}:`, syncErr.message);
                }
            }
        }

        // 4. Convert map to array and apply filters
        let projects = Array.from(mergedMap.values());
        if (province) projects = projects.filter(p => p.province === province);
        if (district) projects = projects.filter(p => p.district === district);
        if (sector) projects = projects.filter(p => p.sector === sector);
        if (status) projects = projects.filter(p => p.status === status);

        res.json(projects);
    } catch (err) {
        console.error('[projects] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// ── Dashboard analytics endpoints ─────────────────────────────────────────

// GET /api/projects/stats — total / active / delayed / completed counts
router.get('/stats', async (req, res) => {
    try {
        const [total, active, delayed, completed] = await Promise.all([
            Project.countDocuments(),
            Project.countDocuments({ status: 'Active' }),
            Project.countDocuments({ status: 'Delayed' }),
            Project.countDocuments({ status: 'Completed' }),
        ]);
        res.json({ total, active, delayed, completed });
    } catch (err) {
        console.error('[projects/stats] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch project stats' });
    }
});

// GET /api/projects/by-province — project count per province
router.get('/by-province', async (req, res) => {
    try {
        const result = await Project.aggregate([
            { $group: { _id: '$province', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { province: '$_id', count: 1, _id: 0 } },
        ]);
        res.json(result);
    } catch (err) {
        console.error('[projects/by-province] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch province stats' });
    }
});

// GET /api/projects/by-sector — project count per sector
router.get('/by-sector', async (req, res) => {
    try {
        const result = await Project.aggregate([
            { $group: { _id: '$sector', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { sector: '$_id', count: 1, _id: 0 } },
        ]);
        res.json(result);
    } catch (err) {
        console.error('[projects/by-sector] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch sector stats' });
    }
});

// GET /api/projects/milestones-summary — milestone progress per active project
router.get('/milestones-summary', async (req, res) => {
    try {
        const projects = await Project.find({ status: 'Active' })
            .select('projectId name province milestoneCount milestonesCompleted')
            .sort({ name: 1 })
            .lean();

        const summary = projects.map(p => ({
            projectId: p.projectId,
            name: p.name,
            province: p.province,
            totalMilestones: p.milestoneCount || 0,
            completedMilestones: p.milestonesCompleted || 0,
            progress: p.milestoneCount > 0
                ? Math.round((p.milestonesCompleted / p.milestoneCount) * 100)
                : 0,
        }));
        res.json(summary);
    } catch (err) {
        console.error('[projects/milestones-summary] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch milestones summary' });
    }
});

// GET /api/projects/recent-releases — latest 8 fund releases across all projects
router.get('/recent-releases', async (req, res) => {
    try {
        const result = await Project.aggregate([
            { $unwind: '$fundReleases' },
            { $sort: { 'fundReleases.date': -1 } },
            { $limit: 8 },
            {
                $project: {
                    projectName: '$name',
                    province: '$province',
                    amount: '$fundReleases.amount',
                    date: '$fundReleases.date',
                    description: '$fundReleases.description',
                },
            },
        ]);
        res.json(result);
    } catch (err) {
        console.error('[projects/recent-releases] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch recent releases' });
    }
});

// GET /api/projects/recently-updated — last 4 updated projects
router.get('/recently-updated', async (req, res) => {
    try {
        const projects = await Project.find()
            .sort({ updatedAt: -1 })
            .limit(4)
            .select('projectId name province sector status totalBudget updatedAt')
            .lean();
        res.json(projects);
    } catch (err) {
        console.error('[projects/recently-updated] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch recently updated projects' });
    }
});

// GET single project by projectId - blockchain first
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Try blockchain
        let chainProject = null;
        try {
            chainProject = await fetchProjectFromChain(projectId);
        } catch (err) {
            console.warn(`Solana fetch failed for ${projectId}:`, err.message);
        }

        // Get MongoDB cache for off-chain data
        const cached = await Project.findOne({ projectId }).lean();

        if (chainProject) {
            // Merge blockchain data (source of truth) with off-chain metadata
            return res.json({
                ...chainProject,
                pda: chainProject.publicKey,
                description: cached?.description || '',
                milestones: cached?.milestones || [],
                documents: cached?.documents || [],
                fundReleases: cached?.fundReleases || [],
                budgetAllocations: cached?.budgetAllocations || [],
                solanaExplorerUrl: cached?.solanaExplorerUrl || '',
            });
        }

        // Fallback to cached data
        if (cached) return res.json({ ...cached, pda: cached.onChainAddress || '' });

        res.status(404).json({ error: 'Project not found on-chain or in cache' });
    } catch (err) {
        console.error('[projects] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// GET project milestones
router.get('/:projectId/milestones', async (req, res) => {
    try {
        const { projectId } = req.params;

        // Try chain first
        let chainProject = null;
        try {
            chainProject = await fetchProjectFromChain(projectId);
        } catch {}

        if (chainProject) {
            const milestones = await fetchMilestonesFromChain(projectId, chainProject.milestoneCount);
            if (milestones.length > 0) return res.json(milestones);
        }

        // Fallback to MongoDB
        const cached = await Project.findOne({ projectId });
        res.json(cached?.milestones || []);
    } catch (err) {
        console.error('[projects] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch milestones' });
    }
});

// GET project documents
router.get('/:projectId/documents', async (req, res) => {
    try {
        const { projectId } = req.params;

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
        console.error('[projects] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// GET fund release history (off-chain only - tracked in MongoDB)
router.get('/:projectId/releases', async (req, res) => {
    try {
        const project = await Project.findOne({ projectId: req.params.projectId });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project.fundReleases || []);
    } catch (err) {
        console.error('[projects] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch releases' });
    }
});

module.exports = router;

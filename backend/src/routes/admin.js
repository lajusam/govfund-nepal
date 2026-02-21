const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { verifyAdmin } = require('../middleware/auth');
const {
    fetchProjectFromChain,
    fetchAllProjectsFromChain,
    getProjectPDA,
    getAccountExplorerUrl,
    getExplorerUrl,
    getConnection,
    ADMIN_WALLET,
} = require('../services/solana');

/**
 * ARCHITECTURE:
 * 1. Frontend (Admin) connects Phantom wallet → builds Anchor tx → Phantom signs → sends to Solana
 * 2. Frontend sends { txSignature, projectId, ... } to this backend
 * 3. Backend verifies the tx landed on-chain by fetching the project account
 * 4. Backend caches the on-chain data into MongoDB for fast reads
 *
 * The blockchain is the SINGLE SOURCE OF TRUTH.
 * MongoDB is a read-only cache populated after on-chain confirmation.
 */

// POST: Sync a newly created project from chain → MongoDB
// Called by frontend AFTER the on-chain createProject tx succeeds
router.post('/projects/sync', verifyAdmin, async (req, res) => {
    try {
        const { projectId, txSignature, description } = req.body;

        if (!projectId) {
            return res.status(400).json({ error: 'projectId is required' });
        }

        // Fetch the project from Solana to verify it exists on-chain
        const onChainProject = await fetchProjectFromChain(projectId);
        if (!onChainProject) {
            return res.status(404).json({ error: 'Project not found on-chain. Ensure the transaction was confirmed.' });
        }

        // Upsert into MongoDB as a cached copy
        const project = await Project.findOneAndUpdate(
            { projectId },
            {
                projectId: onChainProject.projectId,
                name: onChainProject.name,
                province: onChainProject.province,
                district: onChainProject.district,
                sector: onChainProject.sector,
                contractor: onChainProject.contractor,
                totalBudget: onChainProject.totalBudget,
                allocatedBudget: onChainProject.allocatedBudget,
                releasedAmount: onChainProject.releasedAmount,
                status: onChainProject.status,
                milestoneCount: onChainProject.milestoneCount,
                milestonesCompleted: onChainProject.milestonesCompleted,
                adminWallet: onChainProject.admin,
                estimatedCompletion: new Date(onChainProject.estimatedCompletion),
                onChainAddress: onChainProject.publicKey,
                solanaExplorerUrl: getAccountExplorerUrl(onChainProject.publicKey),
                description: description || '',
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Record the creation tx if provided
        if (txSignature) {
            project.budgetAllocations = project.budgetAllocations || [];
        }
        await project.save();

        res.status(201).json({
            message: 'Project synced from blockchain',
            project,
            onChain: onChainProject,
            explorerUrl: txSignature ? getExplorerUrl(txSignature) : null,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Sync budget allocation from chain → MongoDB
router.post('/projects/:projectId/sync-allocate', verifyAdmin, async (req, res) => {
    try {
        const { txSignature, amount, description } = req.body;
        const { projectId } = req.params;

        const onChainProject = await fetchProjectFromChain(projectId);
        if (!onChainProject) {
            return res.status(404).json({ error: 'Project not found on-chain' });
        }

        // Update MongoDB cache with on-chain values (source of truth)
        const project = await Project.findOneAndUpdate(
            { projectId },
            {
                allocatedBudget: onChainProject.allocatedBudget,
                $push: {
                    budgetAllocations: {
                        amount: amount || 0,
                        date: new Date(),
                        txSignature: txSignature || '',
                        description: description || `Budget allocation synced from chain`,
                    },
                },
            },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found in cache. Run /sync first.' });
        }

        res.json({
            message: 'Budget allocation synced from blockchain',
            project,
            onChain: onChainProject,
            explorerUrl: txSignature ? getExplorerUrl(txSignature) : null,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Sync fund release from chain → MongoDB
router.post('/projects/:projectId/sync-release', verifyAdmin, async (req, res) => {
    try {
        const { txSignature, amount, description } = req.body;
        const { projectId } = req.params;

        const onChainProject = await fetchProjectFromChain(projectId);
        if (!onChainProject) {
            return res.status(404).json({ error: 'Project not found on-chain' });
        }

        const project = await Project.findOneAndUpdate(
            { projectId },
            {
                releasedAmount: onChainProject.releasedAmount,
                $push: {
                    fundReleases: {
                        amount: amount || 0,
                        date: new Date(),
                        txSignature: txSignature || '',
                        description: description || `Fund release synced from chain`,
                    },
                },
            },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found in cache. Run /sync first.' });
        }

        res.json({
            message: 'Fund release synced from blockchain',
            project,
            onChain: onChainProject,
            explorerUrl: txSignature ? getExplorerUrl(txSignature) : null,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Sync milestone update from chain → MongoDB
router.post('/projects/:projectId/sync-milestone', verifyAdmin, async (req, res) => {
    try {
        const { txSignature, index, title, description, status } = req.body;
        const { projectId } = req.params;

        const onChainProject = await fetchProjectFromChain(projectId);
        if (!onChainProject) {
            return res.status(404).json({ error: 'Project not found on-chain' });
        }

        const project = await Project.findOne({ projectId });
        if (!project) {
            return res.status(404).json({ error: 'Project not found in cache. Run /sync first.' });
        }

        // Update milestones array
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
});

// POST: Sync document record from chain → MongoDB
router.post('/projects/:projectId/sync-document', verifyAdmin, async (req, res) => {
    try {
        const { txSignature, ipfsHash, name } = req.body;
        const { projectId } = req.params;

        const onChainProject = await fetchProjectFromChain(projectId);
        if (!onChainProject) {
            return res.status(404).json({ error: 'Project not found on-chain' });
        }

        const project = await Project.findOneAndUpdate(
            { projectId },
            {
                $push: {
                    documents: {
                        ipfsHash: ipfsHash || '',
                        name: name || 'Unnamed document',
                        uploadedAt: new Date(),
                        onChainIndex: onChainProject.documentCount - 1,
                    },
                },
            },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found in cache. Run /sync first.' });
        }

        res.json({
            message: 'Document synced from blockchain',
            project,
            onChain: onChainProject,
            explorerUrl: txSignature ? getExplorerUrl(txSignature) : null,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Sync project close from chain → MongoDB
router.post('/projects/:projectId/sync-close', verifyAdmin, async (req, res) => {
    try {
        const { txSignature } = req.body;
        const { projectId } = req.params;

        const onChainProject = await fetchProjectFromChain(projectId);
        if (!onChainProject) {
            return res.status(404).json({ error: 'Project not found on-chain' });
        }

        const project = await Project.findOneAndUpdate(
            { projectId },
            { status: onChainProject.status },
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found in cache' });
        }

        res.json({
            message: 'Project close synced from blockchain',
            project,
            onChain: onChainProject,
            explorerUrl: txSignature ? getExplorerUrl(txSignature) : null,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Full sync - re-fetch ALL projects from chain and update MongoDB cache
router.get('/sync-all', verifyAdmin, async (req, res) => {
    try {
        const onChainProjects = await fetchAllProjectsFromChain();
        let synced = 0;

        for (const p of onChainProjects) {
            await Project.findOneAndUpdate(
                { projectId: p.projectId },
                {
                    projectId: p.projectId,
                    name: p.name,
                    province: p.province,
                    district: p.district,
                    sector: p.sector,
                    contractor: p.contractor,
                    totalBudget: p.totalBudget,
                    allocatedBudget: p.allocatedBudget,
                    releasedAmount: p.releasedAmount,
                    status: p.status,
                    milestoneCount: p.milestoneCount,
                    milestonesCompleted: p.milestonesCompleted,
                    adminWallet: p.admin,
                    estimatedCompletion: new Date(p.estimatedCompletion),
                    onChainAddress: p.publicKey,
                    solanaExplorerUrl: getAccountExplorerUrl(p.publicKey),
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            synced++;
        }

        res.json({ message: `Synced ${synced} projects from blockchain`, count: synced });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Admin config (public - returns admin wallet + program ID for frontend)
router.get('/config', (req, res) => {
    res.json({
        adminWallet: ADMIN_WALLET,
        programId: require('../services/solana').PROGRAM_ID,
        rpcUrl: require('../services/solana').RPC_URL,
        network: 'devnet',
    });
});

module.exports = router;

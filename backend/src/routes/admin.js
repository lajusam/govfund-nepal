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
// Accepts full project data as fallback in case chain fetch fails (devnet RPC rate limits)
router.post('/projects/sync', verifyAdmin, async (req, res) => {
    try {
        const {
            projectId, txSignature, description,
            // Fallback fields sent by frontend (used if chain fetch fails)
            name, province, district, sector, contractor,
            totalBudget, milestoneCount, estimatedCompletion,
        } = req.body;

        if (!projectId) {
            return res.status(400).json({ error: 'projectId is required' });
        }

        // Try to fetch from Solana with retries (devnet can be slow)
        let onChainProject = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            onChainProject = await fetchProjectFromChain(projectId);
            if (onChainProject) break;
            if (attempt < 2) await new Promise(r => setTimeout(r, 2500));
        }

        // Compute PDA for explorer URL even without chain data
        const [pda] = getProjectPDA(projectId);
        const pdaBase58 = pda.toBase58();

        // Build upsert data: prefer on-chain values, fallback to frontend-provided data
        const upsertData = onChainProject
            ? {
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
            }
            : {
                // Fallback: use frontend-provided data so project is always persisted
                projectId,
                name: name || projectId,
                province: province || '',
                district: district || '',
                sector: sector || '',
                contractor: contractor || '',
                totalBudget: totalBudget ? Number(totalBudget) : 0,
                allocatedBudget: 0,
                releasedAmount: 0,
                status: 'Active',
                milestoneCount: milestoneCount ? Number(milestoneCount) : 1,
                milestonesCompleted: 0,
                adminWallet: req.walletAddress || ADMIN_WALLET,
                estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : new Date(),
                onChainAddress: pdaBase58,
                solanaExplorerUrl: getAccountExplorerUrl(pdaBase58),
                description: description || '',
            };

        const project = await Project.findOneAndUpdate(
            { projectId },
            upsertData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (txSignature) {
            project.budgetAllocations = project.budgetAllocations || [];
        }
        await project.save();

        console.log(`[sync] Project ${projectId} synced (source: ${onChainProject ? 'chain' : 'frontend fallback'})`);

        res.status(201).json({
            message: onChainProject
                ? 'Project synced from blockchain'
                : 'Project cached from frontend data (chain confirmation pending)',
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

        // Try chain fetch but don't fail if unavailable
        let onChainProject = null;
        try {
            onChainProject = await fetchProjectFromChain(projectId);
        } catch (err) {
            console.warn(`[sync-allocate] Chain fetch failed for ${projectId}:`, err.message);
        }

        // Build update: prefer chain data, fallback to increment with frontend amount
        const updateOps = {
            $push: {
                budgetAllocations: {
                    amount: amount ? Number(amount) : 0,
                    date: new Date(),
                    txSignature: txSignature || '',
                    description: description || 'Budget allocation synced from chain',
                },
            },
        };

        if (onChainProject) {
            // Chain data is source of truth
            updateOps.allocatedBudget = onChainProject.allocatedBudget;
            updateOps.releasedAmount = onChainProject.releasedAmount;
            updateOps.status = onChainProject.status;
        } else if (amount) {
            // Fallback: increment by the amount the frontend reported
            updateOps.$inc = { allocatedBudget: Number(amount) };
        }

        // $inc and top-level field can't coexist on same field, handle separately
        let project;
        if (updateOps.$inc) {
            const { $push, $inc } = updateOps;
            project = await Project.findOneAndUpdate(
                { projectId },
                { $push, $inc },
                { new: true }
            );
        } else {
            const { $push, ...setFields } = updateOps;
            project = await Project.findOneAndUpdate(
                { projectId },
                { ...setFields, $push },
                { new: true }
            );
        }

        if (!project) {
            return res.status(404).json({ error: 'Project not found in cache. Run /sync first.' });
        }

        console.log(`[sync-allocate] ${projectId}: allocated=${project.allocatedBudget} (source: ${onChainProject ? 'chain' : 'fallback'})`);

        res.json({
            message: 'Budget allocation synced',
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

        // Try chain fetch but don't fail if unavailable
        let onChainProject = null;
        try {
            onChainProject = await fetchProjectFromChain(projectId);
        } catch (err) {
            console.warn(`[sync-release] Chain fetch failed for ${projectId}:`, err.message);
        }

        const updateOps = {
            $push: {
                fundReleases: {
                    amount: amount ? Number(amount) : 0,
                    date: new Date(),
                    txSignature: txSignature || '',
                    description: description || 'Fund release synced from chain',
                },
            },
        };

        if (onChainProject) {
            updateOps.releasedAmount = onChainProject.releasedAmount;
            updateOps.allocatedBudget = onChainProject.allocatedBudget;
            updateOps.status = onChainProject.status;
        } else if (amount) {
            updateOps.$inc = { releasedAmount: Number(amount) };
        }

        let project;
        if (updateOps.$inc) {
            const { $push, $inc } = updateOps;
            project = await Project.findOneAndUpdate(
                { projectId },
                { $push, $inc },
                { new: true }
            );
        } else {
            const { $push, ...setFields } = updateOps;
            project = await Project.findOneAndUpdate(
                { projectId },
                { ...setFields, $push },
                { new: true }
            );
        }

        if (!project) {
            return res.status(404).json({ error: 'Project not found in cache. Run /sync first.' });
        }

        console.log(`[sync-release] ${projectId}: released=${project.releasedAmount} (source: ${onChainProject ? 'chain' : 'fallback'})`);

        res.json({
            message: 'Fund release synced',
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

        // Try chain fetch but don't block on failure
        let onChainProject = null;
        try {
            onChainProject = await fetchProjectFromChain(projectId);
        } catch (err) {
            console.warn(`[sync-close] Chain fetch failed for ${projectId}:`, err.message);
        }

        // Always update status — if chain says Completed, use that; otherwise
        // the close_project tx succeeded on-chain so status must be Completed
        const newStatus = onChainProject?.status || 'Completed';

        const updateData = { status: newStatus };
        if (onChainProject) {
            updateData.releasedAmount = onChainProject.releasedAmount;
            updateData.allocatedBudget = onChainProject.allocatedBudget;
            updateData.milestonesCompleted = onChainProject.milestonesCompleted;
        }

        const project = await Project.findOneAndUpdate(
            { projectId },
            updateData,
            { new: true }
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found in cache' });
        }

        console.log(`[sync-close] ${projectId}: status=${newStatus} (source: ${onChainProject ? 'chain' : 'fallback'})`);

        res.json({
            message: 'Project close synced',
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

// GET: Admin config (public — safe subset only, no wallet addresses)
// SECURITY FIX: Do NOT expose admin wallet addresses publicly.
// The frontend already knows the program ID and RPC URL from its own env vars.
router.get('/config', (req, res) => {
    const solana = require('../services/solana');
    res.json({
        programId: solana.PROGRAM_ID,
        rpcUrl: solana.RPC_URL,
        network: 'devnet',
    });
});

module.exports = router;

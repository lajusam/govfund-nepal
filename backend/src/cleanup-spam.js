/**
 * cleanup-spam.js — Remove spam / bulk-injected documents from MongoDB.
 *
 * Usage:
 *   node src/cleanup-spam.js                   # Dry-run (shows counts, changes nothing)
 *   node src/cleanup-spam.js --execute          # Actually deletes spam
 *   node src/cleanup-spam.js --execute --days 7 # Delete feedback older than 7 days
 *
 * What it does:
 *   1. Counts all Feedback documents and reports totals.
 *   2. Identifies likely spam:
 *      - Duplicate comments from same IP/wallet in short windows
 *      - Feedback for non-existent projectIds
 *      - Feedback created en masse (> 50 from same wallet in 24h)
 *   3. In --execute mode, removes identified spam and reports results.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Feedback = require('./models/Feedback');
const Project = require('./models/Project');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
}

const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');
const daysIdx = args.indexOf('--days');
const DAYS = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : null;

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ── 1. Overall counts ───────────────────────────────────────────────
    const totalFeedback = await Feedback.countDocuments();
    const totalProjects = await Project.countDocuments();
    console.log(`📊 Total Feedback documents: ${totalFeedback}`);
    console.log(`📊 Total Project documents:  ${totalProjects}\n`);

    // ── 2. Identify orphan feedback (no matching project) ───────────────
    const validProjectIds = (await Project.find().select('projectId').lean()).map(p => p.projectId);
    const orphanFeedback = await Feedback.find({ projectId: { $nin: validProjectIds } }).lean();
    console.log(`🔍 Orphan feedback (no matching project): ${orphanFeedback.length}`);

    // ── 3. Identify bulk submitters (>50 in 24h from same wallet) ───────
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const bulkSubmitters = await Feedback.aggregate([
        { $match: { createdAt: { $gte: oneDayAgo } } },
        { $group: { _id: '$walletAddress', count: { $sum: 1 } } },
        { $match: { count: { $gt: 50 } } },
    ]);
    console.log(`🔍 Bulk submitter wallets (>50 in 24h): ${bulkSubmitters.length}`);
    for (const s of bulkSubmitters) {
        console.log(`   └─ ${s._id}: ${s.count} submissions`);
    }

    // ── 4. Feedback older than --days ───────────────────────────────────
    let oldFeedbackCount = 0;
    if (DAYS) {
        const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
        oldFeedbackCount = await Feedback.countDocuments({ createdAt: { $lt: cutoff } });
        console.log(`🔍 Feedback older than ${DAYS} days: ${oldFeedbackCount}`);
    }

    // ── 5. Duplicate comments (same wallet + same comment text) ─────────
    const duplicates = await Feedback.aggregate([
        { $group: { _id: { wallet: '$walletAddress', comment: '$comment' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
        { $match: { count: { $gt: 3 } } }, // more than 3 identical = spam
    ]);
    const dupIds = duplicates.flatMap(d => d.ids.slice(1)); // keep 1, delete rest
    console.log(`🔍 Duplicate spam entries (>3 identical): ${dupIds.length}`);

    // ── Summary ─────────────────────────────────────────────────────────
    const totalSpam = orphanFeedback.length + dupIds.length;
    console.log(`\n📋 Total identified spam: ${totalSpam}`);

    if (!EXECUTE) {
        console.log('\n⚠️  DRY RUN — no data was modified.');
        console.log('   Run with --execute to delete spam.');
        console.log('   Run with --execute --days 7 to also delete old feedback.');
    } else {
        console.log('\n🗑️  EXECUTING cleanup...');

        // Delete orphans
        if (orphanFeedback.length > 0) {
            const orphanIds = orphanFeedback.map(f => f._id);
            const r1 = await Feedback.deleteMany({ _id: { $in: orphanIds } });
            console.log(`   ✅ Deleted ${r1.deletedCount} orphan feedback entries`);
        }

        // Delete duplicates
        if (dupIds.length > 0) {
            const r2 = await Feedback.deleteMany({ _id: { $in: dupIds } });
            console.log(`   ✅ Deleted ${r2.deletedCount} duplicate spam entries`);
        }

        // Delete bulk submitter entries from last 24h
        for (const s of bulkSubmitters) {
            const r3 = await Feedback.deleteMany({
                walletAddress: s._id,
                createdAt: { $gte: oneDayAgo },
            });
            console.log(`   ✅ Deleted ${r3.deletedCount} entries from bulk submitter ${s._id}`);
        }

        // Delete old feedback if --days specified
        if (DAYS && oldFeedbackCount > 0) {
            const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
            const r4 = await Feedback.deleteMany({ createdAt: { $lt: cutoff } });
            console.log(`   ✅ Deleted ${r4.deletedCount} entries older than ${DAYS} days`);
        }

        const remaining = await Feedback.countDocuments();
        console.log(`\n📊 Remaining feedback: ${remaining} (was ${totalFeedback})`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Done.');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});

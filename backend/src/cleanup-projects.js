/**
 * Cleanup script — removes specific projects from MongoDB by projectId.
 * Usage:  cd backend && node src/cleanup-projects.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file!');
    process.exit(1);
}

// Project IDs to remove (actual MongoDB projectId values)
const PROJECT_IDS_TO_REMOVE = [
    'Bhaktpaur-bridge-123',   // "Bridge-bhpr"
    'Bhaktapur-bridge-123',   // "Bridge-bhkt"
    'Bhaktapur-bridege',      // "bridge"
    'kathmandu-l1234',        // "Bridge"
    'Bhaktapur-education-112',// "Bhk-edu"
    'Udayapur-EDU_123',       // "udayapur-edu-123"
];

async function cleanup() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected');

        // Show what we're about to delete
        const found = await Project.find(
            { projectId: { $in: PROJECT_IDS_TO_REMOVE } },
            'projectId name status totalBudget'
        ).lean();

        if (found.length === 0) {
            console.log('⚠️  No matching projects found in MongoDB. Nothing to delete.');
            await mongoose.disconnect();
            return;
        }

        console.log(`\nFound ${found.length} project(s) to remove:`);
        found.forEach(p => {
            console.log(`  • ${p.projectId} — "${p.name}" [${p.status}]`);
        });

        const result = await Project.deleteMany({
            projectId: { $in: PROJECT_IDS_TO_REMOVE },
        });

        console.log(`\n✅ Deleted ${result.deletedCount} project(s) from MongoDB.`);

        // Verify
        const remaining = await Project.countDocuments();
        console.log(`   Remaining projects in DB: ${remaining}`);

        await mongoose.disconnect();
        console.log('Done.');
    } catch (err) {
        console.error('❌ Cleanup error:', err);
        process.exit(1);
    }
}

cleanup();

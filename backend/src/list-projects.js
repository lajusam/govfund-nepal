/**
 * List all projects in MongoDB (projectId, name, status).
 * Usage:  cd backend && node src/list-projects.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file!');
    process.exit(1);
}

async function list() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected\n');

        const projects = await Project.find({}, 'projectId name status totalBudget').lean();

        if (projects.length === 0) {
            console.log('No projects in database.');
        } else {
            console.log(`Total projects: ${projects.length}\n`);
            projects.forEach((p, i) => {
                console.log(`  ${i + 1}. [${p.projectId}] "${p.name}" — ${p.status} — Budget: ${p.totalBudget}`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

list();

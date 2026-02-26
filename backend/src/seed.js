require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const Province = require('./models/Province');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file!');
    console.error('   Please set MONGO_URI in backend/.env');
    console.error('   Example: MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/govfund');
    process.exit(1);
}

const provinces = [
    {
        name: 'Koshi', number: 1,
        districts: [
            { name: 'Morang', sectors: ['Infrastructure', 'Education', 'Healthcare'] },
            { name: 'Sunsari', sectors: ['Agriculture', 'Water Supply'] },
            { name: 'Jhapa', sectors: ['Road Construction', 'Education'] },
        ],
    },
    {
        name: 'Madhesh', number: 2,
        districts: [
            { name: 'Sarlahi', sectors: ['Agriculture', 'Irrigation', 'Healthcare'] },
            { name: 'Dhanusha', sectors: ['Education', 'Road Construction'] },
            { name: 'Parsa', sectors: ['Infrastructure', 'Water Supply'] },
        ],
    },
    {
        name: 'Bagmati', number: 3,
        districts: [
            { name: 'Kathmandu', sectors: ['Road Construction', 'Infrastructure', 'Education'] },
            { name: 'Lalitpur', sectors: ['Healthcare', 'Water Supply'] },
            { name: 'Sindhupalchok', sectors: ['Reconstruction', 'Infrastructure'] },
        ],
    },
    {
        name: 'Gandaki', number: 4,
        districts: [
            { name: 'Kaski', sectors: ['Healthcare', 'Tourism', 'Road Construction'] },
            { name: 'Tanahun', sectors: ['Agriculture', 'Education'] },
            { name: 'Gorkha', sectors: ['Reconstruction', 'Water Supply'] },
        ],
    },
    {
        name: 'Lumbini', number: 5,
        districts: [
            { name: 'Rupandehi', sectors: ['Education', 'Infrastructure', 'Healthcare'] },
            { name: 'Kapilvastu', sectors: ['Agriculture', 'Road Construction'] },
            { name: 'Dang', sectors: ['Water Supply', 'Irrigation'] },
        ],
    },
    {
        name: 'Karnali', number: 6,
        districts: [
            { name: 'Jumla', sectors: ['Water Supply', 'Education', 'Healthcare'] },
            { name: 'Surkhet', sectors: ['Road Construction', 'Infrastructure'] },
            { name: 'Dailekh', sectors: ['Agriculture', 'Irrigation'] },
        ],
    },
    {
        name: 'Sudurpashchim', number: 7,
        districts: [
            { name: 'Kailali', sectors: ['Infrastructure', 'Education', 'Agriculture'] },
            { name: 'Kanchanpur', sectors: ['Road Construction', 'Healthcare'] },
            { name: 'Doti', sectors: ['Water Supply', 'Reconstruction'] },
        ],
    },
];

const projects = [
    {
        projectId: 'kathmandu-road-001',
        name: 'Kathmandu Ring Road Expansion',
        province: 'Bagmati',
        district: 'Kathmandu',
        sector: 'Road Construction',
        contractor: 'Nepal Infrastructure Pvt Ltd',
        totalBudget: 500000000,
        allocatedBudget: 350000000,
        releasedAmount: 180000000,
        status: 'Active',
        milestoneCount: 6,
        milestonesCompleted: 3,
        adminWallet: 'DemoAdminWalletAddress11111111111111111111',
        estimatedCompletion: new Date('2027-06-15'),
        description: 'Major expansion of the Kathmandu Ring Road to 6 lanes with modern drainage and pedestrian walkways. This project aims to reduce traffic congestion in the capital city by 40% and improve road safety standards.',
        milestones: [
            { index: 0, title: 'Site Survey & Land Acquisition', description: 'Complete topographical survey and land acquisition process', status: 'Completed', updatedAt: new Date('2025-03-15') },
            { index: 1, title: 'Foundation & Drainage', description: 'Sub-grade preparation and drainage system installation', status: 'Completed', updatedAt: new Date('2025-08-20') },
            { index: 2, title: 'Base Layer Construction', description: 'Aggregate base course and compaction', status: 'Completed', updatedAt: new Date('2026-01-10') },
            { index: 3, title: 'Asphalt Paving', description: 'Hot mix asphalt paving for all 6 lanes', status: 'InProgress', updatedAt: new Date('2026-02-01') },
            { index: 4, title: 'Pedestrian Infrastructure', description: 'Sidewalks, crosswalks, and street lighting', status: 'Pending', updatedAt: new Date() },
            { index: 5, title: 'Final Inspection & Handover', description: 'Quality inspection and project handover', status: 'Pending', updatedAt: new Date() },
        ],
        documents: [
            { ipfsHash: 'QmXqwRofNB2ny2RNjVbAuAZqoEJhLiNdM5Rciz6Zo5Bd3D', name: 'Project Blueprint v1.0', uploadedAt: new Date('2025-01-10'), onChainIndex: 0 },
            { ipfsHash: 'QmeqY9QGHmMjqYAtpS538KqwWaN8UQq8uVXdqMJMY5WeMj', name: 'Environmental Impact Assessment', uploadedAt: new Date('2025-02-20'), onChainIndex: 1 },
            { ipfsHash: 'QmR8LamA6hYCjhHoTzPUTXRXewUAmnLGFCJT1juHMYqZJQ', name: 'Q3 2025 Progress Report', uploadedAt: new Date('2025-10-01'), onChainIndex: 2 },
        ],
        fundReleases: [
            { amount: 50000000, date: new Date('2025-02-15'), txSignature: '5xGk...demo1', description: 'Initial mobilization advance' },
            { amount: 60000000, date: new Date('2025-06-20'), txSignature: '4yHl...demo2', description: 'Foundation completion payment' },
            { amount: 70000000, date: new Date('2025-12-10'), txSignature: '3zIm...demo3', description: 'Base layer payment' },
        ],
        budgetAllocations: [
            { amount: 150000000, date: new Date('2025-01-05'), txSignature: '2aJn...demo4', description: 'FY 2025 Phase 1 allocation' },
            { amount: 200000000, date: new Date('2025-07-01'), txSignature: '1bKo...demo5', description: 'FY 2025 Phase 2 allocation' },
        ],
    },
    {
        projectId: 'pokhara-hospital-002',
        name: 'Pokhara Regional Hospital Development',
        province: 'Gandaki',
        district: 'Kaski',
        sector: 'Healthcare',
        contractor: 'MedBuild Nepal Construction',
        totalBudget: 800000000,
        allocatedBudget: 500000000,
        releasedAmount: 280000000,
        status: 'Active',
        milestoneCount: 5,
        milestonesCompleted: 2,
        adminWallet: 'DemoAdminWalletAddress11111111111111111111',
        estimatedCompletion: new Date('2028-03-30'),
        description: 'Construction of a modern 500-bed regional hospital with trauma center, ICU, and specialized departments. Aims to provide tertiary healthcare services in the western region.',
        milestones: [
            { index: 0, title: 'Site Preparation & Foundation', description: 'Land clearing, deep foundation for 8-story building', status: 'Completed', updatedAt: new Date('2025-06-15') },
            { index: 1, title: 'Structural Framework', description: 'RCC framework for all floors', status: 'Completed', updatedAt: new Date('2025-12-20') },
            { index: 2, title: 'Interior & Electrical', description: 'Interior finishing and electrical systems', status: 'InProgress', updatedAt: new Date('2026-01-15') },
            { index: 3, title: 'Medical Equipment Installation', description: 'Installation and calibration of medical equipment', status: 'Pending', updatedAt: new Date() },
            { index: 4, title: 'Testing & Commissioning', description: 'System testing and hospital commissioning', status: 'Pending', updatedAt: new Date() },
        ],
        documents: [
            { ipfsHash: 'QmUTaq3mzZvsvdaZdah3ykp2b6i6pKaTLk4ak1mX9Wn6wc', name: 'Hospital Design Plans', uploadedAt: new Date('2025-01-15'), onChainIndex: 0 },
            { ipfsHash: 'QmPcgEAv5iFLz7fbGSPdq8CUGJ7Z3e46uoDtJQDyjTTCqs', name: 'Medical Equipment Tender', uploadedAt: new Date('2025-05-10'), onChainIndex: 1 },
        ],
        fundReleases: [
            { amount: 100000000, date: new Date('2025-03-01'), txSignature: '7cLp...demo6', description: 'Foundation phase payment' },
            { amount: 100000000, date: new Date('2025-09-15'), txSignature: '6dMq...demo7', description: 'Structural phase payment' },
            { amount: 80000000, date: new Date('2026-01-20'), txSignature: '5eNr...demo8', description: 'Interior work advance' },
        ],
        budgetAllocations: [
            { amount: 300000000, date: new Date('2025-01-10'), txSignature: '4fOs...demo9', description: 'FY 2025 allocation' },
            { amount: 200000000, date: new Date('2025-08-01'), txSignature: '3gPt...demo10', description: 'Supplementary allocation' },
        ],
    },
    {
        projectId: 'terai-irrigation-003',
        name: 'Terai Irrigation Canal System',
        province: 'Madhesh',
        district: 'Sarlahi',
        sector: 'Agriculture',
        contractor: 'AgroWater Engineering Nepal',
        totalBudget: 200000000,
        allocatedBudget: 180000000,
        releasedAmount: 140000000,
        status: 'Active',
        milestoneCount: 4,
        milestonesCompleted: 3,
        adminWallet: 'DemoAdminWalletAddress11111111111111111111',
        estimatedCompletion: new Date('2026-09-30'),
        description: 'Construction of a 45km irrigation canal network covering 12,000 hectares of agricultural land in the Terai plains. Includes pump stations and distribution channels.',
        milestones: [
            { index: 0, title: 'Canal Route Survey', description: 'GPS survey and route finalization', status: 'Completed', updatedAt: new Date('2025-02-28') },
            { index: 1, title: 'Main Canal Construction', description: '25km primary canal with concrete lining', status: 'Completed', updatedAt: new Date('2025-08-15') },
            { index: 2, title: 'Distribution Network', description: '20km branch canals and field channels', status: 'Completed', updatedAt: new Date('2026-01-20') },
            { index: 3, title: 'Pump Stations & Testing', description: '3 pump stations and full system testing', status: 'InProgress', updatedAt: new Date('2026-02-01') },
        ],
        documents: [
            { ipfsHash: 'QmdLyrFDYXq58174bttBtHufUXEgDWyxSzn1FygNCKgtuc', name: 'Irrigation Master Plan', uploadedAt: new Date('2025-01-05'), onChainIndex: 0 },
        ],
        fundReleases: [
            { amount: 30000000, date: new Date('2025-03-10'), txSignature: '2hQu...demo11', description: 'Survey and mobilization' },
            { amount: 60000000, date: new Date('2025-07-01'), txSignature: '1iRv...demo12', description: 'Main canal Phase 1' },
            { amount: 50000000, date: new Date('2025-12-15'), txSignature: '0jSw...demo13', description: 'Distribution network' },
        ],
        budgetAllocations: [
            { amount: 100000000, date: new Date('2025-01-15'), txSignature: '9kTx...demo14', description: 'Initial allocation' },
            { amount: 80000000, date: new Date('2025-06-01'), txSignature: '8lUy...demo15', description: 'Second phase allocation' },
        ],
    },
    {
        projectId: 'rural-water-004',
        name: 'Rural Drinking Water Supply System',
        province: 'Karnali',
        district: 'Jumla',
        sector: 'Water Supply',
        contractor: 'Highland Water Solutions',
        totalBudget: 120000000,
        allocatedBudget: 100000000,
        releasedAmount: 65000000,
        status: 'Active',
        milestoneCount: 4,
        milestonesCompleted: 2,
        adminWallet: 'DemoAdminWalletAddress11111111111111111111',
        estimatedCompletion: new Date('2027-01-30'),
        description: 'Installation of gravity-fed drinking water system for 15 VDCs in Jumla. Includes intake structures, transmission lines, reservoirs, and distribution to 8,000 households.',
        milestones: [
            { index: 0, title: 'Source Identification & Intake', description: 'Spring source protection and intake construction', status: 'Completed', updatedAt: new Date('2025-05-20') },
            { index: 1, title: 'Transmission Pipeline', description: '18km HDPE pipeline installation', status: 'Completed', updatedAt: new Date('2025-11-30') },
            { index: 2, title: 'Reservoir Construction', description: '5 reinforced concrete reservoirs', status: 'InProgress', updatedAt: new Date('2026-01-10') },
            { index: 3, title: 'Distribution & Tap Stands', description: 'House connections and public tap stands', status: 'Pending', updatedAt: new Date() },
        ],
        documents: [
            { ipfsHash: 'QmNijvuhP2sTxmMkJwR2TpG6Jk2o3qAbAXFpjWs11Mr2d7', name: 'Water Quality Report', uploadedAt: new Date('2025-04-15'), onChainIndex: 0 },
        ],
        fundReleases: [
            { amount: 25000000, date: new Date('2025-04-01'), txSignature: '7mVz...demo16', description: 'Intake construction' },
            { amount: 40000000, date: new Date('2025-10-15'), txSignature: '6nWa...demo17', description: 'Pipeline installation' },
        ],
        budgetAllocations: [
            { amount: 50000000, date: new Date('2025-02-01'), txSignature: '5oXb...demo18', description: 'Phase 1 allocation' },
            { amount: 50000000, date: new Date('2025-09-01'), txSignature: '4pYc...demo19', description: 'Phase 2 allocation' },
        ],
    },
    {
        projectId: 'earthquake-reconstruction-005',
        name: 'Earthquake Housing Reconstruction',
        province: 'Bagmati',
        district: 'Sindhupalchok',
        sector: 'Reconstruction',
        contractor: 'Rebuild Nepal Consortium',
        totalBudget: 350000000,
        allocatedBudget: 300000000,
        releasedAmount: 250000000,
        status: 'Active',
        milestoneCount: 5,
        milestonesCompleted: 4,
        adminWallet: 'DemoAdminWalletAddress11111111111111111111',
        estimatedCompletion: new Date('2026-06-30'),
        description: 'Reconstruction of 2,000 earthquake-resistant houses in Sindhupalchok district. Follows NRA guidelines with seismic-resistant design using local stone and reinforced concrete.',
        milestones: [
            { index: 0, title: 'Beneficiary Survey', description: 'Identification of 2,000 eligible households', status: 'Completed', updatedAt: new Date('2025-02-10') },
            { index: 1, title: 'Phase 1: 500 Houses', description: 'Construction of first batch', status: 'Completed', updatedAt: new Date('2025-06-30') },
            { index: 2, title: 'Phase 2: 800 Houses', description: 'Construction of second batch', status: 'Completed', updatedAt: new Date('2025-11-15') },
            { index: 3, title: 'Phase 3: 700 Houses', description: 'Construction of final batch', status: 'Completed', updatedAt: new Date('2026-01-20') },
            { index: 4, title: 'Quality Audit & Handover', description: 'Structural audit and key handover', status: 'InProgress', updatedAt: new Date('2026-02-01') },
        ],
        documents: [
            { ipfsHash: 'QmXpibZuffCrkemD5LdyRFHKka9aXvmNt7Eyc9JxaowW3K', name: 'NRA Compliance Certificate', uploadedAt: new Date('2025-01-20'), onChainIndex: 0 },
            { ipfsHash: 'QmQkZh3hmMRTvNt19gQCDn8FwQtJaLVbtLMekudU1syRaN', name: 'Phase 3 Completion Report', uploadedAt: new Date('2026-01-25'), onChainIndex: 1 },
        ],
        fundReleases: [
            { amount: 50000000, date: new Date('2025-02-20'), txSignature: '3qZd...demo20', description: 'Survey and design' },
            { amount: 80000000, date: new Date('2025-05-15'), txSignature: '2rAe...demo21', description: 'Phase 1 construction' },
            { amount: 70000000, date: new Date('2025-09-20'), txSignature: '1sBf...demo22', description: 'Phase 2 construction' },
            { amount: 50000000, date: new Date('2026-01-10'), txSignature: '0tCg...demo23', description: 'Phase 3 construction' },
        ],
        budgetAllocations: [
            { amount: 150000000, date: new Date('2025-01-05'), txSignature: '9uDh...demo24', description: 'Initial allocation' },
            { amount: 150000000, date: new Date('2025-07-01'), txSignature: '8vEi...demo25', description: 'Phase 2-3 allocation' },
        ],
    },
    {
        projectId: 'school-infra-006',
        name: 'School Infrastructure Development',
        province: 'Lumbini',
        district: 'Rupandehi',
        sector: 'Education',
        contractor: 'EduBuild Nepal Pvt Ltd',
        totalBudget: 150000000,
        allocatedBudget: 90000000,
        releasedAmount: 45000000,
        status: 'Active',
        milestoneCount: 4,
        milestonesCompleted: 1,
        adminWallet: 'DemoAdminWalletAddress11111111111111111111',
        estimatedCompletion: new Date('2027-12-31'),
        description: 'Construction and renovation of 25 schools in Rupandehi district including classrooms, laboratories, libraries, computer labs, and play grounds following earthquake-resistant building codes.',
        milestones: [
            { index: 0, title: 'Needs Assessment & Design', description: 'Assessment of 25 schools and architectural designs', status: 'Completed', updatedAt: new Date('2025-07-15') },
            { index: 1, title: 'Phase 1: 10 Schools', description: 'Construction of first batch of schools', status: 'InProgress', updatedAt: new Date('2026-01-20') },
            { index: 2, title: 'Phase 2: 15 Schools', description: 'Construction of remaining schools', status: 'Pending', updatedAt: new Date() },
            { index: 3, title: 'Furniture & Equipment', description: 'Desks, lab equipment, computers, library books', status: 'Pending', updatedAt: new Date() },
        ],
        documents: [
            { ipfsHash: 'QmTcap2PFoQzZMzrrbBaNbupcg89dG8AtkkQpJoo6ymyQy', name: 'School Assessment Report', uploadedAt: new Date('2025-06-01'), onChainIndex: 0 },
        ],
        fundReleases: [
            { amount: 15000000, date: new Date('2025-06-15'), txSignature: '7wFj...demo26', description: 'Assessment and design' },
            { amount: 30000000, date: new Date('2025-12-01'), txSignature: '6xGk...demo27', description: 'Phase 1 construction start' },
        ],
        budgetAllocations: [
            { amount: 50000000, date: new Date('2025-05-01'), txSignature: '5yHl...demo28', description: 'FY 2025 allocation' },
            { amount: 40000000, date: new Date('2025-11-01'), txSignature: '4zIm...demo29', description: 'Supplementary allocation' },
        ],
    },
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected successfully');

        // Clear existing data
        await Province.deleteMany({});
        await Project.deleteMany({});

        // Seed provinces
        await Province.insertMany(provinces);
        console.log(`✅ Seeded ${provinces.length} provinces`);

        // Seed projects
        await Project.insertMany(projects);
        console.log(`✅ Seeded ${projects.length} demo projects`);

        console.log('\nDemo Data Summary:');
        console.log('═'.repeat(50));
        projects.forEach(p => {
            const pct = p.allocatedBudget > 0
                ? ((p.releasedAmount / p.allocatedBudget) * 100).toFixed(1)
                : '0.0';
            console.log(`  ${p.name}`);
            console.log(`    Budget: NPR ${(p.totalBudget / 1000000).toFixed(0)}M | Released: ${pct}% | Milestones: ${p.milestonesCompleted}/${p.milestoneCount}`);
        });

        await mongoose.disconnect();
        console.log('\nDone! Database seeded successfully.');
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();

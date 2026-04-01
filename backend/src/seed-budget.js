require('dotenv').config();
const mongoose = require('mongoose');
const NationalBudget = require('./models/NationalBudget');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file!');
    console.error('   Please set MONGO_URI in backend/.env');
    console.error('   Example: MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/govfund');
    process.exit(1);
}

const budgetData = {
    fiscalYear: '2081/82',

    // Total budget split (in billions NPR — stored as raw numbers)
    totalBudget: 1860.33,
    recurrentExpenditure: 1140.66,
    capitalExpenditure: 352.35,
    financialManagement: 367.28,

    // Province-wise federal grants (billions NPR)
    provinceGrants: [
        { name: 'Karnali',        grant: 16.04 },
        { name: 'Sudurpashchim',  grant: 14.20 },
        { name: 'Koshi',          grant: 14.50 },
        { name: 'Lumbini',        grant: 14.01 },
        { name: 'Bagmati',        grant: 13.81 },
        { name: 'Madhesh',        grant: 12.73 },
        { name: 'Gandaki',        grant: 12.23 },
    ],

    // Ministry-wise budget breakdown (billions NPR)
    ministries: [
        { name: 'Finance',                            amount: 222.86, percentage: 11.98 },
        { name: 'Education, Science & Tech',           amount: 203.66, percentage: 10.95 },
        { name: 'Home Affairs',                        amount: 199.24, percentage: 10.71 },
        { name: 'Physical Infrastructure & Transport', amount: 150.53, percentage: 8.09 },
        { name: 'Urban Development',                   amount: 92.63,  percentage: 4.98 },
        { name: 'Energy, Water & Irrigation',          amount: 87.55,  percentage: 4.71 },
        { name: 'Health & Population',                 amount: 86.23,  percentage: 4.64 },
        { name: 'Defense',                             amount: 59.87,  percentage: 3.22 },
        { name: 'Agriculture & Livestock',             amount: 57.29,  percentage: 3.08 },
        { name: 'Others',                              amount: 587.40, percentage: 31.58 },
    ],

    // Budget utilization (allocated vs spent, billions NPR)
    utilization: [
        { category: 'Total',                allocated: 1860.33, spent: 667.62,  percentage: 35.89 },
        { category: 'Recurrent',            allocated: 1140.66, spent: 452.00,  percentage: 39.63 },
        { category: 'Capital',              allocated: 352.35,  spent: 56.94,   percentage: 16.16 },
        { category: 'Financial Management', allocated: 367.28,  spent: 158.66,  percentage: 43.20 },
    ],

    ipfsCid: '',
    ipfsGatewayUrl: '',
};

async function seedBudget() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected');

        // Clear existing budget data
        const deleted = await NationalBudget.deleteMany({});
        console.log(`🗑️  Cleared ${deleted.deletedCount} existing budget record(s)`);

        // Seed new data
        const budget = await NationalBudget.create(budgetData);
        console.log(`✅ National Budget seeded for FY ${budget.fiscalYear}`);
        console.log(`   Total Budget:           ${budget.totalBudget}B NPR`);
        console.log(`   Recurrent Expenditure:  ${budget.recurrentExpenditure}B NPR`);
        console.log(`   Capital Expenditure:    ${budget.capitalExpenditure}B NPR`);
        console.log(`   Financial Management:   ${budget.financialManagement}B NPR`);
        console.log(`   Province Grants:        ${budget.provinceGrants.length} provinces`);
        console.log(`   Ministries:             ${budget.ministries.length} entries`);
        console.log(`   Utilization Records:    ${budget.utilization.length} categories`);

        await mongoose.disconnect();
        console.log('✅ Done — MongoDB disconnected');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seedBudget();

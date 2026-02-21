const { Connection, PublicKey, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, BN } = require('@coral-xyz/anchor');

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.PROGRAM_ID || 'B6CSWaYtxem8bPEHe3CRCZ52n7kuRrZJbqw3dkFhSZAp';
const ADMIN_WALLET = process.env.ADMIN_WALLET || '4MMhsQ2odgEdAowV3Si6L44jRhTZAepuFjPeWGSgA3h2';

// ============================================================
// IDL — Anchor v0.30+ format (with discriminators, writable/signer,
//        pubkey type, and address field).
//        MUST match the on-chain program & the frontend IDL exactly.
// ============================================================
const IDL = {
    address: PROGRAM_ID,
    version: '0.1.0',
    name: 'govfund',
    metadata: { name: 'govfund', version: '0.1.0', spec: '0.1.0' },
    instructions: [
        {
            name: 'createProject',
            discriminator: [148, 219, 181, 42, 221, 114, 145, 190],
            accounts: [
                { name: 'project', writable: true, signer: false },
                { name: 'admin', writable: true, signer: true },
                { name: 'systemProgram', writable: false, signer: false },
            ],
            args: [
                { name: 'projectId', type: 'string' },
                { name: 'name', type: 'string' },
                { name: 'province', type: 'string' },
                { name: 'district', type: 'string' },
                { name: 'sector', type: 'string' },
                { name: 'contractor', type: 'string' },
                { name: 'totalBudget', type: 'u64' },
                { name: 'milestoneCount', type: 'u8' },
                { name: 'estimatedCompletion', type: 'i64' },
            ],
        },
        {
            name: 'allocateBudget',
            discriminator: [100, 146, 10, 221, 164, 188, 142, 19],
            accounts: [
                { name: 'project', writable: true, signer: false },
                { name: 'admin', writable: false, signer: true },
            ],
            args: [{ name: 'amount', type: 'u64' }],
        },
        {
            name: 'releaseFunds',
            discriminator: [225, 88, 91, 108, 126, 52, 2, 26],
            accounts: [
                { name: 'project', writable: true, signer: false },
                { name: 'admin', writable: false, signer: true },
            ],
            args: [{ name: 'amount', type: 'u64' }],
        },
        {
            name: 'recordDocument',
            discriminator: [151, 250, 131, 110, 62, 59, 73, 154],
            accounts: [
                { name: 'document', writable: true, signer: false },
                { name: 'project', writable: true, signer: false },
                { name: 'admin', writable: true, signer: true },
                { name: 'systemProgram', writable: false, signer: false },
            ],
            args: [
                { name: 'ipfsHash', type: 'string' },
                { name: 'documentName', type: 'string' },
            ],
        },
        {
            name: 'updateMilestoneStatus',
            discriminator: [155, 245, 3, 155, 70, 19, 218, 105],
            accounts: [
                { name: 'milestone', writable: true, signer: false },
                { name: 'project', writable: true, signer: false },
                { name: 'admin', writable: true, signer: true },
                { name: 'systemProgram', writable: false, signer: false },
            ],
            args: [
                { name: 'milestoneIndex', type: 'u8' },
                { name: 'description', type: 'string' },
                { name: 'newStatus', type: { defined: { name: 'MilestoneStatus' } } },
            ],
        },
        {
            name: 'closeProject',
            discriminator: [117, 209, 53, 106, 93, 55, 112, 49],
            accounts: [
                { name: 'project', writable: true, signer: false },
                { name: 'admin', writable: false, signer: true },
            ],
            args: [],
        },
    ],
    accounts: [
        { name: 'Project', discriminator: [205, 168, 189, 202, 181, 247, 142, 19] },
        { name: 'Milestone', discriminator: [38, 210, 239, 177, 85, 184, 10, 44] },
        { name: 'DocumentRecord', discriminator: [13, 153, 55, 14, 109, 39, 136, 125] },
    ],
    types: [
        {
            name: 'Project',
            type: {
                kind: 'struct',
                fields: [
                    { name: 'projectId', type: 'string' },
                    { name: 'name', type: 'string' },
                    { name: 'province', type: 'string' },
                    { name: 'district', type: 'string' },
                    { name: 'sector', type: 'string' },
                    { name: 'contractor', type: 'string' },
                    { name: 'totalBudget', type: 'u64' },
                    { name: 'allocatedBudget', type: 'u64' },
                    { name: 'releasedAmount', type: 'u64' },
                    { name: 'status', type: { defined: { name: 'ProjectStatus' } } },
                    { name: 'milestoneCount', type: 'u8' },
                    { name: 'milestonesCompleted', type: 'u8' },
                    { name: 'admin', type: 'pubkey' },
                    { name: 'createdAt', type: 'i64' },
                    { name: 'updatedAt', type: 'i64' },
                    { name: 'estimatedCompletion', type: 'i64' },
                    { name: 'documentCount', type: 'u16' },
                    { name: 'bump', type: 'u8' },
                ],
            },
        },
        {
            name: 'Milestone',
            type: {
                kind: 'struct',
                fields: [
                    { name: 'project', type: 'pubkey' },
                    { name: 'index', type: 'u8' },
                    { name: 'description', type: 'string' },
                    { name: 'status', type: { defined: { name: 'MilestoneStatus' } } },
                    { name: 'updatedAt', type: 'i64' },
                    { name: 'bump', type: 'u8' },
                ],
            },
        },
        {
            name: 'DocumentRecord',
            type: {
                kind: 'struct',
                fields: [
                    { name: 'project', type: 'pubkey' },
                    { name: 'ipfsHash', type: 'string' },
                    { name: 'documentName', type: 'string' },
                    { name: 'uploadedAt', type: 'i64' },
                    { name: 'uploader', type: 'pubkey' },
                    { name: 'index', type: 'u16' },
                    { name: 'bump', type: 'u8' },
                ],
            },
        },
        {
            name: 'ProjectStatus',
            type: {
                kind: 'enum',
                variants: [{ name: 'Active' }, { name: 'Completed' }, { name: 'Suspended' }],
            },
        },
        {
            name: 'MilestoneStatus',
            type: {
                kind: 'enum',
                variants: [
                    { name: 'Pending' },
                    { name: 'InProgress' },
                    { name: 'Completed' },
                    { name: 'Delayed' },
                ],
            },
        },
    ],
    errors: [
        { code: 6000, name: 'StringTooLong', msg: 'String exceeds maximum allowed length' },
        { code: 6001, name: 'InvalidBudget', msg: 'Budget amount must be greater than zero' },
        { code: 6002, name: 'InvalidMilestoneCount', msg: 'Milestone count must be between 1 and 20' },
        { code: 6003, name: 'ProjectNotActive', msg: 'Project is not in Active status' },
        { code: 6004, name: 'ExceedsBudget', msg: 'Amount exceeds total budget' },
        { code: 6005, name: 'ExceedsAllocated', msg: 'Amount exceeds allocated budget' },
        { code: 6006, name: 'Unauthorized', msg: 'Unauthorized: signer is not the project admin' },
        { code: 6007, name: 'InvalidMilestoneIndex', msg: 'Invalid milestone index' },
    ],
};

// ============================================================
// Connection & Program helpers
// ============================================================

function getConnection() {
    return new Connection(RPC_URL, 'confirmed');
}

function getProgramId() {
    return new PublicKey(PROGRAM_ID);
}

function getAdminPublicKey() {
    return new PublicKey(ADMIN_WALLET);
}

/**
 * Read-only Anchor Program instance for fetching on-chain data.
 * Anchor 0.30+ uses 2-arg constructor: new Program(idlWithAddress, provider)
 */
function getReadOnlyProgram() {
    const connection = getConnection();
    const provider = new AnchorProvider(
        connection,
        { publicKey: getAdminPublicKey(), signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs },
        { commitment: 'confirmed' }
    );
    // Anchor 0.30+: IDL must have `address` field, pass only (idl, provider)
    const idlWithAddress = { ...IDL, address: PROGRAM_ID };
    return new Program(idlWithAddress, provider);
}

// ============================================================
// PDA derivation (mirrors seeds in lib.rs)
// ============================================================

function getProjectPDA(projectId) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('project'), Buffer.from(projectId)],
        getProgramId()
    );
}

function getDocumentPDA(projectPubkey, documentIndex) {
    const indexBytes = Buffer.alloc(2);
    indexBytes.writeUInt16LE(documentIndex);
    return PublicKey.findProgramAddressSync(
        [Buffer.from('document'), projectPubkey.toBuffer(), indexBytes],
        getProgramId()
    );
}

function getMilestonePDA(projectPubkey, milestoneIndex) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from('milestone'), projectPubkey.toBuffer(), Buffer.from([milestoneIndex])],
        getProgramId()
    );
}

// ============================================================
// On-chain data fetchers (blockchain = single source of truth)
// ============================================================

function capitalizeStatus(status) {
    // Anchor 0.30+ returns enums as { active: {} } → "active".
    // Capitalize to match the convention used by the frontend/DB ("Active").
    if (!status) return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function parseProjectAccount(publicKey, account) {
    return {
        publicKey: publicKey.toBase58(),
        projectId: account.projectId,
        name: account.name,
        province: account.province,
        district: account.district,
        sector: account.sector,
        contractor: account.contractor,
        totalBudget: account.totalBudget.toNumber(),
        allocatedBudget: account.allocatedBudget.toNumber(),
        releasedAmount: account.releasedAmount.toNumber(),
        status: capitalizeStatus(Object.keys(account.status)[0]),
        milestoneCount: account.milestoneCount,
        milestonesCompleted: account.milestonesCompleted,
        admin: account.admin.toBase58(),
        createdAt: new Date(account.createdAt.toNumber() * 1000).toISOString(),
        updatedAt: new Date(account.updatedAt.toNumber() * 1000).toISOString(),
        estimatedCompletion: new Date(account.estimatedCompletion.toNumber() * 1000).toISOString(),
        documentCount: account.documentCount,
        bump: account.bump,
    };
}

async function fetchProjectFromChain(projectId) {
    try {
        const program = getReadOnlyProgram();
        const [pda] = getProjectPDA(projectId);
        const account = await program.account.project.fetch(pda);
        return parseProjectAccount(pda, account);
    } catch (err) {
        if (err.message?.includes('Account does not exist')) return null;
        console.error(`Error fetching project ${projectId} from chain:`, err.message);
        return null;
    }
}

async function fetchAllProjectsFromChain() {
    try {
        const program = getReadOnlyProgram();
        const accounts = await program.account.project.all();
        return accounts.map(({ publicKey, account }) => parseProjectAccount(publicKey, account));
    } catch (err) {
        console.error('Error fetching all projects from chain:', err.message);
        return [];
    }
}

async function fetchMilestonesFromChain(projectId, milestoneCount) {
    try {
        const program = getReadOnlyProgram();
        const [projectPda] = getProjectPDA(projectId);
        const milestones = [];
        for (let i = 0; i < milestoneCount; i++) {
            try {
                const [pda] = getMilestonePDA(projectPda, i);
                const account = await program.account.milestone.fetch(pda);
                milestones.push({
                    index: account.index,
                    description: account.description,
                    status: Object.keys(account.status)[0],
                    updatedAt: new Date(account.updatedAt.toNumber() * 1000).toISOString(),
                });
            } catch { /* milestone not yet initialized on-chain */ }
        }
        return milestones;
    } catch (err) {
        console.error(`Error fetching milestones for ${projectId}:`, err.message);
        return [];
    }
}

async function fetchDocumentsFromChain(projectId, documentCount) {
    try {
        const program = getReadOnlyProgram();
        const [projectPda] = getProjectPDA(projectId);
        const documents = [];
        for (let i = 0; i < documentCount; i++) {
            try {
                const [pda] = getDocumentPDA(projectPda, i);
                const account = await program.account.documentRecord.fetch(pda);
                documents.push({
                    ipfsHash: account.ipfsHash,
                    documentName: account.documentName,
                    uploadedAt: new Date(account.uploadedAt.toNumber() * 1000).toISOString(),
                    uploader: account.uploader.toBase58(),
                    index: account.index,
                });
            } catch { /* document not found */ }
        }
        return documents;
    } catch (err) {
        console.error(`Error fetching documents for ${projectId}:`, err.message);
        return [];
    }
}

// ============================================================
// Explorer URLs
// ============================================================

function getExplorerUrl(signature, type = 'tx') {
    return `https://explorer.solana.com/${type}/${signature}?cluster=devnet`;
}

function getAccountExplorerUrl(address) {
    return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

module.exports = {
    IDL,
    getConnection,
    getProgramId,
    getAdminPublicKey,
    getReadOnlyProgram,
    getProjectPDA,
    getDocumentPDA,
    getMilestonePDA,
    fetchProjectFromChain,
    fetchAllProjectsFromChain,
    fetchMilestonesFromChain,
    fetchDocumentsFromChain,
    getExplorerUrl,
    getAccountExplorerUrl,
    ADMIN_WALLET,
    PROGRAM_ID,
    RPC_URL,
};

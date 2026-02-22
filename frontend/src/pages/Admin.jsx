import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolana } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { motion, AnimatePresence } from 'framer-motion';
import api, { formatNPR, getExplorerUrl } from '../services/api';
import { PROVINCES, SECTORS, getDistrictsForProvince } from '../data/nepalData';
import useSolanaProgram from '../hooks/useSolanaProgram';
import LanguageToggle from '../components/LanguageToggle';
import { sendTransactionWithRetry, fetchAccountWithRetry, parseTransactionError } from '../utils/transactionRetry';

// ═══════════════════════════════════════════════════════════════
// Solana program ID — MUST be declared before the IDL references it
// ═══════════════════════════════════════════════════════════════
const PROGRAM_ID_STR =
  import.meta.env.VITE_PROGRAM_ID || 'B6CSWaYtxem8bPEHe3CRCZ52n7kuRrZJbqw3dkFhSZAp';

// ═══════════════════════════════════════════════════════════════
// IDL — Anchor v0.30+ format (with discriminators & typed refs)
// Must match on-chain program: blockchain/programs/govfund
// ═══════════════════════════════════════════════════════════════
const IDL = {
  address: PROGRAM_ID_STR,
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

// ═══════════════════════════════════════════════════════════════
// PDA helpers (must mirror on-chain seeds)
// ═══════════════════════════════════════════════════════════════
function getProjectPDA(projectId) {
  const programId = new PublicKey(PROGRAM_ID_STR);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('project'), Buffer.from(projectId)],
    programId
  );
}

function getDocumentPDA(projectPubkey, docIndex) {
  const programId = new PublicKey(PROGRAM_ID_STR);
  // document_count is u16 on-chain → 2 bytes little-endian
  const indexBytes = new Uint8Array(2);
  new DataView(indexBytes.buffer).setUint16(0, docIndex, true);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('document'), projectPubkey.toBuffer(), indexBytes],
    programId
  );
}

function getMilestonePDA(projectPubkey, milestoneIndex) {
  const programId = new PublicKey(PROGRAM_ID_STR);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('milestone'), projectPubkey.toBuffer(), new Uint8Array([milestoneIndex])],
    programId
  );
}

function milestoneStatusToAnchor(status) {
  switch (status) {
    case 'Pending': return { pending: {} };
    case 'InProgress': return { inProgress: {} };
    case 'Completed': return { completed: {} };
    case 'Delayed': return { delayed: {} };
    default: return { pending: {} };
  }
}

// ═══════════════════════════════════════════════════════════════
// Animation variants
// ═══════════════════════════════════════════════════════════════
const pageVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 40 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.9, y: 30, transition: { duration: 0.2 } },
};

// ═══════════════════════════════════════════════════════════════
// Reusable sub-components
// ═══════════════════════════════════════════════════════════════

/** Animated form card wrapper */
function AnimatedCard({ children, className = '' }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`bg-earth rounded-2xl shadow-card border border-earth-border ${className}`}
    >
      {children}
    </motion.div>
  );
}

/** Budget summary panel (right side) */
function BudgetSummaryPanel({ totalBudget, t }) {
  const budgetNum = parseFloat(totalBudget) || 0;

  const items = [
    { label: t('totalBudget'), value: formatNPR(budgetNum), color: 'text-amber-glow', icon: '💰' },
    { label: t('allocatedBudget'), value: formatNPR(0), color: 'text-amber-glow', icon: '📊' },
    { label: t('releasedAmount'), value: formatNPR(0), color: 'text-golden', icon: '💵' },
    { label: t('milestonesCompleted'), value: '0 / 0', color: 'text-bronze-light', icon: '🎯' },
  ];

  return (
    <AnimatedCard className="p-6 sticky top-24">
      <h3 className="font-heading font-bold text-lg text-parchment mb-6 flex items-center gap-2">
        📈 {t('budgetSummary')}
      </h3>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
        {items.map((item, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className="flex items-center justify-between p-3 rounded-xl bg-earth-light"
          >
            <span className="flex items-center gap-2 text-sm text-parchment-muted">
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </span>
            <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
          </motion.div>
        ))}
      </motion.div>
      {budgetNum > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-5 pt-4 border-t border-earth-border"
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-parchment-ghost">{t('utilizationRate')}</span>
            <span className="font-bold text-golden">0%</span>
          </div>
          <div className="w-full h-3 bg-earth-light rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '0%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-golden to-amber-glow rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatedCard>
  );
}

/** Animated success/error message toast */
function StatusMessage({ message, lastTx }) {
  if (!message.text) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
        message.type === 'success'
          ? 'bg-earth text-amber-glow border border-golden/20'
          : 'bg-earth border border-red-500/30 text-red-400'
      }`}
    >
      <span className="text-lg">{message.type === 'success' ? '✅' : '❌'}</span>
      <span className="flex-1">{message.text}</span>
      {message.type === 'success' && lastTx && (
        <a
          href={getExplorerUrl(lastTx)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline hover:no-underline whitespace-nowrap"
        >
          View on Explorer →
        </a>
      )}
    </motion.div>
  );
}

/** Confirmation modal overlay */
function ConfirmModal({ open, title, message, onConfirm, onCancel, t }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={modalOverlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-earth rounded-2xl shadow-basalt-xl p-6 max-w-md w-full border border-earth-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-parchment mb-3">{title}</h3>
            <p className="text-sm text-parchment-muted mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCancel}
                className="px-4 py-2 text-sm rounded-xl border border-earth-border text-parchment-muted hover:bg-earth-light hover:text-amber-glow transition-colors"
              >
                {t('cancel')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-golden to-golden-600 text-basalt font-bold hover:shadow-golden-sm transition-all"
              >
                {t('confirm')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Reusable input field */
function InputField({ label, type = 'text', value, onChange, placeholder, required, disabled, min, max, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-parchment-muted mb-1">{label}</label>}
      <input
        type={type}
        className="input-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
      />
    </div>
  );
}

/** Reusable select field */
function SelectField({ label, value, onChange, required, disabled, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-parchment-muted mb-1">{label}</label>}
      <select
        className="input-field"
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      >
        {children}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Admin Dashboard
// ═══════════════════════════════════════════════════════════════
export default function Admin() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { isAdmin } = useSolana();
  const { t, lang } = useLanguage();

  // Initialize Anchor program via custom hook (only when wallet connected)
  const { program, programReady, programError, programStatus, reinitialize } = useSolanaProgram(IDL, PROGRAM_ID_STR);

  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('govfund-projects') || '[]'); } catch { return []; }
  });
  const [onChainProjects, setOnChainProjects] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    try { return sessionStorage.getItem('govfund-activeTab') || 'create'; } catch { return 'create'; }
  });
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [lastTx, setLastTx] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  // ── Form states with sessionStorage persistence ──
  const persistedForm = (key, defaults) => {
    try {
      const saved = sessionStorage.getItem(`govfund-${key}`);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch { return defaults; }
  };

  const [createForm, setCreateForm] = useState(() =>
    persistedForm('createForm', {
      projectId: '', name: '', province: '', district: '', sector: '',
      contractor: '', totalBudget: '', milestoneCount: 5, estimatedCompletion: '',
      description: '',
    })
  );
  const [allocateForm, setAllocateForm] = useState(() =>
    persistedForm('allocateForm', { projectId: '', amount: '', description: '' })
  );
  const [releaseForm, setReleaseForm] = useState(() =>
    persistedForm('releaseForm', { projectId: '', amount: '', description: '' })
  );
  const [milestoneForm, setMilestoneForm] = useState(() =>
    persistedForm('milestoneForm', { projectId: '', index: 0, description: '', status: 'Pending' })
  );
  const [docForm, setDocForm] = useState(() =>
    persistedForm('docForm', { projectId: '', ipfsHash: '', documentName: '' })
  );
  const [closeForm, setCloseForm] = useState(() =>
    persistedForm('closeForm', { projectId: '' })
  );

  // Persist form state changes to sessionStorage
  useEffect(() => { try { sessionStorage.setItem('govfund-createForm', JSON.stringify(createForm)); } catch {} }, [createForm]);
  useEffect(() => { try { sessionStorage.setItem('govfund-allocateForm', JSON.stringify(allocateForm)); } catch {} }, [allocateForm]);
  useEffect(() => { try { sessionStorage.setItem('govfund-releaseForm', JSON.stringify(releaseForm)); } catch {} }, [releaseForm]);
  useEffect(() => { try { sessionStorage.setItem('govfund-milestoneForm', JSON.stringify(milestoneForm)); } catch {} }, [milestoneForm]);
  useEffect(() => { try { sessionStorage.setItem('govfund-docForm', JSON.stringify(docForm)); } catch {} }, [docForm]);
  useEffect(() => { try { sessionStorage.setItem('govfund-closeForm', JSON.stringify(closeForm)); } catch {} }, [closeForm]);
  useEffect(() => { try { sessionStorage.setItem('govfund-activeTab', activeTab); } catch {} }, [activeTab]);

  // Districts filtered by selected province
  const filteredDistricts = createForm.province
    ? getDistrictsForProvince(createForm.province, 'en')
    : [];

  // ── Fetch projects (chain-first via backend, falls back to MongoDB cache) ──
  const refreshProjects = useCallback(async () => {
    try {
      // Don't force source=cache — let backend try chain first so new on-chain projects appear
      const res = await api.get('/projects');
      const data = res.data || [];
      setProjects(data);
      try { sessionStorage.setItem('govfund-projects', JSON.stringify(data)); } catch {}
    } catch {
      // Keep existing cached data
    }
  }, []);

  // ── Fetch project data directly from on-chain (true persistence) ──
  const fetchOnChainProject = useCallback(async (projectId) => {
    if (!program || !programReady) return null;
    try {
      const [projectPDA] = getProjectPDA(projectId);
      const account = await fetchAccountWithRetry(
        () => program.account.project.fetch(projectPDA),
        2, 1000
      );
      return {
        projectId: account.projectId,
        name: account.name,
        province: account.province,
        district: account.district,
        sector: account.sector,
        contractor: account.contractor,
        totalBudget: account.totalBudget.toNumber(),
        allocatedBudget: account.allocatedBudget.toNumber(),
        releasedAmount: account.releasedAmount.toNumber(),
        status: (() => { const s = Object.keys(account.status)[0]; return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Active'; })(),
        milestoneCount: account.milestoneCount,
        milestonesCompleted: account.milestonesCompleted,
        admin: account.admin.toBase58(),
        createdAt: account.createdAt.toNumber(),
        updatedAt: account.updatedAt.toNumber(),
        estimatedCompletion: account.estimatedCompletion.toNumber(),
        documentCount: account.documentCount,
        pda: projectPDA.toBase58(),
        onChain: true,
      };
    } catch (err) {
      console.warn(`[Admin] Could not fetch on-chain project "${projectId}":`, err.message);
      return null;
    }
  }, [program, programReady]);

  // Refresh on-chain data for known project IDs
  const refreshOnChainData = useCallback(async () => {
    if (!program || !programReady || projects.length === 0) return;
    const results = await Promise.allSettled(
      projects.map((p) => fetchOnChainProject(p.projectId))
    );
    const onChain = results
      .filter((r) => r.status === 'fulfilled' && r.value)
      .map((r) => r.value);
    setOnChainProjects(onChain);
  }, [program, programReady, projects, fetchOnChainProject]);

  useEffect(() => { refreshProjects(); }, [refreshProjects]);
  useEffect(() => { refreshOnChainData(); }, [refreshOnChainData]);

  // Merge backend-cached + on-chain data (on-chain takes precedence for numeric fields)
  const mergedProjects = projects.map((p) => {
    const oc = onChainProjects.find((o) => o.projectId === p.projectId);
    return oc ? { ...p, ...oc } : p;
  });

  // ── Helpers ──
  const showMsg = (text, type, txSig = null) => {
    setMessage({ text, type });
    if (txSig) setLastTx(txSig);
    setTimeout(() => setMessage({ text: '', type: '' }), 10000);
  };

  const requireProgram = () => {
    if (!connected) {
      showMsg(t('connectFirst'), 'error');
      return false;
    }
    if (!programReady || !program) {
      showMsg(programError || t('programNotLoaded'), 'error');
      return false;
    }
    return true;
  };

  // Base helper: delay then call any admin sync endpoint
  const syncAction = async (endpoint, payload) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await api.post(endpoint, payload, {
        headers: { 'x-wallet-address': publicKey.toBase58() },
      });
    } catch (err) {
      console.warn('Backend sync failed (non-fatal):', err.message);
    }
  };

  // Creation sync — upserts the base project record in MongoDB
  const syncProject = async (projectId, txSignature = null, extraData = {}) => {
    await syncAction('/admin/projects/sync', { projectId, txSignature, ...extraData });
  };

  // Operation-specific syncs — push txSignature into the correct sub-array
  const syncAllocate = async (projectId, sig, amount, description) => {
    await syncAction(`/admin/projects/${projectId}/sync-allocate`, {
      txSignature: sig, amount: Number(amount), description: description || '',
    });
  };

  const syncRelease = async (projectId, sig, amount, description) => {
    await syncAction(`/admin/projects/${projectId}/sync-release`, {
      txSignature: sig, amount: Number(amount), description: description || '',
    });
  };

  const syncMilestone = async (projectId, sig, index, description, status) => {
    await syncAction(`/admin/projects/${projectId}/sync-milestone`, {
      txSignature: sig, index, title: `Milestone ${Number(index) + 1}`, description, status,
    });
  };

  const syncDocument = async (projectId, sig, ipfsHash, documentName) => {
    await syncAction(`/admin/projects/${projectId}/sync-document`, {
      txSignature: sig, ipfsHash, name: documentName,
    });
  };

  const syncClose = async (projectId, sig) => {
    await syncAction(`/admin/projects/${projectId}/sync-close`, { txSignature: sig });
  };

  // ═══════════════════════════════════════════════════════════
  // Transaction handlers — all use sendTransactionWithRetry
  // ═══════════════════════════════════════════════════════════

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!requireProgram()) return;

    const { projectId, name, province, district, sector, contractor, totalBudget, milestoneCount, estimatedCompletion, description } = createForm;

    if (!projectId || !name || !province || !district || !sector || !contractor || !totalBudget || !estimatedCompletion) {
      return showMsg(t('fillAllFields'), 'error');
    }

    setLoading(true);
    setRetryCount(0);
    try {
      const [projectPDA] = getProjectPDA(projectId);
      const completionTimestamp = new BN(Math.floor(new Date(estimatedCompletion).getTime() / 1000));

      const tx = await program.methods
        .createProject(
          projectId,
          name,
          province,
          district,
          sector,
          contractor,
          new BN(totalBudget),
          milestoneCount,
          completionTimestamp
        )
        .accounts({
          project: projectPDA,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const sig = await sendTransactionWithRetry({
        transaction: tx,
        connection,
        sendTransaction,
        onRetry: (attempt) => setRetryCount(attempt),
      });

      showMsg(
        `${t('projectCreated')} ${t('txLabel')}: ${sig.slice(0, 16)}...`,
        'success',
        sig
      );

      await syncProject(projectId, sig, { province, district, sector, contractor, estimatedCompletion, description });
      await refreshProjects();

      // Clear form + session
      const emptyForm = {
        projectId: '', name: '', province: '', district: '', sector: '',
        contractor: '', totalBudget: '', milestoneCount: 5, estimatedCompletion: '', description: '',
      };
      setCreateForm(emptyForm);
      try { sessionStorage.removeItem('govfund-createForm'); } catch {}
    } catch (err) {
      showMsg(`${t('error')}: ${parseTransactionError(err)}`, 'error');
    } finally {
      setLoading(false);
      setRetryCount(0);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!requireProgram()) return;
    setLoading(true);
    setRetryCount(0);
    try {
      const { projectId, amount } = allocateForm;
      if (!projectId || !amount) return showMsg(t('fillAllFields'), 'error');
      const [projectPDA] = getProjectPDA(projectId);

      // Pre-flight: verify project exists on-chain before building tx
      const accInfo = await connection.getAccountInfo(projectPDA);
      if (!accInfo) {
        return showMsg('Project not found on Solana. Only projects created through this admin panel can be managed on-chain.', 'error');
      }

      const tx = await program.methods
        .allocateBudget(new BN(amount))
        .accounts({ project: projectPDA, admin: publicKey })
        .transaction();

      const sig = await sendTransactionWithRetry({
        transaction: tx,
        connection,
        sendTransaction,
        onRetry: (attempt) => setRetryCount(attempt),
      });

      showMsg(`${t('budgetAllocated')} ${t('txLabel')}: ${sig.slice(0, 16)}...`, 'success', sig);
      await syncAllocate(allocateForm.projectId, sig, allocateForm.amount, allocateForm.description);
      await refreshProjects();
      setAllocateForm({ projectId: '', amount: '', description: '' });
      try { sessionStorage.removeItem('govfund-allocateForm'); } catch {}
    } catch (err) {
      showMsg(`${t('error')}: ${parseTransactionError(err)}`, 'error');
    } finally {
      setLoading(false);
      setRetryCount(0);
    }
  };

  const handleRelease = async (e) => {
    e.preventDefault();
    if (!requireProgram()) return;
    setLoading(true);
    setRetryCount(0);
    try {
      const { projectId, amount } = releaseForm;
      if (!projectId || !amount) return showMsg(t('fillAllFields'), 'error');
      const [projectPDA] = getProjectPDA(projectId);

      // Pre-flight: verify project exists on-chain before building tx
      const accInfo = await connection.getAccountInfo(projectPDA);
      if (!accInfo) {
        return showMsg('Project not found on Solana. Only projects created through this admin panel can be managed on-chain.', 'error');
      }

      const tx = await program.methods
        .releaseFunds(new BN(amount))
        .accounts({ project: projectPDA, admin: publicKey })
        .transaction();

      const sig = await sendTransactionWithRetry({
        transaction: tx,
        connection,
        sendTransaction,
        onRetry: (attempt) => setRetryCount(attempt),
      });

      showMsg(`${t('fundsReleased')} ${t('txLabel')}: ${sig.slice(0, 16)}...`, 'success', sig);
      await syncRelease(releaseForm.projectId, sig, releaseForm.amount, releaseForm.description);
      await refreshProjects();
      setReleaseForm({ projectId: '', amount: '', description: '' });
      try { sessionStorage.removeItem('govfund-releaseForm'); } catch {}
    } catch (err) {
      showMsg(`${t('error')}: ${parseTransactionError(err)}`, 'error');
    } finally {
      setLoading(false);
      setRetryCount(0);
    }
  };

  const handleMilestone = async (e) => {
    e.preventDefault();
    if (!requireProgram()) return;
    setLoading(true);
    setRetryCount(0);
    try {
      const { projectId, index, description, status } = milestoneForm;
      if (!projectId || description === '') return showMsg(t('fillAllFields'), 'error');
      const [projectPDA] = getProjectPDA(projectId);

      // Pre-flight: verify project exists on-chain before building tx
      const accInfo = await connection.getAccountInfo(projectPDA);
      if (!accInfo) {
        return showMsg('Project not found on Solana. Only projects created through this admin panel can be managed on-chain.', 'error');
      }

      const [milestonePDA] = getMilestonePDA(projectPDA, index);

      const tx = await program.methods
        .updateMilestoneStatus(index, description, milestoneStatusToAnchor(status))
        .accounts({
          milestone: milestonePDA,
          project: projectPDA,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const sig = await sendTransactionWithRetry({
        transaction: tx,
        connection,
        sendTransaction,
        onRetry: (attempt) => setRetryCount(attempt),
      });

      showMsg(`${t('milestoneUpdated')} ${t('txLabel')}: ${sig.slice(0, 16)}...`, 'success', sig);
      await syncMilestone(milestoneForm.projectId, sig, milestoneForm.index, milestoneForm.description, milestoneForm.status);
      await refreshProjects();
      setMilestoneForm({ projectId: '', index: 0, description: '', status: 'Pending' });
      try { sessionStorage.removeItem('govfund-milestoneForm'); } catch {}
    } catch (err) {
      showMsg(`${t('error')}: ${parseTransactionError(err)}`, 'error');
    } finally {
      setLoading(false);
      setRetryCount(0);
    }
  };

  const handleDoc = async (e) => {
    e.preventDefault();
    if (!requireProgram()) return;
    setLoading(true);
    setRetryCount(0);
    try {
      const { projectId, ipfsHash, documentName } = docForm;
      if (!projectId || !ipfsHash || !documentName) return showMsg(t('fillAllFields'), 'error');
      const [projectPDA] = getProjectPDA(projectId);

      // Pre-flight: verify project exists on-chain & get document count
      let projectAccount;
      try {
        projectAccount = await fetchAccountWithRetry(
          () => program.account.project.fetch(projectPDA)
        );
      } catch {
        return showMsg('Project not found on Solana. Only projects created through this admin panel can be managed on-chain.', 'error');
      }
      const docIndex = projectAccount.documentCount;
      const [documentPDA] = getDocumentPDA(projectPDA, docIndex);

      const tx = await program.methods
        .recordDocument(ipfsHash, documentName)
        .accounts({
          document: documentPDA,
          project: projectPDA,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const sig = await sendTransactionWithRetry({
        transaction: tx,
        connection,
        sendTransaction,
        onRetry: (attempt) => setRetryCount(attempt),
      });

      showMsg(`${t('documentRecorded')} ${t('txLabel')}: ${sig.slice(0, 16)}...`, 'success', sig);
      await syncDocument(docForm.projectId, sig, docForm.ipfsHash, docForm.documentName);
      await refreshProjects();
      setDocForm({ projectId: '', ipfsHash: '', documentName: '' });
      try { sessionStorage.removeItem('govfund-docForm'); } catch {}
    } catch (err) {
      showMsg(`${t('error')}: ${parseTransactionError(err)}`, 'error');
    } finally {
      setLoading(false);
      setRetryCount(0);
    }
  };

  const handleClose = async (e) => {
    e.preventDefault();
    if (!requireProgram()) return;

    const { projectId } = closeForm;
    setConfirmModal({
      open: true,
      title: t('closeTitle'),
      message: t('closeWarning'),
      onConfirm: async () => {
        setConfirmModal({ open: false });
        setLoading(true);
        setRetryCount(0);
        try {
          const [projectPDA] = getProjectPDA(projectId);

          // Pre-flight: verify project exists on-chain before building tx
          const accInfo = await connection.getAccountInfo(projectPDA);
          if (!accInfo) {
            showMsg('Project not found on Solana. Only projects created through this admin panel can be managed on-chain.', 'error');
            setLoading(false);
            return;
          }

          const tx = await program.methods
            .closeProject()
            .accounts({ project: projectPDA, admin: publicKey })
            .transaction();

          const sig = await sendTransactionWithRetry({
            transaction: tx,
            connection,
            sendTransaction,
            onRetry: (attempt) => setRetryCount(attempt),
          });

          showMsg(`${t('projectClosed')} ${t('txLabel')}: ${sig.slice(0, 16)}...`, 'success', sig);
          await syncClose(projectId, sig);
          await refreshProjects();
          setCloseForm({ projectId: '' });
          try { sessionStorage.removeItem('govfund-closeForm'); } catch {}
        } catch (err) {
          showMsg(`${t('error')}: ${parseTransactionError(err)}`, 'error');
        } finally {
          setLoading(false);
          setRetryCount(0);
        }
      },
    });
  };

  // ═══════════════════════════════════════════════════════════
  // Tab definitions
  // ═══════════════════════════════════════════════════════════
  const tabs = [
    { id: 'create', label: t('tabCreate') },
    { id: 'allocate', label: t('tabAllocate') },
    { id: 'release', label: t('tabRelease') },
    { id: 'milestone', label: t('tabMilestone') },
    { id: 'document', label: t('tabDocument') },
    { id: 'close', label: t('tabClose') },
  ];

  // ═══════════════════════════════════════════════════════════
  // Render: wallet not connected
  // ═══════════════════════════════════════════════════════════
  if (!connected) {
    return (
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="max-w-lg mx-auto px-4 py-20 text-center"
      >
        <AnimatedCard className="p-12">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-6"
          >
            🔐
          </motion.div>
          <h2 className="text-2xl font-heading font-bold text-parchment mb-4">
            {t('accessRequired')}
          </h2>
          <p className="text-parchment-muted mb-8">{t('accessDesc')}</p>
          <WalletMultiButton className="!bg-gradient-to-r !from-golden !to-bronze !text-basalt !font-bold !rounded-xl !h-12 !text-base !mx-auto" />
          <p className="text-xs text-parchment-ghost mt-4">{t('walletNotConnected')}</p>
        </AnimatedCard>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // Render: connected but not admin
  // ═══════════════════════════════════════════════════════════
  if (!isAdmin) {
    return (
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="max-w-lg mx-auto px-4 py-20 text-center"
      >
        <AnimatedCard className="p-12">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-6xl mb-6">⛔</motion.div>
          <h2 className="text-2xl font-heading font-bold text-parchment mb-4">
            {t('unauthorizedTitle')}
          </h2>
          <p className="text-parchment-muted mb-4">
            {t('connectedWallet')}: <span className="font-mono text-xs break-all">{publicKey?.toBase58()}</span>
          </p>
          <p className="text-parchment-muted mb-8">{t('unauthorizedDesc')}</p>
          <WalletMultiButton className="!bg-earth-light !text-parchment-muted !rounded-xl !h-12 !text-base !font-medium !mx-auto" />
        </AnimatedCard>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // Render: Admin Dashboard
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      {/* ── Header ── */}
      <motion.div variants={cardVariants} className="mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <h1 className="section-title text-parchment">{t('adminDashboard')}</h1>
          <LanguageToggle />
        </div>
        <p className="section-subtitle">{t('adminSubtitle')}</p>
        <div className="flex items-center gap-2 text-sm mt-2">
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-2 h-2 rounded-full bg-golden"
          />
          <span className="text-parchment-ghost">{t('connected')}: </span>
          <span className="font-mono text-xs text-parchment-dim">
            {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-6)}
          </span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-golden/10 text-golden border border-golden/25">
            {t('adminBadge')}
          </span>
          {programReady && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-golden/10 text-golden">
              Program Ready
            </span>
          )}
          {programStatus === 'initializing' && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-bronze/10 text-bronze-light animate-pulse">
              Initializing...
            </span>
          )}
          {programStatus === 'verifying' && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-glow/10 text-amber-glow animate-pulse">
              Verifying on-chain...
            </span>
          )}
          {programError && (
            <span className="ml-2 inline-flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-earth border border-red-500/30 text-red-400">
                {t('invalidProgramId')}
              </span>
              <button
                onClick={reinitialize}
                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-golden/10 text-golden hover:bg-golden/20 transition-colors"
              >
                Retry
              </button>
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Status message ── */}
      <AnimatePresence>
        <StatusMessage message={message} lastTx={lastTx} />
      </AnimatePresence>

      {/* ── Retry indicator ── */}
      <AnimatePresence>
        {retryCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 rounded-xl bg-earth border border-golden/20 text-sm text-amber-glow flex items-center gap-2"
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="inline-block w-4 h-4 border-2 border-amber-400/30 border-t-amber-500 rounded-full"
            />
            Retrying transaction (attempt {retryCount})...
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab navigation ── */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            disabled={!programReady && tab.id !== 'create'}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-golden to-golden-600 text-basalt font-bold shadow-golden-sm'
                : 'bg-earth text-parchment-muted hover:bg-earth-light hover:text-amber-glow border border-earth-border'
            } ${!programReady && tab.id !== 'create' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-gradient-to-r from-golden to-golden-600 rounded-xl -z-10"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* ────────────── CREATE PROJECT ────────────── */}
          {activeTab === 'create' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form (left 2 cols) */}
              <div className="lg:col-span-2">
                <AnimatedCard className="p-6">
                  <h3 className="font-heading font-bold text-lg text-parchment mb-6 flex items-center gap-2">
                    📋 {t('createTitle')}
                  </h3>
                  <form onSubmit={handleCreate} className="space-y-4">
                    {/* Row 1: Project ID + Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label={t('projectId')}
                        placeholder={t('projectIdPlaceholder')}
                        value={createForm.projectId}
                        onChange={(e) => setCreateForm((f) => ({ ...f, projectId: e.target.value }))}
                        required
                      />
                      <InputField
                        label={t('projectName')}
                        placeholder={t('projectNamePlaceholder')}
                        value={createForm.name}
                        onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Row 2: Province → District → Sector */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <SelectField
                        label={t('province')}
                        value={createForm.province}
                        onChange={(e) => setCreateForm((f) => ({ ...f, province: e.target.value, district: '' }))}
                        required
                      >
                        <option value="">{t('selectProvince')}</option>
                        {PROVINCES.map((p) => (
                          <option key={p.id} value={p.name}>
                            {lang === 'ne' ? `${p.nameNe} (${p.name})` : p.name}
                          </option>
                        ))}
                      </SelectField>

                      <SelectField
                        label={t('district')}
                        value={createForm.district}
                        onChange={(e) => setCreateForm((f) => ({ ...f, district: e.target.value }))}
                        required
                        disabled={!createForm.province}
                      >
                        <option value="">{t('selectDistrict')}</option>
                        {filteredDistricts.map((d, i) => {
                          const prov = PROVINCES.find((p) => p.name === createForm.province);
                          const nepaliName = prov?.districtsNe?.[i];
                          return (
                            <option key={d} value={d}>
                              {lang === 'ne' && nepaliName ? `${nepaliName} (${d})` : d}
                            </option>
                          );
                        })}
                      </SelectField>

                      <SelectField
                        label={t('sector')}
                        value={createForm.sector}
                        onChange={(e) => setCreateForm((f) => ({ ...f, sector: e.target.value }))}
                        required
                      >
                        <option value="">{t('selectSector')}</option>
                        {SECTORS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {lang === 'ne' ? `${s.labelNe} (${s.label})` : s.label}
                          </option>
                        ))}
                      </SelectField>
                    </div>

                    {/* Row 3: Contractor */}
                    <InputField
                      label={t('contractor')}
                      placeholder={t('contractorPlaceholder')}
                      value={createForm.contractor}
                      onChange={(e) => setCreateForm((f) => ({ ...f, contractor: e.target.value }))}
                      required
                    />

                    {/* Row 4: Budget + Milestones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField
                        label={t('totalBudget')}
                        type="number"
                        placeholder={t('totalBudgetPlaceholder')}
                        value={createForm.totalBudget}
                        onChange={(e) => setCreateForm((f) => ({ ...f, totalBudget: e.target.value }))}
                        required
                        min={1}
                      />
                      <InputField
                        label={t('milestoneCount')}
                        type="number"
                        value={createForm.milestoneCount}
                        onChange={(e) => setCreateForm((f) => ({ ...f, milestoneCount: parseInt(e.target.value) || 1 }))}
                        required
                        min={1}
                        max={20}
                      />
                    </div>

                    {/* Row 5: Estimated Completion */}
                    <InputField
                      label={t('estimatedCompletion')}
                      type="date"
                      value={createForm.estimatedCompletion}
                      onChange={(e) => setCreateForm((f) => ({ ...f, estimatedCompletion: e.target.value }))}
                      required
                    />

                    {/* Row 6: Description (off-chain) */}
                    <div>
                      <label className="block text-xs font-medium text-parchment-muted mb-1">{t('description')}</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        placeholder={t('descriptionPlaceholder')}
                        value={createForm.description}
                        onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>

                    <p className="text-xs text-parchment-ghost">{t('budgetNote')}</p>

                    {/* Submit button */}
                    <motion.button
                      type="submit"
                      disabled={loading || !programReady}
                      whileHover={programReady ? { scale: 1.02, boxShadow: '0 8px 30px rgba(220,38,38,0.3)' } : {}}
                      whileTap={programReady ? { scale: 0.98 } : {}}
                      className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                        programReady
                          ? 'bg-gradient-to-r from-golden to-golden-600 text-basalt hover:shadow-golden-sm cursor-pointer'
                          : 'bg-earth-light text-parchment-ghost cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="inline-block w-4 h-4 border-2 border-basalt/30 border-t-basalt rounded-full"
                          />
                          {retryCount > 0 ? `Retrying (${retryCount})...` : t('submitting')}
                        </span>
                      ) : (
                        t('submit')
                      )}
                    </motion.button>
                  </form>
                </AnimatedCard>
              </div>

              {/* Budget summary (right col) */}
              <div className="lg:col-span-1">
                <BudgetSummaryPanel totalBudget={createForm.totalBudget} t={t} />
              </div>
            </div>
          )}

          {/* ────────────── ALLOCATE BUDGET ────────────── */}
          {activeTab === 'allocate' && (
            <div className="max-w-2xl">
              <AnimatedCard className="p-6">
                <h3 className="font-heading font-bold text-lg text-parchment mb-6 flex items-center gap-2">
                  💵 {t('allocateTitle')}
                </h3>
                <form onSubmit={handleAllocate} className="space-y-4">
                  <SelectField label={t('selectProject')} value={allocateForm.projectId} onChange={(e) => setAllocateForm((f) => ({ ...f, projectId: e.target.value }))} required>
                    <option value="">{t('selectProject')}</option>
                    {mergedProjects.filter((p) => p.status === 'Active').map((p) => (
                      <option key={p.projectId} value={p.projectId}>
                        {p.name} ({formatNPR(p.allocatedBudget || 0)} / {formatNPR(p.totalBudget || 0)})
                      </option>
                    ))}
                  </SelectField>
                  <InputField label={t('amount')} type="number" placeholder={t('amountPlaceholder')} value={allocateForm.amount} onChange={(e) => setAllocateForm((f) => ({ ...f, amount: e.target.value }))} required min={1} />
                  <InputField label={t('noteOffchain')} placeholder={t('noteOffchain')} value={allocateForm.description} onChange={(e) => setAllocateForm((f) => ({ ...f, description: e.target.value }))} />
                  <motion.button type="submit" disabled={loading || !programReady} whileHover={programReady ? { scale: 1.02 } : {}} whileTap={programReady ? { scale: 0.98 } : {}} className={`w-full py-3 rounded-xl font-medium text-sm ${programReady ? 'bg-gradient-to-r from-golden to-golden-600 text-basalt hover:shadow-golden-sm' : 'bg-earth-light text-parchment-ghost cursor-not-allowed'}`}>
                    {loading ? (retryCount > 0 ? `Retrying (${retryCount})...` : t('submitting')) : t('submit')}
                  </motion.button>
                </form>
              </AnimatedCard>
            </div>
          )}

          {/* ────────────── RELEASE FUNDS ────────────── */}
          {activeTab === 'release' && (
            <div className="max-w-2xl">
              <AnimatedCard className="p-6">
                <h3 className="font-heading font-bold text-lg text-parchment mb-6 flex items-center gap-2">
                  📤 {t('releaseTitle')}
                </h3>
                <form onSubmit={handleRelease} className="space-y-4">
                  <SelectField label={t('selectProject')} value={releaseForm.projectId} onChange={(e) => setReleaseForm((f) => ({ ...f, projectId: e.target.value }))} required>
                    <option value="">{t('selectProject')}</option>
                    {mergedProjects.filter((p) => p.status === 'Active').map((p) => (
                      <option key={p.projectId} value={p.projectId}>
                        {p.name} ({formatNPR(p.releasedAmount || 0)} / {formatNPR(p.allocatedBudget || 0)})
                      </option>
                    ))}
                  </SelectField>
                  <InputField label={t('amount')} type="number" placeholder={t('amountPlaceholder')} value={releaseForm.amount} onChange={(e) => setReleaseForm((f) => ({ ...f, amount: e.target.value }))} required min={1} />
                  <InputField label={t('noteOffchain')} placeholder={t('noteOffchain')} value={releaseForm.description} onChange={(e) => setReleaseForm((f) => ({ ...f, description: e.target.value }))} />
                  <motion.button type="submit" disabled={loading || !programReady} whileHover={programReady ? { scale: 1.02 } : {}} whileTap={programReady ? { scale: 0.98 } : {}} className={`w-full py-3 rounded-xl font-medium text-sm ${programReady ? 'bg-gradient-to-r from-golden to-golden-600 text-basalt hover:shadow-golden-sm' : 'bg-earth-light text-parchment-ghost cursor-not-allowed'}`}>
                    {loading ? (retryCount > 0 ? `Retrying (${retryCount})...` : t('submitting')) : t('submit')}
                  </motion.button>
                </form>
              </AnimatedCard>
            </div>
          )}

          {/* ────────────── MILESTONE UPDATE ────────────── */}
          {activeTab === 'milestone' && (
            <div className="max-w-2xl">
              <AnimatedCard className="p-6">
                <h3 className="font-heading font-bold text-lg text-parchment mb-6 flex items-center gap-2">
                  🎯 {t('milestoneTitle')}
                </h3>
                <form onSubmit={handleMilestone} className="space-y-4">
                  <SelectField label={t('selectProject')} value={milestoneForm.projectId} onChange={(e) => setMilestoneForm((f) => ({ ...f, projectId: e.target.value }))} required>
                    <option value="">{t('selectProject')}</option>
                    {mergedProjects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>
                        {p.name} ({p.milestonesCompleted || 0}/{p.milestoneCount || 0})
                      </option>
                    ))}
                  </SelectField>
                  <InputField label={t('milestoneIndex')} type="number" value={milestoneForm.index} onChange={(e) => setMilestoneForm((f) => ({ ...f, index: parseInt(e.target.value) || 0 }))} min={0} required />
                  <div>
                    <label className="block text-xs font-medium text-parchment-muted mb-1">{t('milestoneDesc')}</label>
                    <textarea
                      className="input-field"
                      rows={3}
                      placeholder={t('milestoneDescPlaceholder')}
                      value={milestoneForm.description}
                      onChange={(e) => setMilestoneForm((f) => ({ ...f, description: e.target.value }))}
                      required
                    />
                  </div>
                  <SelectField label={t('milestoneStatus')} value={milestoneForm.status} onChange={(e) => setMilestoneForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="Pending">{t('pending')}</option>
                    <option value="InProgress">{t('inProgress')}</option>
                    <option value="Completed">{t('completed')}</option>
                    <option value="Delayed">{t('delayed')}</option>
                  </SelectField>
                  <motion.button type="submit" disabled={loading || !programReady} whileHover={programReady ? { scale: 1.02 } : {}} whileTap={programReady ? { scale: 0.98 } : {}} className={`w-full py-3 rounded-xl font-medium text-sm ${programReady ? 'bg-gradient-to-r from-golden to-golden-600 text-basalt hover:shadow-golden-sm' : 'bg-earth-light text-parchment-ghost cursor-not-allowed'}`}>
                    {loading ? (retryCount > 0 ? `Retrying (${retryCount})...` : t('submitting')) : t('submit')}
                  </motion.button>
                </form>
              </AnimatedCard>
            </div>
          )}

          {/* ────────────── DOCUMENT RECORD ────────────── */}
          {activeTab === 'document' && (
            <div className="max-w-2xl">
              <AnimatedCard className="p-6">
                <h3 className="font-heading font-bold text-lg text-parchment mb-6 flex items-center gap-2">
                  📄 {t('documentTitle')}
                </h3>
                <form onSubmit={handleDoc} className="space-y-4">
                  <SelectField label={t('selectProject')} value={docForm.projectId} onChange={(e) => setDocForm((f) => ({ ...f, projectId: e.target.value }))} required>
                    <option value="">{t('selectProject')}</option>
                    {mergedProjects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>{p.name}</option>
                    ))}
                  </SelectField>
                  <InputField label={t('ipfsHash')} placeholder={t('ipfsHashPlaceholder')} value={docForm.ipfsHash} onChange={(e) => setDocForm((f) => ({ ...f, ipfsHash: e.target.value }))} required />
                  <InputField label={t('documentName')} placeholder={t('documentNamePlaceholder')} value={docForm.documentName} onChange={(e) => setDocForm((f) => ({ ...f, documentName: e.target.value }))} required />
                  <motion.button type="submit" disabled={loading || !programReady} whileHover={programReady ? { scale: 1.02 } : {}} whileTap={programReady ? { scale: 0.98 } : {}} className={`w-full py-3 rounded-xl font-medium text-sm ${programReady ? 'bg-gradient-to-r from-golden to-golden-600 text-basalt hover:shadow-golden-sm' : 'bg-earth-light text-parchment-ghost cursor-not-allowed'}`}>
                    {loading ? (retryCount > 0 ? `Retrying (${retryCount})...` : t('submitting')) : t('submit')}
                  </motion.button>
                </form>
              </AnimatedCard>
            </div>
          )}

          {/* ────────────── CLOSE PROJECT ────────────── */}
          {activeTab === 'close' && (
            <div className="max-w-2xl">
              <AnimatedCard className="p-6">
                <h3 className="font-heading font-bold text-lg text-parchment mb-6 flex items-center gap-2">
                  🔒 {t('closeTitle')}
                </h3>
                <form onSubmit={handleClose} className="space-y-4">
                  <SelectField label={t('selectActiveProject')} value={closeForm.projectId} onChange={(e) => setCloseForm((f) => ({ ...f, projectId: e.target.value }))} required>
                    <option value="">{t('selectActiveProject')}</option>
                    {mergedProjects.filter((p) => p.status === 'Active').map((p) => (
                      <option key={p.projectId} value={p.projectId}>{p.name}</option>
                    ))}
                  </SelectField>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-earth rounded-xl text-sm text-red-400 border border-red-500/30"
                  >
                    {t('closeWarning')}
                  </motion.div>
                  <motion.button type="submit" disabled={loading || !programReady || !closeForm.projectId} whileHover={programReady && closeForm.projectId ? { scale: 1.02 } : {}} whileTap={programReady && closeForm.projectId ? { scale: 0.98 } : {}} className={`w-full py-3 rounded-xl font-medium text-sm ${programReady && closeForm.projectId ? 'bg-gradient-to-r from-red-700 to-red-900 hover:shadow-lg shadow-red-900/40 text-white' : 'bg-earth-light text-parchment-ghost cursor-not-allowed'}`}>
                    {loading ? (retryCount > 0 ? `Retrying (${retryCount})...` : t('submitting')) : t('submit')}
                  </motion.button>
                </form>
              </AnimatedCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Confirmation modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false })}
        t={t}
      />
    </motion.div>
  );
}

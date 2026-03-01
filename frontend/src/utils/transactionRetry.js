import { TransactionExpiredBlockheightExceededError } from '@solana/web3.js';

// ═══════════════════════════════════════════════════════════════
// Anchor GovFund error map — mirrors on-chain GovFundError enum
// ═══════════════════════════════════════════════════════════════
const ANCHOR_ERROR_MAP = {
  6000: 'String exceeds maximum allowed length',
  6001: 'Budget amount must be greater than zero',
  6002: 'Milestone count must be between 1 and 20',
  6003: 'Project is not in Active status — cannot allocate, release, or modify a closed project',
  6004: 'Allocation amount exceeds total project budget',
  6005: 'Release amount exceeds allocated budget',
  6006: 'Unauthorized: your wallet is not the project admin',
  6007: 'Invalid milestone index',
};

// Well-known Solana runtime error messages
const RUNTIME_ERRORS = {
  'AccountNotFound':         'Account not found on-chain — the project may not exist yet',
  'InsufficientFunds':       'Insufficient SOL to pay transaction fees',
  'AccountAlreadyExists':    'This project ID already exists on-chain',
  'InvalidAccountData':      'Account data is corrupted or invalid',
  'AccountDataTooSmall':     'Account size too small — contact the developer',
  'ProgramAccountNotFound':  'The GovFund program is not deployed on this network',
};

/**
 * Send a Solana transaction with:
 *   1. Client-side simulation (extracts program logs BEFORE wallet popup)
 *   2. Wallet signing (Phantom popup — exactly once)
 *   3. Confirmation polling with retry
 *
 * @param {object}   opts
 * @param {object}   opts.transaction      - An unsigned Transaction object
 * @param {object}   opts.connection       - @solana/web3.js Connection
 * @param {Function} opts.sendTransaction  - wallet-adapter sendTransaction
 * @param {string}   [opts.commitment]     - 'confirmed' | 'finalized'
 * @param {number}   [opts.maxRetries]     - confirmation poll retries (default 3)
 * @param {number}   [opts.baseDelayMs]    - initial back-off delay (default 1500)
 * @param {Function} [opts.onRetry]        - callback(attempt, error) on retry
 * @param {boolean}  [opts.skipSimulation] - bypass client-side simulation (default false)
 * @returns {Promise<string>} confirmed signature
 */
export async function sendTransactionWithRetry({
  transaction,
  connection,
  sendTransaction,
  commitment = 'confirmed',
  maxRetries = 3,
  baseDelayMs = 1500,
  onRetry,
  skipSimulation = false,
}) {
  // ── Step 0: Validate inputs ───────────────────────────────────────────────
  if (!transaction) throw new Error('Transaction object is required');
  if (!connection) throw new Error('Solana connection is required');
  if (!sendTransaction) throw new Error('sendTransaction function is required');

  // ── Step 1: Get a fresh blockhash (done ONCE before signing) ──────────────
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(commitment);
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

  // Ensure feePayer is set — required before simulation and signing.
  // wallet-adapter's sendTransaction sets this, but simulation needs it earlier.
  if (!transaction.feePayer) {
    // Attempt to extract from wallet-adapter's internal state
    const signers = transaction.signatures;
    if (signers && signers.length > 0 && signers[0].publicKey) {
      transaction.feePayer = signers[0].publicKey;
    }
  }

  console.log('[sendTransactionWithRetry] Blockhash:', blockhash.slice(0, 16) + '...',
    '| lastValidBlockHeight:', lastValidBlockHeight,
    '| feePayer:', transaction.feePayer?.toBase58()?.slice(0, 8) + '...' || 'not set (wallet will set)');

  // ── Step 2: Client-side simulation — catch program errors BEFORE wallet popup ──
  if (!skipSimulation && transaction.feePayer) {
    try {
      const simResult = await connection.simulateTransaction(transaction, {
        sigVerify: false, // we haven't signed yet
        commitment: 'confirmed',
      });

      if (simResult.value.err) {
        const decoded = decodeSimulationError(simResult.value.err, simResult.value.logs);
        console.error('[simulation] Failed:', decoded, '\nLogs:', simResult.value.logs);
        throw new SimulationError(decoded, simResult.value.logs);
      }

      console.log('[simulation] ✓ Pre-flight passed', {
        unitsConsumed: simResult.value.unitsConsumed,
        logsCount: simResult.value.logs?.length,
      });
    } catch (simErr) {
      if (simErr instanceof SimulationError) throw simErr;
      console.warn('[simulation] Pre-flight simulation failed (non-fatal):', simErr.message);
    }
  } else if (!skipSimulation) {
    console.log('[simulation] Skipped — feePayer not yet set (wallet-adapter will handle preflight)');
  }

  // ── Step 3: Sign + send via wallet adapter — triggers Phantom popup ONCE ──
  let signature;
  try {
    signature = await sendTransaction(transaction, connection, {
      skipPreflight: transaction.feePayer ? true : false,  // only skip if we already simulated
      preflightCommitment: commitment,
      maxRetries: 0,
    });

    // Validate signature format (base58, 87-88 chars)
    if (!signature || typeof signature !== 'string' || signature.length < 80) {
      console.error('[sendTransaction] Invalid signature returned:', signature);
      throw new Error('Wallet returned an invalid transaction signature');
    }

    console.log('[sendTransaction] ✓ Signature:', signature.slice(0, 20) + '...',
      '| Explorer: https://explorer.solana.com/tx/' + signature + '?cluster=devnet');
  } catch (sendErr) {
    const parsed = parseWalletSendError(sendErr);
    throw new Error(parsed);
  }

  // ── Step 4: Poll for confirmation — no wallet interaction from here on ─────
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        commitment,
      );

      if (result.value.err) {
        console.error('[confirmTransaction] On-chain failure:', JSON.stringify(result.value.err));
        throw new Error(
          `Transaction confirmed but failed on-chain: ${JSON.stringify(result.value.err)}`
        );
      }

      console.log('[confirmTransaction] ✓ Confirmed with commitment:', commitment,
        '| Signature:', signature.slice(0, 20) + '...');

      return signature; // success!
    } catch (err) {
      lastError = err;

      // Blockhash expired → transaction is permanently gone from mempool.
      if (
        err instanceof TransactionExpiredBlockheightExceededError ||
        (err?.message || '').includes('block height exceeded') ||
        (err?.message || '').includes('BlockheightExceeded')
      ) {
        console.error('[confirmTransaction] Blockhash expired. Transaction dropped.');
        throw new Error('Transaction expired — the network was congested. Please try submitting again.');
      }

      // Non-retryable on-chain errors (simulation, program errors, etc.)
      if (isNonRetryableError(err)) {
        throw err;
      }

      // Still have retries left → wait and re-poll confirmation
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        if (onRetry) onRetry(attempt + 1, err);
        console.warn(
          `[confirmTransaction] Attempt ${attempt + 1}/${maxRetries} failed: ${err.message}. Re-polling in ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }

  // Last resort: check signature status one final time before giving up
  try {
    const statuses = await connection.getSignatureStatuses([signature]);
    const status = statuses?.value?.[0];
    if (status && !status.err) {
      console.log('[confirmTransaction] ✓ Final status check passed. Confirmed at slot:', status.slot);
      return signature;
    }
    if (status?.err) {
      throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
    }
  } catch (finalErr) {
    if (finalErr.message?.includes('failed on-chain')) throw finalErr;
    console.warn('[confirmTransaction] Final status check failed:', finalErr.message);
  }

  throw lastError || new Error('Transaction confirmation failed after all retries');
}

/**
 * Custom error class for simulation failures — preserves program logs.
 */
class SimulationError extends Error {
  constructor(message, logs = []) {
    super(message);
    this.name = 'SimulationError';
    this.logs = logs;
  }
}

/**
 * Decode a simulation error object + logs into a human-readable message.
 * Handles Anchor custom errors (6xxx) and standard runtime errors.
 */
function decodeSimulationError(errObj, logs = []) {
  // 1. Try Anchor custom error from the InstructionError tuple
  //    Shape: { InstructionError: [instructionIndex, { Custom: errorCode }] }
  if (errObj?.InstructionError) {
    const [, inner] = errObj.InstructionError;
    if (inner?.Custom !== undefined) {
      const code = inner.Custom;
      if (ANCHOR_ERROR_MAP[code]) {
        return ANCHOR_ERROR_MAP[code];
      }
      return `Program error (code ${code})`;
    }
    // Named runtime error (e.g. { InstructionError: [0, "AccountNotFound"] })
    if (typeof inner === 'string' && RUNTIME_ERRORS[inner]) {
      return RUNTIME_ERRORS[inner];
    }
  }

  // 2. Scan program logs for Anchor error messages
  //    Anchor v0.30 logs: "Program log: AnchorError ... Error Code: ProjectNotActive. Error Number: 6003."
  if (logs?.length) {
    for (const line of logs) {
      // Anchor error format
      const anchorMatch = line.match(/Error Number: (\d+)/);
      if (anchorMatch) {
        const code = parseInt(anchorMatch[1], 10);
        if (ANCHOR_ERROR_MAP[code]) return ANCHOR_ERROR_MAP[code];
        return `Program error (code ${code})`;
      }

      // Anchor "Error Message:" format
      const msgMatch = line.match(/Error Message: (.+?)\.?\s*$/);
      if (msgMatch) return msgMatch[1];

      // Generic program failure
      if (line.includes('Program failed to complete')) {
        return 'Transaction failed — the program rejected the instruction. Check project status and amounts.';
      }
    }
  }

  // 3. Fallback
  return `Transaction simulation failed: ${JSON.stringify(errObj)}`;
}

/**
 * Parse a WalletSendTransactionError into something the user can understand.
 * Phantom often wraps errors as "Unexpected error" — we dig into the cause.
 */
function parseWalletSendError(err) {
  const msg = err?.message || String(err);

  // User rejected
  if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('user denied')) {
    return 'Transaction was cancelled by the wallet';
  }

  // Phantom "Unexpected error" — try extracting inner cause
  if (msg.includes('Unexpected error')) {
    // Check for nested error or logs
    const inner = err?.error || err?.cause;
    if (inner) {
      const innerMsg = inner?.message || JSON.stringify(inner);
      // Try to decode if it contains program error info
      const codeMatch = innerMsg.match(/custom program error: 0x([0-9a-fA-F]+)/i);
      if (codeMatch) {
        const code = parseInt(codeMatch[1], 16);
        if (ANCHOR_ERROR_MAP[code]) return ANCHOR_ERROR_MAP[code];
      }
      return innerMsg.length > 200 ? innerMsg.slice(0, 200) + '...' : innerMsg;
    }

    // If we simulated successfully but wallet still failed → likely a signing/network issue
    return 'Wallet encountered an unexpected error. This usually means a network timeout — please try again.';
  }

  // Simulation failed inside wallet preflight
  if (msg.includes('Simulation failed')) {
    const logMatch = msg.match(/Program log: (.+?)(?:\n|$)/);
    if (logMatch) return logMatch[1];

    const codeMatch = msg.match(/custom program error: 0x([0-9a-fA-F]+)/i);
    if (codeMatch) {
      const code = parseInt(codeMatch[1], 16);
      if (ANCHOR_ERROR_MAP[code]) return ANCHOR_ERROR_MAP[code];
    }
  }

  return msg.length > 200 ? msg.slice(0, 200) + '...' : msg;
}

/**
 * Determine if an error should NOT be retried.
 * User rejections, simulation failures, and custom program errors are final.
 */
function isNonRetryableError(err) {
  const msg = (err?.message || '').toLowerCase();

  // Our own SimulationError is always final
  if (err instanceof SimulationError) return true;

  // User rejected in wallet
  if (msg.includes('user rejected') || msg.includes('user denied') || msg.includes('cancelled')) {
    return true;
  }

  // Simulation failure (invalid instruction, wrong accounts, etc.)
  if (msg.includes('simulation failed') || msg.includes('instruction error')) {
    return true;
  }

  // Anchor custom program errors (6xxx)
  if (/custom program error: 0x/.test(msg) || /error code: 6\d{3}/.test(msg)) {
    return true;
  }

  // Insufficient funds / balance
  if (msg.includes('insufficient') || msg.includes('not enough')) {
    return true;
  }

  // Account already exists (PDA collision)
  if (msg.includes('already in use') || msg.includes('account already exists')) {
    return true;
  }

  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch on-chain account data with retry.
 * Useful for reading project/milestone/document PDAs.
 */
export async function fetchAccountWithRetry(fetchFn, maxRetries = 3, baseDelayMs = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await sleep(baseDelayMs * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}

/**
 * Parse any error (transaction, simulation, wallet) into a human-readable message.
 * Handles Anchor codes, simulation logs, wallet rejections, and generic failures.
 */
export function parseTransactionError(err) {
  // SimulationError already has a decoded message
  if (err instanceof SimulationError) {
    return err.message;
  }

  const msg = err?.message || String(err);

  // Try to extract Anchor error code from hex format
  const codeMatch = msg.match(/custom program error: 0x([0-9a-fA-F]+)/);
  if (codeMatch) {
    const code = parseInt(codeMatch[1], 16);
    if (ANCHOR_ERROR_MAP[code]) return ANCHOR_ERROR_MAP[code];
    return `Program error (code ${code})`;
  }

  // Try decimal error code format (Anchor v0.30+)
  const decMatch = msg.match(/Error Number: (\d+)/);
  if (decMatch) {
    const code = parseInt(decMatch[1], 10);
    if (ANCHOR_ERROR_MAP[code]) return ANCHOR_ERROR_MAP[code];
    return `Program error (code ${code})`;
  }

  // InstructionError JSON in message
  const instrMatch = msg.match(/"Custom"\s*:\s*(\d+)/);
  if (instrMatch) {
    const code = parseInt(instrMatch[1], 10);
    if (ANCHOR_ERROR_MAP[code]) return ANCHOR_ERROR_MAP[code];
    return `Program error (code ${code})`;
  }

  // User rejection
  if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('user denied')) {
    return 'Transaction was cancelled by the wallet';
  }

  // Simulation failure
  if (msg.includes('Simulation failed')) {
    const innerMatch = msg.match(/Error Message: (.+?)(\.|$)/);
    if (innerMatch) return innerMatch[1];
    // If Phantom's generic "Simulation failed" with no detail
    return 'Transaction simulation failed — check project status and amounts';
  }

  // Insufficient SOL
  if (msg.toLowerCase().includes('insufficient')) {
    return 'Insufficient SOL balance for transaction fees';
  }

  // Account already exists
  if (msg.includes('already in use')) {
    return 'This project ID already exists on-chain';
  }

  // Blockhash expired
  if (msg.includes('block height exceeded') || err instanceof TransactionExpiredBlockheightExceededError) {
    return 'Transaction expired — please try again';
  }

  // Wallet "Unexpected error"
  if (msg.includes('Unexpected error')) {
    return 'Wallet encountered an unexpected error — please try again. If persists, check project status.';
  }

  // Fallback: truncate long messages
  return msg.length > 200 ? msg.slice(0, 200) + '...' : msg;
}

import { TransactionExpiredBlockheightExceededError } from '@solana/web3.js';

/**
 * Send a Solana transaction with automatic retry + exponential back-off.
 *
 * Flow:
 *   1. Get a fresh blockhash
 *   2. sendTransaction (wallet signs + sends)
 *   3. confirmTransaction
 *   4. On transient failure → wait → retry (up to maxRetries)
 *
 * @param {object}   opts
 * @param {object}   opts.transaction      - An unsigned Transaction object
 * @param {object}   opts.connection       - @solana/web3.js Connection
 * @param {Function} opts.sendTransaction  - wallet-adapter sendTransaction
 * @param {string}   [opts.commitment]     - 'confirmed' | 'finalized'
 * @param {number}   [opts.maxRetries]     - total retry attempts (default 3)
 * @param {number}   [opts.baseDelayMs]    - initial back-off delay (default 1500)
 * @param {Function} [opts.onRetry]        - callback(attempt, error) on retry
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
}) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Refresh blockhash on every attempt so we don't hit expired-blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash(commitment);
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      // Send via wallet adapter (handles signing)
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: commitment,
        maxRetries: 0, // we handle retries ourselves
      });

      // Wait for on-chain confirmation
      const result = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        commitment
      );

      if (result.value.err) {
        throw new Error(
          `Transaction confirmed but failed: ${JSON.stringify(result.value.err)}`
        );
      }

      return signature; // success!
    } catch (err) {
      lastError = err;

      // Non-retryable errors — bail immediately
      if (isNonRetryableError(err)) {
        throw err;
      }

      // If we have retries left, wait and retry
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt); // exponential back-off
        if (onRetry) onRetry(attempt + 1, err);
        console.warn(
          `[sendTransactionWithRetry] Attempt ${attempt + 1}/${maxRetries} failed: ${err.message}. Retrying in ${delay}ms...`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Transaction failed after all retries');
}

/**
 * Determine if an error should NOT be retried.
 * User rejections, simulation failures, and custom program errors are final.
 */
function isNonRetryableError(err) {
  const msg = (err?.message || '').toLowerCase();

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
 * Parse Anchor program errors into human-readable messages.
 */
export function parseTransactionError(err) {
  const msg = err?.message || String(err);

  // Anchor error codes (match the on-chain GovFundError enum)
  const anchorErrors = {
    6000: 'String exceeds maximum allowed length',
    6001: 'Budget amount must be greater than zero',
    6002: 'Milestone count must be between 1 and 20',
    6003: 'Project is not in Active status',
    6004: 'Amount exceeds total budget',
    6005: 'Amount exceeds allocated budget',
    6006: 'Unauthorized: signer is not the project admin',
    6007: 'Invalid milestone index',
  };

  // Try to extract Anchor error code
  const codeMatch = msg.match(/custom program error: 0x([0-9a-fA-F]+)/);
  if (codeMatch) {
    const code = parseInt(codeMatch[1], 16);
    if (anchorErrors[code]) return anchorErrors[code];
    return `Program error (code ${code})`;
  }

  // User rejection
  if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('user denied')) {
    return 'Transaction was rejected by the wallet';
  }

  // Simulation failure
  if (msg.includes('Simulation failed')) {
    const innerMatch = msg.match(/Error Message: (.+?)(\.|$)/);
    if (innerMatch) return innerMatch[1];
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

  // Fallback: truncate long messages
  return msg.length > 200 ? msg.slice(0, 200) + '...' : msg;
}

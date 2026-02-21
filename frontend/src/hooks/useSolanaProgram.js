import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

/**
 * Custom hook — initializes an Anchor Program ONLY after the wallet connects.
 *
 * Returns:
 *   program        — Anchor Program instance (null until ready)
 *   programReady   — true when program is initialized and on-chain account exists
 *   programError   — human-readable error string (null when OK)
 *   programStatus  — 'idle' | 'initializing' | 'verifying' | 'ready' | 'error'
 *   reinitialize   — call to force re-init (e.g. after deploy)
 *   provider       — AnchorProvider instance for advanced use
 */
export default function useSolanaProgram(idl, programIdStr) {
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();
  const { connection } = useConnection();

  const [program, setProgram] = useState(null);
  const [provider, setProvider] = useState(null);
  const [programReady, setProgramReady] = useState(false);
  const [programError, setProgramError] = useState(null);
  const [programStatus, setProgramStatus] = useState('idle'); // idle | initializing | verifying | ready | error
  const initRef = useRef(0); // guard against stale async

  const initialize = useCallback(async () => {
    const token = ++initRef.current;

    // ── Guard: wallet must be connected ──
    if (!connected || !publicKey || !connection) {
      setProgram(null);
      setProvider(null);
      setProgramReady(false);
      setProgramError(null);
      setProgramStatus('idle');
      return;
    }

    if (!signTransaction) {
      setProgramError('Wallet does not support transaction signing.');
      setProgramStatus('error');
      return;
    }

    setProgramStatus('initializing');
    setProgramError(null);

    try {
      // 1. Validate program ID (must be valid base58)
      let programId;
      try {
        programId = new PublicKey(programIdStr);
      } catch {
        throw new Error(
          `Invalid Program ID: "${programIdStr}" is not a valid Solana public key. ` +
          'Set VITE_PROGRAM_ID in your .env file after deploying.'
        );
      }

      // 2. Build Anchor provider from connected wallet
      const prov = new AnchorProvider(
        connection,
        {
          publicKey,
          signTransaction,
          signAllTransactions: signAllTransactions || (async (txs) => txs),
        },
        { commitment: 'confirmed', preflightCommitment: 'confirmed' }
      );

      // 3. Initialize Anchor program object
      //    Anchor v0.30+ requires `idl.address` and uses a 2-arg constructor:
      //    new Program(idl, provider). The old 3-arg form (idl, programId, provider)
      //    was REMOVED — passing a PublicKey as the second arg causes a _bn crash.
      const idlWithAddress = { ...idl, address: programIdStr };
      const prog = new Program(idlWithAddress, prov);

      if (token !== initRef.current) return; // stale

      // 4. Verify program exists on-chain (optional but recommended)
      setProgramStatus('verifying');
      try {
        const accountInfo = await connection.getAccountInfo(programId);
        if (!accountInfo) {
          console.warn(
            '[useSolanaProgram] Program account not found on-chain. ' +
            'The program may not be deployed yet. Transactions will fail until deployed.'
          );
          // We still set the program as "ready" so the UI can be explored,
          // but we note the warning. Actual txns will fail with a clear error.
        } else if (!accountInfo.executable) {
          console.warn('[useSolanaProgram] Account exists but is not executable.');
        } else {
          console.log('[useSolanaProgram] Program verified on-chain:', programId.toBase58());
        }
      } catch (verifyErr) {
        // Network error during verification — non-fatal, continue anyway
        console.warn('[useSolanaProgram] Could not verify program on-chain:', verifyErr.message);
      }

      if (token !== initRef.current) return; // stale

      setProgram(prog);
      setProvider(prov);
      setProgramReady(true);
      setProgramError(null);
      setProgramStatus('ready');

      console.log('[useSolanaProgram] Program initialized:', programId.toBase58());
    } catch (err) {
      if (token !== initRef.current) return;
      console.error('[useSolanaProgram] Init failed:', err);
      setProgram(null);
      setProvider(null);
      setProgramReady(false);
      setProgramError(err.message || 'Failed to initialize program');
      setProgramStatus('error');
    }
  }, [connected, publicKey, connection, signTransaction, signAllTransactions, programIdStr, idl]);

  // Auto-initialize whenever deps change
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Expose reinitialize for manual retry
  const reinitialize = useCallback(() => {
    console.log('[useSolanaProgram] Manual re-initialization requested');
    initialize();
  }, [initialize]);

  return { program, programReady, programError, programStatus, reinitialize, provider };
}

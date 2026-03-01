import React, { useMemo, createContext, useContext } from 'react';
import {
    ConnectionProvider,
    WalletProvider,
    useWallet
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

const NETWORK = 'devnet';
const ADMIN_WALLET =
  import.meta.env.VITE_ADMIN_WALLET || '4MMhsQ2odgEdAowV3Si6L44jRhTZAepuFjPeWGSgA3h2';
const ADMIN_WALLET_2 =
  import.meta.env.VITE_ADMIN_WALLET_2 || '8HACvxLFboKua6ARScPZsqHVCMAQ7MniL8AhNDxomV9Y';
const ADMIN_WALLETS = [ADMIN_WALLET, ADMIN_WALLET_2].filter(Boolean);
const PROGRAM_ID =
  import.meta.env.VITE_PROGRAM_ID || 'B6CSWaYtxem8bPEHe3CRCZ52n7kuRrZJbqw3dkFhSZAp';

const SolanaContext = createContext({
    isAdmin: false,
    adminWallet: ADMIN_WALLET,
    adminWallets: ADMIN_WALLETS,
    programId: PROGRAM_ID,
    network: NETWORK
});

export function useSolana() {
    return useContext(SolanaContext);
}

function SolanaContextProvider({ children }) {
    const { publicKey } = useWallet();

    const isAdmin = useMemo(
        () => publicKey ? ADMIN_WALLETS.includes(publicKey.toBase58()) : false,
        [publicKey]
    );

    const value = useMemo(
        () => ({
            isAdmin,
            adminWallet: ADMIN_WALLET,
            adminWallets: ADMIN_WALLETS,
            programId: PROGRAM_ID,
            network: NETWORK
        }),
        [isAdmin]
    );

    return <SolanaContext.Provider value={value}>{children}</SolanaContext.Provider>;
}

export default function WalletContextProvider({ children }) {
    const endpoint =
        import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(NETWORK);

    const wallets = useMemo(() => [], []); // Phantom auto-detected, remove manual adapter

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <SolanaContextProvider>{children}</SolanaContextProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

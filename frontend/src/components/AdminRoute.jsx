import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSolana } from '../context/WalletContext';
import { useWallet } from '@solana/wallet-adapter-react';

export default function AdminRoute({ children }) {
    const { connected } = useWallet();
    const { isAdmin } = useSolana();

    if (!connected || !isAdmin) {
        return <Navigate to="/home" replace />;
    }

    return children;
}

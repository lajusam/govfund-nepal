import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    plugins: [
        react(),
        nodePolyfills({
            include: ['buffer', 'process', 'util', 'stream', 'events'],
            globals: { Buffer: true, process: true, global: true },
        }),
    ],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    define: {
        'process.env': {},
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    charts: ['chart.js', 'react-chartjs-2'],
                    solana: ['@solana/web3.js', '@coral-xyz/anchor'],
                    wallet: [
                        '@solana/wallet-adapter-base',
                        '@solana/wallet-adapter-react',
                        '@solana/wallet-adapter-react-ui',
                    ],
                },
            },
        },
    },
});

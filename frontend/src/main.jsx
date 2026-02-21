import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App';
import './index.css';

// Polyfills required by @solana/web3.js in the browser
window.Buffer = Buffer;
if (typeof globalThis.global === 'undefined') globalThis.global = globalThis;

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

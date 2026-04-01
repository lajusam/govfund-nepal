# 🇳🇵 GovFund Nepal

**Decentralized Government Fund Transparency Platform**

[![Solana](https://img.shields.io/badge/Solana-Devnet-blue?logo=solana)](https://solana.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A fully transparent, immutable public-spending DApp built on **Solana Devnet** where corruption is technically restricted by smart contract rules. Budget caps, fund releases, and milestones are enforced on-chain — no one can overspend, silently edit, or delete records.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [On-Chain vs Off-Chain](#on-chain-vs-off-chain)
- [Security](#security)
- [Demo Data](#demo-data)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **On-Chain Enforcement** — Budget caps, fund releases, and milestones enforced by Solana smart contract (Anchor/Rust)
- **IPFS Document Storage** — All project documents permanently stored on IPFS via [Pinata](https://www.pinata.cloud/) with multi-gateway fallback
- **Wallet-Based Admin Auth** — Only an authorized Solana wallet can create or modify projects
- **Nepal Province Hierarchy** — Full 7-province, district, and sector modeling
- **Real-Time Analytics** — Dashboard with budget utilization, milestone tracking, and fund release charts
- **Public Feedback** — Citizens can rate and review government projects
- **Bilingual Support** — English and Nepali language toggle
- **Dark / Light Theme** — User-selectable theme

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Blockchain** | Solana Devnet + Anchor (Rust) | Immutable on-chain budget, fund releases, milestones |
| **Backend** | Node.js + Express | REST API, wallet auth, IPFS orchestration, analytics |
| **Frontend** | React 18 + Vite + Tailwind CSS | Responsive SPA with wallet integration |
| **Database** | MongoDB Atlas | Off-chain data (provinces, feedback, analytics) |
| **File Storage** | IPFS via Pinata | Decentralized, tamper-proof document storage |
| **Wallet** | Solana Wallet Adapter | Phantom, Solflare, Backpack support |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                    │
│  Landing │ Dashboard │ Projects │ Detail │ Admin Panel       │
├─────────────────────────────────────────────────────────────┤
│                 Backend (Node.js + Express)                   │
│  REST API │ Wallet Auth │ IPFS/Pinata │ Analytics            │
├──────────────────┬──────────────────┬───────────────────────┤
│  Solana Devnet   │  MongoDB Atlas   │  IPFS (Pinata)        │
│  (Anchor/Rust)   │  (Off-chain DB)  │  (Document Storage)   │
└──────────────────┴──────────────────┴───────────────────────┘
```

### IPFS / Pinata Integration

All project documents (blueprints, reports, certificates, assessments) are stored on **IPFS** via Pinata.

| Flow | Description |
|------|-------------|
| **Upload** | Admin UI → Backend pins to Pinata → CID stored on-chain |
| **Retrieval** | Frontend resolves CID through multiple gateways with automatic fallback |
| **Verification** | Backend verifies gateway accessibility after every pin |
| **Immutability** | Once pinned, documents cannot be altered — the CID is a content hash |

### Nepal Government Hierarchy

```
Government of Nepal
 └── Province (1–7)
      └── District
           └── Sector
                └── Project
                     ├── Budget Allocation
                     ├── Fund Release
                     ├── Milestones
                     ├── Contractor
                     └── Documents (IPFS)
```

---

## Prerequisites

| Requirement | Install |
|-------------|---------|
| Rust & Cargo | https://rustup.rs/ |
| Solana CLI | https://docs.solana.com/cli/install-solana-cli-tools |
| Anchor CLI | `cargo install --git https://github.com/coral-xyz/anchor avm --locked` |
| Node.js 18+ | https://nodejs.org/ |
| MongoDB | Local or [MongoDB Atlas](https://www.mongodb.com/atlas) |
| Pinata Account | Free tier at https://app.pinata.cloud/ |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/govfund-nepal.git
cd govfund-nepal
```

### 2. Deploy the Smart Contract

```bash
cd blockchain
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

### 3. Start the Backend

```bash
cd backend
cp .env.example .env   # Fill in your values (see below)
npm install
npm run seed            # Seed demo data
npm run dev             # http://localhost:5000
```

### 4. Start the Frontend

```bash
cd frontend
cp .env.example .env   # Fill in your values (see below)
npm install
npm run dev             # http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/govfund
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<your_deployed_program_id>
ADMIN_WALLET=<your_admin_wallet_public_key>

# Pinata IPFS (https://app.pinata.cloud/developers/api-keys)
PINATA_API_KEY=<your_pinata_api_key>
PINATA_SECRET_KEY=<your_pinata_secret_key>
PINATA_JWT=<your_pinata_jwt_token>          # Recommended
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_PROGRAM_ID=<your_deployed_program_id>
```

---

## Project Structure

```
govfund-nepal/
├── api/                  # Vercel serverless functions
├── backend/
│   └── src/
│       ├── models/       # Mongoose schemas (Project, Province, Feedback)
│       ├── routes/       # Express routes (projects, admin, IPFS, analytics)
│       ├── middleware/    # Wallet auth middleware
│       ├── services/     # IPFS (Pinata) & Solana service layers
│       ├── seed.js       # Database seeder
│       └── server.js     # Entry point
├── blockchain/
│   └── programs/govfund/
│       └── src/lib.rs    # Anchor smart contract (Rust)
├── frontend/
│   └── src/
│       ├── components/   # Navbar, Footer, ErrorBoundary, etc.
│       ├── context/      # Language, Theme, Wallet providers
│       ├── hooks/        # useIPFS, useSolanaProgram
│       ├── pages/        # Landing, Dashboard, Projects, Admin, etc.
│       ├── services/     # API client
│       └── utils/        # Transaction retry helpers
├── docs/                 # Architecture documentation
└── package.json          # Monorepo root (Vercel)
```

---

## API Reference

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all projects (with filters) |
| `GET` | `/api/projects/:id` | Get project details |
| `POST` | `/api/projects` | Create a project (admin) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/allocate` | Allocate budget to a project |
| `POST` | `/api/admin/release` | Release funds for a project |

### IPFS

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ipfs/upload` | Upload document to IPFS via Pinata (admin) |
| `POST` | `/api/ipfs/verify` | Verify a CID is accessible on gateways |
| `GET` | `/api/ipfs/resolve/:hash` | Resolve fastest gateway URL for a CID |
| `GET` | `/api/ipfs/status` | Check Pinata auth health |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/provinces` | List provinces with districts/sectors |
| `GET` | `/api/analytics` | Aggregated dashboard analytics |
| `POST` | `/api/feedback` | Submit public feedback on a project |

---

## On-Chain vs Off-Chain

| Data | Storage | Reason |
|------|---------|--------|
| Project metadata, budget, releases | Solana (on-chain) | Immutability, transparency |
| IPFS document hashes (CIDs) | Solana (on-chain) | Verifiability — content-addressed |
| Province/district hierarchy | MongoDB (off-chain) | Query flexibility |
| Document files (PDFs, reports) | IPFS via Pinata | Decentralized, tamper-proof |
| Public feedback, analytics | MongoDB (off-chain) | Cost efficiency |

---

## Security

- **Admin-only writes** — Only the authorized wallet can mutate on-chain state
- **Budget enforcement** — Released funds cannot exceed allocated budget (smart contract level)
- **Immutable records** — No deletion or silent edits of projects on-chain
- **Event emission** — All state changes emit verifiable events
- **Wallet signature verification** — Backend validates wallet signatures for admin routes
- **Rate limiting** — All API endpoints are rate-limited

---

## Demo Data

The seeder (`npm run seed`) creates sample projects mapped to real Nepal geography:

| Project | Province | District | Sector |
|---------|----------|----------|--------|
| Kathmandu Ring Road Expansion | Bagmati | Kathmandu | Road Construction |
| Pokhara Regional Hospital | Gandaki | Kaski | Healthcare |
| Terai Irrigation Canal System | Madhesh | Sarlahi | Agriculture |
| Rural Drinking Water Supply | Karnali | Jumla | Water Supply |
| Earthquake Housing Reconstruction | Bagmati | Sindhupalchok | Reconstruction |
| School Infrastructure Development | Lumbini | Rupandehi | Education |

---

## Why Devnet?

This is a demonstration/prototype. Devnet provides free SOL for testing with identical functionality to Mainnet — no real financial risk. The architecture is **Mainnet-ready** with minimal configuration changes (swap RPC URL and cluster).

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).
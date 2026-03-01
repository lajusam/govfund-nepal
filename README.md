# 🇳🇵 GovFund Nepal – Decentralized Government Fund Transparency DApp

A fully transparent, immutable public-spending DApp built on **Solana Devnet** where corruption is technically restricted by system rules.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Solana Devnet + Anchor (Rust) | Immutable on-chain budget, fund releases, milestones |
| **Backend** | Node.js + Express | REST API, wallet auth, IPFS orchestration, analytics |
| **Frontend** | React + Vite + Tailwind CSS | Responsive SPA with wallet integration |
| **Database** | MongoDB Atlas | Off-chain data (provinces, feedback, analytics) |
| **File Storage** | IPFS via Pinata | Decentralized, tamper-proof document storage |
| **Wallet** | Solana Wallet Adapter | Phantom, Solflare, Backpack wallet support |

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

All project documents (blueprints, reports, certificates, assessments) are stored on **IPFS** via [Pinata](https://www.pinata.cloud/) — a production-grade IPFS pinning service.

- **Upload**: Admin uploads documents → Backend pins to Pinata → CID stored on-chain
- **Retrieval**: Frontend resolves CID through multiple gateways with automatic fallback
- **Verification**: Backend verifies gateway accessibility after every pin
- **Immutability**: Once pinned, documents cannot be altered — the CID is a content hash

```
Upload Flow:
  Admin UI → Backend /api/ipfs/upload → Pinata Pin API → IPFS Network
                                              ↓
                                     CID returned (Qm... or bafy...)
                                              ↓
                                     Gateway verification (HEAD check)
                                              ↓
                                     CID stored in MongoDB + on-chain

Retrieval Flow (multi-gateway fallback):
  User clicks doc → Pinata Gateway → ipfs.io → cloudflare-ipfs → dweb.link
```

## Nepal Government Hierarchy Modeled

```
Government of Nepal
 → Province (1–7)
   → District
     → Sector
       → Project
         → Budget Allocation
         → Fund Release
         → Milestones
         → Contractor
         → Documents (IPFS)
```

## Prerequisites

1. **Rust & Cargo** – https://rustup.rs/
2. **Solana CLI** – https://docs.solana.com/cli/install-solana-cli-tools
3. **Anchor CLI** – `cargo install --git https://github.com/coral-xyz/anchor avm --locked`
4. **Node.js 18+** – https://nodejs.org/
5. **MongoDB** – Local or [MongoDB Atlas](https://www.mongodb.com/atlas)
6. **Pinata Account** – Free tier at https://app.pinata.cloud/ (for IPFS document storage)

## Quick Start

### 1. Smart Contract
```bash
cd blockchain
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # Edit with your values
npm install
npm run seed            # Seed demo data
npm run dev             # Starts on port 5000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env   # Edit with your values
npm install
npm run dev             # Starts on port 5173
```

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/govfund
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<your_deployed_program_id>
ADMIN_WALLET=<your_admin_wallet_public_key>

# Pinata IPFS — get free keys at https://app.pinata.cloud/developers/api-keys
# Option 1: API Key + Secret (legacy auth)
PINATA_API_KEY=<your_pinata_api_key>
PINATA_SECRET_KEY=<your_pinata_secret_key>
# Option 2: JWT (recommended, newer Pinata auth)
PINATA_JWT=<your_pinata_jwt_token>
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_PROGRAM_ID=<your_deployed_program_id>
```

## On-Chain vs Off-Chain

| Data | Storage | Reason |
|------|---------|--------|
| Project metadata, budget, releases | Solana (on-chain) | Immutability, transparency |
| Province/district hierarchy | MongoDB (off-chain) | Query flexibility |
| IPFS document hashes (CIDs) | Solana (on-chain) | Verifiability — content-addressed |
| Document files (PDFs, reports) | IPFS via Pinata | Decentralized, tamper-proof, permanent |
| Public feedback, analytics | MongoDB (off-chain) | Cost efficiency |

## API Endpoints

### IPFS Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ipfs/upload` | Upload a document to IPFS via Pinata (admin auth required) |
| `POST` | `/api/ipfs/verify` | Verify an IPFS CID is accessible on public gateways |
| `GET` | `/api/ipfs/resolve/:hash` | Resolve the fastest gateway URL for a CID |
| `GET` | `/api/ipfs/status` | Check Pinata configuration and authentication health |

## Security Model

- Admin wallet is the only signer that can mutate on-chain state
- Released funds cannot exceed allocated budget (enforced on-chain)
- No deletion of projects or silent edits (enforced on-chain)
- All state changes emit events
- Backend validates wallet signatures for admin routes
- Rate limiting on all API endpoints

## Why Devnet?

This is a demonstration/prototype. Devnet provides free SOL for testing and identical functionality to Mainnet without real financial risk. The architecture is designed to be Mainnet-ready with minimal configuration changes.

## Key Features

- **Solana On-Chain Enforcement** — Budget caps, fund releases, and milestones enforced by smart contract
- **IPFS Document Storage (Pinata)** — All project documents permanently stored on IPFS with multi-gateway fallback
- **Wallet-Based Admin Auth** — Only authorized wallet can create/modify projects
- **Nepal Province Hierarchy** — Full 7-province, district, and sector modeling
- **Real-Time Analytics** — Dashboard with budget utilization, milestone tracking, fund release charts
- **Public Feedback** — Citizens can rate and review projects
- **Bilingual Support** — English and Nepali language toggle
- **Dark/Light Theme** — User-selectable theme

## Demo Projects

| Project | Province | District | Sector |
|---------|----------|----------|--------|
| Kathmandu Ring Road Expansion | Bagmati | Kathmandu | Road Construction |
| Pokhara Regional Hospital | Gandaki | Kaski | Healthcare |
| Terai Irrigation Canal System | Madhesh | Sarlahi | Agriculture |
| Rural Drinking Water Supply | Karnali | Jumla | Water Supply |
| Earthquake Housing Reconstruction | Bagmati | Sindhupalchok | Reconstruction |
| School Infrastructure Development | Lumbini | Rupandehi| Education|

## License

MIT
# 🇳🇵 GovFund Nepal – Decentralized Government Fund Transparency DApp

A fully transparent, immutable public-spending DApp built on **Solana Devnet** where corruption is technically restricted by system rules.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                │
│  Landing │ Dashboard │ Projects │ Detail │ Admin Panel   │
├─────────────────────────────────────────────────────────┤
│                 Backend (Node.js + Express)               │
│  REST API │ Wallet Auth │ IPFS Upload │ Analytics        │
├──────────────────┬──────────────────────────────────────┤
│  Solana Devnet   │         MongoDB + IPFS                │
│  (Anchor/Rust)   │     (Off-chain storage)               │
└──────────────────┴──────────────────────────────────────┘
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
```

## Prerequisites

1. **Rust & Cargo** – https://rustup.rs/
2. **Solana CLI** – https://docs.solana.com/cli/install-solana-cli-tools
3. **Anchor CLI** – `cargo install --git https://github.com/coral-xyz/anchor avm --locked`
4. **Node.js 18+** – https://nodejs.org/
5. **MongoDB** – Local or [MongoDB Atlas](https://www.mongodb.com/atlas)

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
PINATA_API_KEY=<your_pinata_key>
PINATA_SECRET_KEY=<your_pinata_secret>
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
| IPFS document hashes | Solana (on-chain) | Verifiability |
| Public feedback, analytics | MongoDB (off-chain) | Cost efficiency |

## Security Model

- Admin wallet is the only signer that can mutate on-chain state
- Released funds cannot exceed allocated budget (enforced on-chain)
- No deletion of projects or silent edits (enforced on-chain)
- All state changes emit events
- Backend validates wallet signatures for admin routes
- Rate limiting on all API endpoints

## Why Devnet?

This is a demonstration/prototype. Devnet provides free SOL for testing and identical functionality to Mainnet without real financial risk. The architecture is designed to be Mainnet-ready with minimal configuration changes.

## Demo Projects

| Project | Province | District | Sector |
|---------|----------|----------|--------|
| Kathmandu Ring Road Expansion | Bagmati | Kathmandu | Road Construction |
| Pokhara Regional Hospital | Gandaki | Kaski | Healthcare |
| Terai Irrigation Canal System | Madhesh | Sarlahi | Agriculture |
| Rural Drinking Water Supply | Karnali | Jumla | Water Supply |
| Earthquake Housing Reconstruction | Bagmati | Sindhupalchok | Reconstruction |
| School Infrastructure Development | Lumbini | Rupandehi | Education |

## License

MIT

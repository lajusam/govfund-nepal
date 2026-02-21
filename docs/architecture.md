# System Architecture

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                     │
│                                                                │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ Landing   │  │ Dashboard │  │ Projects │  │ Admin Panel │ │
│  │ - Hero    │  │ - Charts  │  │ - Filters│  │ - Create    │ │
│  │ - 3D      │  │ - Stats   │  │ - Cards  │  │ - Allocate  │ │
│  │ - Stats   │  │ - Graphs  │  │ - Search │  │ - Release   │ │
│  └──────────┘  └───────────┘  └──────────┘  └─────────────┘ │
│                                                                │
│  Wallet Adapter │ TailwindCSS │ Chart.js │ Three.js           │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│                 BACKEND (Node.js + Express)                     │
│                                                                │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ REST API │  │ Auth      │  │ IPFS     │  │ Solana      │ │
│  │ Routes   │  │ Middleware│  │ Upload   │  │ Service     │ │
│  └──────────┘  └───────────┘  └──────────┘  └─────────────┘ │
│                                                                │
├────────────────────┬─────────────────────────────────────────┤
│   Solana Devnet    │          MongoDB + IPFS (Pinata)         │
│                    │                                           │
│  ┌──────────────┐  │  ┌─────────────┐  ┌──────────────────┐  │
│  │ govfund      │  │  │ Projects    │  │ Pinata Cloud     │  │
│  │ Program      │  │  │ Provinces   │  │ (Document Store) │  │
│  │ (Anchor)     │  │  │ Feedback    │  │                  │  │
│  └──────────────┘  │  └─────────────┘  └──────────────────┘  │
└────────────────────┴─────────────────────────────────────────┘
```

## Data Flow

```
1. Admin connects wallet
      │
      ▼
2. Admin creates project ──► Backend validates ──► On-chain tx (Anchor)
      │                                                │
      ▼                                                ▼
3. MongoDB stores             ◄── Event emitted ──── Solana Devnet
   enriched data                                      (immutable)
      │
      ▼
4. Frontend fetches from Backend API
      │
      ▼
5. Dashboard displays real data with charts
      │
      ▼
6. Citizens view & verify on Solana Explorer
```

## On-Chain vs Off-Chain

### On-Chain (Solana)
- Project ID, name, province, district, sector, contractor
- Total budget, allocated budget, released amount
- Milestone count and completion count
- IPFS document hashes
- Admin wallet address
- Timestamps
- Project status (Active/Completed)
- **Why**: Immutability, transparency, tamper-proof records

### Off-Chain (MongoDB)
- Full project descriptions
- Detailed milestone metadata
- Fund release history with descriptions
- Budget allocation history
- Public feedback and ratings
- Province/district/sector hierarchy
- Analytics aggregations
- **Why**: Query flexibility, cost efficiency, rich metadata

## Nepal Government Mapping

```
Government of Nepal
├── Province 1: Koshi
│   ├── Morang (Infrastructure, Education, Healthcare)
│   ├── Sunsari (Agriculture, Water Supply)
│   └── Jhapa (Road Construction, Education)
├── Province 2: Madhesh
│   ├── Sarlahi (Agriculture, Irrigation, Healthcare)
│   ├── Dhanusha (Education, Road Construction)
│   └── Parsa (Infrastructure, Water Supply)
├── Province 3: Bagmati
│   ├── Kathmandu (Road Construction, Infrastructure, Education)
│   ├── Lalitpur (Healthcare, Water Supply)
│   └── Sindhupalchok (Reconstruction, Infrastructure)
├── Province 4: Gandaki
│   ├── Kaski (Healthcare, Tourism, Road Construction)
│   └── ...
├── Province 5: Lumbini
├── Province 6: Karnali
└── Province 7: Sudurpashchim
```

## Security Model

1. **Admin-only mutations**: Only the registered admin wallet can call write instructions
2. **No over-allocation**: Allocated budget cannot exceed total budget (enforced on-chain)
3. **No over-release**: Released amount cannot exceed allocated budget (enforced on-chain)
4. **No deletion**: Projects cannot be deleted or silently edited
5. **Event trail**: Every mutation emits an event for indexing
6. **Wallet verification**: Backend verifies wallet signatures

## Why Devnet?

- Free SOL for testing (via devnet faucet)
- Identical Solana runtime behavior to Mainnet
- No real financial risk during development
- Easy to migrate to Mainnet by changing cluster config

## Future Mainnet Scalability

1. Change `Anchor.toml` cluster to `mainnet-beta`
2. Deploy with real program keypair
3. Implement proper wallet adapter (Phantom, Solflare)
4. Add compression for large datasets (Merkle trees)
5. Implement caching layer (Redis) for read-heavy queries
6. Add monitoring and alerting (PagerDuty, Sentry)

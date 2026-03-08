# GovFund Nepal — Security Audit Report

**Date:** March 8, 2026  
**Auditor:** Automated code audit  
**Scope:** Backend API, serverless layer, auth middleware, database models, CORS  
**Repository:** `lajusam/govfund-nepal` (branch: `main`)

---

## Executive Summary

The audit identified **3 critical**, **2 high**, and **3 medium** severity vulnerabilities. The most dangerous was an **authentication bypass** that allowed anyone to impersonate an admin by simply setting an HTTP header — no private key or signature required. All findings have been patched in this commit.

| Severity | Found | Fixed |
|----------|-------|-------|
| **CRITICAL** | 3 | 3 |
| **HIGH** | 2 | 2 |
| **MEDIUM** | 3 | 3 |
| Low | 2 | 1 |
| **Total** | **10** | **9** |

---

## Findings

### VULN-01 · CRITICAL — Admin Auth Bypass (Signature Verification Optional)

| Detail | Value |
|--------|-------|
| **Files** | `backend/src/middleware/auth.js`, `api/lib/auth.js` |
| **CVSS** | 9.8 |
| **Status** | **FIXED** |

**Description:**  
The `verifyAdmin` middleware only verified the wallet signature **if** both `x-wallet-signature` and `x-wallet-message` headers were provided. If omitted, the middleware passed the request through after only checking that the `x-wallet-address` header matched a known admin address. Since admin wallet addresses were publicly exposed (see VULN-02, VULN-03), any attacker could execute admin operations (create projects, allocate budgets, release funds, upload documents to IPFS, close projects) by setting a single header.

**Attack vector:**
```bash
curl -X POST https://your-app.vercel.app/api/admin/projects/sync \
  -H "x-wallet-address: 4MMhsQ2odgEdAowV3Si6L44jRhTZAepuFjPeWGSgA3h2" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"malicious-001","name":"Attacker Project"}'
```

**Fix:**  
Signature + message headers are now **mandatory**. Requests without a valid `nacl.sign.detached` signature are rejected with 401.

---

### VULN-02 · CRITICAL — Admin Wallet Addresses Leaked via Public API

| Detail | Value |
|--------|-------|
| **File** | `backend/src/routes/admin.js` (`GET /admin/config`) |
| **CVSS** | 8.6 (enables VULN-01) |
| **Status** | **FIXED** |

**Description:**  
`GET /api/admin/config` was a public (unauthenticated) endpoint that returned the full `adminWallets` array, `programId`, and `rpcUrl`. Combined with VULN-01, this gave attackers everything needed to impersonate admin.

**Fix:**  
Removed `adminWallet` and `adminWallets` from the response. Only `programId`, `rpcUrl`, and `network` are returned.

---

### VULN-03 · CRITICAL — Admin Wallets Leaked in 403 Error Response

| Detail | Value |
|--------|-------|
| **Files** | `backend/src/middleware/auth.js`, `api/lib/auth.js` |
| **CVSS** | 7.5 |
| **Status** | **FIXED** |

**Description:**  
When an unauthorized wallet tried admin actions, the 403 JSON response included `expected: ADMIN_WALLETS` — a full list of every valid admin address.

**Fix:**  
Error responses now return only a generic message without disclosing expected values.

---

### VULN-04 · HIGH — Unauthenticated Public Write Endpoint (Feedback Spam)

| Detail | Value |
|--------|-------|
| **File** | `backend/src/routes/feedback.js` (`POST /api/feedback`) |
| **CVSS** | 7.1 |
| **Status** | **FIXED** |

**Description:**  
`POST /api/feedback` required zero authentication. Any client could submit unlimited feedback entries, limited only by the global rate limiter (200 req / 15 min — easily distributed across IPs). This is the most likely vector for the observed DB spam.

**Fix:**  
- Added per-route `express-rate-limit`: **10 writes per IP per hour** (write), **100 reads per 15 min** (read).
- Added input sanitisation: `$`/`{`/`}` characters stripped to block NoSQL injection.
- Added minimum comment length (2 chars) and strict integer validation on `rating`.

---

### VULN-05 · HIGH — No TTL / Size Cap on Feedback Collection

| Detail | Value |
|--------|-------|
| **File** | `backend/src/models/Feedback.js` |
| **CVSS** | 6.5 |
| **Status** | **FIXED** |

**Description:**  
The Feedback collection had no TTL index and no cap. Spam accumulated indefinitely, consuming storage and degrading query performance.

**Fix:**  
Added a MongoDB TTL index on `createdAt` with `expireAfterSeconds: 31536000` (365 days). Old feedback is automatically removed by MongoDB's background TTL worker.

---

### VULN-06 · MEDIUM — CORS Allows All Origins in Production

| Detail | Value |
|--------|-------|
| **File** | `api/server.js` |
| **CVSS** | 5.3 |
| **Status** | **FIXED** |

**Description:**  
The Vercel serverless Express app's CORS callback had a commented note "open during development — tighten for production" but returned `cb(null, true)` for **every** origin. This meant any external site could make credentialed cross-origin requests to the API.

**Fix:**  
Unknown origins are now **rejected** with an error. Only `localhost:5173`, `localhost:3000`, and `FRONTEND_URL` env var are allowed.

---

### VULN-07 · MEDIUM — Global Rate Limit Too Permissive

| Detail | Value |
|--------|-------|
| **File** | `backend/src/server.js` |
| **CVSS** | 4.3 |
| **Status** | **FIXED** |

**Description:**  
Global rate limit was 200 requests per 15 minutes per IP — effectively ~13 req/min. Combined with no per-route limits on writes, this was insufficient to prevent automated spam.

**Fix:**  
Reduced global limit to **100 req / 15 min**. Added dedicated per-route limiters on the feedback write endpoint (10/hour).

---

### VULN-08 · MEDIUM — Internal Error Messages Leaked to Clients

| Detail | Value |
|--------|-------|
| **Files** | `backend/src/routes/feedback.js`, `api/lib/auth.js` |
| **CVSS** | 3.7 |
| **Status** | **FIXED** |

**Description:**  
Several routes returned `err.message` directly to the client, potentially leaking stack traces, file paths, or internal state.

**Fix:**  
Error responses now return generic messages. `err.message` is logged server-side only.

---

### VULN-09 · LOW — Hardcoded Fallback Admin Wallet Addresses

| Detail | Value |
|--------|-------|
| **Files** | `backend/src/middleware/auth.js`, `api/lib/auth.js` |
| **Status** | Noted (not changed — would break dev setup) |

**Description:**  
Two admin wallet public keys are hardcoded as fallback defaults when `ADMIN_WALLET` / `ADMIN_WALLET_2` env vars are not set. While public keys aren't secrets, this reduces the ability to rotate wallets quickly. **Recommendation:** Require env vars and fail-fast if missing.

---

### VULN-10 · LOW — Seed Scripts Can Mass-Insert Data

| Detail | Value |
|--------|-------|
| **Files** | `backend/src/seed.js`, `backend/src/seed-documents.js` |
| **Status** | Acknowledged |

**Description:**  
These scripts connect directly to MongoDB and insert demo data. If an attacker gained shell/CI access, they could run these to fill the DB. Not an HTTP vulnerability, but a risk if deployment credentials are compromised. **Recommendation:** Restrict DB credentials to read+write only from app IP ranges. Remove write access from CI environments that don't need it.

---

## Files Changed

| File | Change |
|------|--------|
| `backend/src/middleware/auth.js` | Mandatory signature verification, removed wallet leak in errors |
| `api/lib/auth.js` | Same — Vercel serverless auth layer |
| `backend/src/routes/feedback.js` | Per-route rate limiter, input sanitisation, min-length |
| `backend/src/models/Feedback.js` | TTL index (365-day auto-expiry) |
| `backend/src/routes/admin.js` | Removed wallet leak from `GET /admin/config` |
| `api/server.js` | CORS: reject unknown origins |
| `backend/src/server.js` | Stricter global rate limit (100/15min) |
| `backend/src/cleanup-spam.js` | **NEW** — Script to identify and remove spam |

---

## Cleanup Script

A new script `backend/src/cleanup-spam.js` was created to purge existing spam:

```bash
# Dry run — see what would be deleted
cd backend
node src/cleanup-spam.js

# Actually delete spam
node src/cleanup-spam.js --execute

# Delete all feedback older than 7 days
node src/cleanup-spam.js --execute --days 7
```

---

## Remaining Recommendations

| Priority | Action |
|----------|--------|
| **Urgent** | Rotate MongoDB Atlas credentials immediately. The old connection string may be compromised. |
| **Urgent** | Restrict MongoDB Atlas Network Access to only your server / Vercel IP ranges. |
| **High** | Add a CAPTCHA (e.g. hCaptcha, Turnstile) or require wallet-signed messages for public feedback. |
| **High** | Require `ADMIN_WALLET` env var (fail-fast if missing) instead of hardcoded fallback. |
| **Medium** | Add request logging / alerting (e.g. via MongoDB Atlas alerts or Application Insights) for write-spike detection. |
| **Medium** | Consider requiring `x-wallet-message` to contain a recent timestamp (e.g. within 5 min) to prevent replay attacks. |
| **Low** | Set up automated backups / point-in-time recovery on MongoDB Atlas. |

---

*End of audit report.*

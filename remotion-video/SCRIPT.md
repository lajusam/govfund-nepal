# GovFund Nepal — Video Narration Script

> **Duration:** 90 seconds | **Tone:** Cinematic, confident, purposeful  
> **Voice style:** Calm, authoritative narrator — think documentary meets tech demo  
> **Pacing:** Deliberate pauses between sections. Let visuals breathe.

---

## SCENE 1 — THE QUESTION (0:00 – 0:05)

*[Particles drift in darkness. Two lines appear, one after another.]*

**NARRATOR:**

> Where does public money go?  
> *(beat)*  
> Can trust… be enforced by code?

---

## SCENE 2 — THE PROBLEM (0:05 – 0:13)

*[Red-accented glass cards float in. Vignette tightens. Mood: serious.]*

**NARRATOR:**

> Every year, billions of rupees flow through Nepal's public budget.  
> But the system is broken.  
>
> Budget allocations are opaque — no public record, no verifiable trail.  
> Tracking is manual — paper processes riddled with errors and manipulation.  
> There is no audit trail citizens can access.  
> And records? They can be silently edited — with zero accountability.
>
> *(pause)*  
> This isn't just inefficiency. It's a system that *enables* corruption.

---

## SCENE 3 — THE SOLUTION (0:13 – 0:20)

*[Particles converge to center. Logo assembles with a shockwave. Solana badge appears.]*

**NARRATOR:**

> Introducing **GovFund Nepal**.  
>
> Transparent public spending — written permanently on the Solana blockchain.  
>
> Not a promise of transparency.  
> A **guarantee**, enforced by smart contract code that no one — not even administrators — can override.

---

## SCENE 4 — HOW IT WORKS (0:20 – 0:40)

*[Four-step progress rail animates. On-chain terminal logs scroll in real time.]*

**NARRATOR:**

> Here's how it works.
>
> **Step one: Allocate.**  
> The government allocates a budget to a project. Every allocation requires a cryptographic wallet signature — recorded forever on-chain.
>
> *(terminal shows: `wallet.sign({ instruction: AllocateBudget })` → TX confirmed)*
>
> **Step two: Release.**  
> Funds are released in stages, gated by milestones. The smart contract enforces a hard rule — released funds can **never** exceed the allocated amount. Overspending is technically impossible.
>
> *(terminal shows: `guard: released <= allocated → OK`)*
>
> **Step three: Track.**  
> Every milestone update emits a blockchain event. Every document is stored on IPFS — content-addressed, tamper-proof, permanent.
>
> *(terminal shows: `IPFS.store(doc_hash: "Qm7xH3...")` → `immutable_record: cannot_edit = true`)*
>
> **Step four: Verify.**  
> Any citizen, any journalist, any auditor can verify every record — in real time. No permissions needed. No gatekeepers.
>
> *(terminal shows: `PublicLedger.verify(project_id) → VERIFIED ✓`)*

---

## SCENE 5 — UI SHOWCASE (0:40 – 0:55)

*[Floating 3D screens show the platform UI — Dashboard, Projects, Province hierarchy, Analytics.]*

**NARRATOR:**

> The platform is built for **every citizen** — not just developers or officials.
>
> A clean, responsive dashboard shows real-time budget flow across all seven provinces.  
> Drill into any district. Any project. See exactly how much was allocated, how much was released, and what milestones were hit.
>
> Province hierarchy — from Bagmati to Karnali — is fully modeled. Every sector, every project, every rupee.
>
> Light mode. Dark mode. English. Nepali. Built to be accessible to everyone.

---

## SCENE 6 — CORE FEATURES (0:55 – 1:10)

*[Feature cards cascade in with beat-synced entrances.]*

**NARRATOR:**

> The core features are designed around one principle: **trust through transparency**.
>
> **Fully on-chain records** — every allocation and release lives on Solana. No off-chain shortcuts for critical state.  
> **Admin wallet control** — only a designated wallet can modify program state. Cryptographically enforced, no backdoors.  
> **Immutable audit trail** — blockchain entries are permanent. No silent edits. No retroactive changes. Ever.  
> **Public transparency** — all project data is readable without authentication. Verified by anyone, anytime.
>
> *(beat)*
>
> **IPFS document proof** — procurement documents, blueprints, certificates — all stored on IPFS with content hashes recorded on-chain.  
> **Real-time analytics** — live dashboards show budget flow, province breakdowns, and milestone completion rates.  
> **No silent edits** — the smart contract won't allow updates without emitting on-chain events. Every change is visible.  
> And the architecture is **mainnet-ready** — migrate from Devnet to Mainnet with a single configuration change.

---

## SCENE 7 — MONEY FLOW (1:10 – 1:20)

*[Animated flow: Government Budget → Project Allocation → Fund Release → Milestones → Public Ledger. Shield blocks overspending.]*

**NARRATOR:**

> Follow the money.
>
> Forty-two point seven billion starts at the government budget.  
> Twenty-three point four billion is allocated to projects across the country.  
> Twelve point one billion has been released — each release tied to a verified milestone.
>
> Eight hundred forty-seven milestones completed. Out of over twelve hundred. Tracked. Verified. Public.
>
> And if anyone tries to release more than what was allocated?  
> *(shield animation blocks)*  
> The smart contract says **no**. Not a warning. Not a flag. A hard, cryptographic **rejection**.

---

## SCENE 8 — TECH STACK (1:20 – 1:25)

*[Horizontal badge scroll: Solana · Anchor · Rust · Node.js · MongoDB · IPFS · React · Vite]*

**NARRATOR:**

> Built on battle-tested, production-grade technology.
>
> **Solana** for sub-second finality. **Anchor** and **Rust** for the smart contract. **Node.js** powering the API. **MongoDB** for flexible off-chain data. **IPFS** for decentralized document storage. And **React** with **Vite** for a fast, modern frontend.
>
> Every layer chosen for a reason. Every component open source.

---

## SCENE 9 — CLOSING (1:25 – 1:30)

*[Logo assembles. Final statement. URL fades in. Fade to black.]*

**NARRATOR:**

> *(slow, deliberate)*
>
> Transparency is not a promise.
>
> *(beat)*
>
> It's code.
>
> *(silence — let the line land)*

**[URL appears: govfund-nepal.vercel.app]**

**[Fade to black.]**

---

## Production Notes

| Detail | Value |
|--------|-------|
| **Total duration** | 90 seconds (2700 frames @ 30fps) |
| **Resolution** | 1920 × 1080 |
| **Crossfades** | 15 frames between every scene |
| **Recommended voice** | Male or female, calm and authoritative, slight gravitas |
| **Music suggestion** | Ambient electronic — subtle tension in Scenes 1–2, rising energy in 3–4, confident pulse in 5–8, quiet resolution in 9 |
| **Word count** | ~580 words ≈ 90 seconds at moderate narration pace |

### Tips for Recording

1. **Don't rush.** Let pauses do the work — especially in Scenes 1, 3, and 9.
2. **Emphasize key words** in bold — they're intentionally marked for vocal stress.
3. **Match energy to visuals** — serious in Scene 2, building confidence through 3–4, peak energy in 6–7, calm authority to close.
4. **The closing line is everything.** "Transparency is not a promise. It's code." — deliver it like a thesis statement, not a tagline.

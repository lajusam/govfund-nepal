#!/bin/bash
export PATH="/root/.local/share/solana/install/active_release/bin:/root/.cargo/bin:$PATH"

ADDR="J1MtQ3s4MR4MHVuqusWz4W2wcNKg6GUS1CsdxVLDWbDe"

echo "=== Trying faucet.solana.com API ==="
# Try the official faucet web API
curl -sv "https://faucet.solana.com/api/request-airdrop" \
  -H "Content-Type: application/json" \
  -H "Origin: https://faucet.solana.com" \
  -H "Referer: https://faucet.solana.com/" \
  -d "{\"walletAddress\":\"$ADDR\",\"network\":\"devnet\",\"amount\":\"2\"}" 2>&1 | tail -20
echo ""

sleep 3
echo "=== Balance ==="
solana balance

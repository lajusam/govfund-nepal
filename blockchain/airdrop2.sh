#!/bin/bash
export PATH="/root/.local/share/solana/install/active_release/bin:/root/.cargo/bin:$PATH"

ADDR="J1MtQ3s4MR4MHVuqusWz4W2wcNKg6GUS1CsdxVLDWbDe"

echo "=== Trying solfaucet.com ==="
curl -s "https://faucet-api.solfaucet.com/airdrop" \
  -H "Content-Type: application/json" \
  -d "{\"wallet\":\"$ADDR\",\"network\":\"devnet\",\"amount\":1}"
echo ""

sleep 3
echo "=== Checking balance ==="
solana balance

if [ "$(solana balance | grep -o '^0')" = "0" ]; then
  echo "=== Still 0, trying another RPC for airdrop ==="
  solana airdrop 1 --url https://devnet.helius-rpc.com
  echo ""
  solana balance
fi

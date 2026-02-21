#!/bin/bash
export PATH="/root/.local/share/solana/install/active_release/bin:/root/.cargo/bin:$PATH"

ADDR="J1MtQ3s4MR4MHVuqusWz4W2wcNKg6GUS1CsdxVLDWbDe"

echo "=== Trying RPC airdrop via curl ==="
curl -s https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"requestAirdrop\",\"params\":[\"$ADDR\",2000000000]}"
echo ""

echo "=== Checking balance ==="
solana balance

echo "=== If above failed, trying CLI airdrop with delay ==="
sleep 5
solana airdrop 1
echo ""
solana balance

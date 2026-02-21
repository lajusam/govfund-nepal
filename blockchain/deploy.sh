#!/bin/bash
export PATH="/root/.local/share/solana/install/active_release/bin:/root/.cargo/bin:$PATH"

echo "=== Deployer wallet ==="
solana address
solana balance

echo ""
echo "=== Program keypair ==="
solana-keygen pubkey /root/govfund-build/target/deploy/govfund-keypair.json

echo ""
echo "=== Deploying govfund.so to Devnet ==="
solana program deploy \
  /root/govfund-build/target/deploy/govfund.so \
  --program-id /root/govfund-build/target/deploy/govfund-keypair.json \
  --url https://api.devnet.solana.com \
  -v

echo ""
echo "=== Post-deploy balance ==="
solana balance

echo ""
echo "=== Program info ==="
solana program show B6CSWaYtxem8bPEHe3CRCZ52n7kuRrZJbqw3dkFhSZAp

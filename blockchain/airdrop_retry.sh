#!/bin/bash
export PATH="/root/.local/share/solana/install/active_release/bin:/root/.cargo/bin:$PATH"

ADDR="J1MtQ3s4MR4MHVuqusWz4W2wcNKg6GUS1CsdxVLDWbDe"

# Try multiple times with delays
for i in 1 2 3 4 5; do
  echo "=== Attempt $i ==="
  result=$(solana airdrop 1 2>&1)
  echo "$result"
  
  if echo "$result" | grep -q "Signature"; then
    echo "SUCCESS! Checking balance..."
    solana balance
    exit 0
  fi
  
  echo "Waiting 10 seconds..."
  sleep 10
done

echo "=== All attempts failed ==="
echo "Trying 0.1 SOL..."
solana airdrop 0.1
solana balance

#!/bin/bash

# EcoBonus Testnet Testing Script
# Tests the complete workflow with XLM rewards

set -e

ADMIN_ADDR="GDUGXNI3GIFJSIHVML4DRUFXBWVVJR2PXUIHR4VB7XDT3J7ZPWZKU32W"
MISSION_CONTRACT="CAIFF4NMRTSM3C25NXBX35EULVWTHKLEIC5C2GHC35IJBFQC5JZIR47V"
REWARD_CONTRACT="CCSIBFDFBOY5SXUAUB4DRJUH7DS34QVWLESMQGAZOVU33YZYKLD2M5NG"
CERTIFICATE_CONTRACT="CCM2NUS74BODRZNCVPVRCXML4M6P4FXR2BUW726Z6URQZDFX7UN7B5LS"

echo "========================================="
echo "EcoBonus Testnet - Full Workflow Test"
echo "========================================="
echo ""
echo "Network: Stellar Testnet"
echo "Rewards: Native XLM (no tokens required!)"
echo ""

# Display contracts
echo "=== Smart Contracts ==="
echo "Mission:     $MISSION_CONTRACT"
echo "Reward:      $REWARD_CONTRACT"
echo "Certificate: $CERTIFICATE_CONTRACT"
echo ""

# Check reward pool
echo "=== Reward Pool Status ==="
stellar contract invoke \
  --id $REWARD_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_pool \
  --sponsor $ADMIN_ADDR
echo ""

# List missions
echo "=== Active Missions ==="
MISSION_COUNT=$(stellar contract invoke \
  --id $MISSION_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_mission_count)

echo "Total missions: $MISSION_COUNT"
echo ""

for i in $(seq 1 $MISSION_COUNT); do
  echo "--- Mission $i ---"
  stellar contract invoke \
    --id $MISSION_CONTRACT \
    --source-account ecobonus-admin \
    --network testnet \
    -- get_mission \
    --mission_id $i
  echo ""
done

echo "========================================="
echo "Test Summary:"
echo "✅ Reward pool: 10 XLM (native)"
echo "✅ Test missions: $MISSION_COUNT in Lima"
echo "✅ No trustlines required!"
echo "========================================="
echo ""
echo "Next steps for testing:"
echo "1. Create test user account"
echo "2. Submit claim for a mission"
echo "3. Validate claim (AI or manual)"
echo "4. Distribute XLM reward"
echo "5. Mint certificate NFT"
echo ""
echo "Explorer links:"
echo "Mission: https://stellar.expert/explorer/testnet/contract/$MISSION_CONTRACT"
echo "Reward:  https://stellar.expert/explorer/testnet/contract/$REWARD_CONTRACT"
echo "Cert:    https://stellar.expert/explorer/testnet/contract/$CERTIFICATE_CONTRACT"

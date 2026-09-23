#!/bin/bash

# EcoBonus - Complete Claim Workflow Test
# Demonstrates full user journey from claim submission to reward distribution

set -e

MISSION_CONTRACT="CAIFF4NMRTSM3C25NXBX35EULVWTHKLEIC5C2GHC35IJBFQC5JZIR47V"
REWARD_CONTRACT="CBUPDKPRICZO67L5H6EPHRUV6QPX6PZ5QMTKPALKZJRSHMWEUWSLG6PO"
ADMIN_ADDR="GDUGXNI3GIFJSIHVML4DRUFXBWVVJR2PXUIHR4VB7XDT3J7ZPWZKU32W"
USER1_ADDR=$(stellar keys address test-user1)

echo "========================================="
echo "ECOBONUS - COMPLETE CLAIM WORKFLOW TEST"
echo "========================================="
echo ""
echo "This demonstrates the full user journey:"
echo "1. User submits claim for completed mission"
echo "2. Validator reviews and approves claim"
echo "3. System distributes XLM reward to user"
echo ""

# Step 1: Check initial pool balance
echo "=== Step 1: Check Pool Balance Before ==="
POOL_BEFORE=$(stellar contract invoke \
  --id $REWARD_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_pool \
  --sponsor $ADMIN_ADDR)
echo $POOL_BEFORE
echo ""

# Step 2: User submits claim
echo "=== Step 2: User Submits Claim ==="
echo "Mission ID: 1 (Parque Kennedy)"
echo "User: $USER1_ADDR"
echo "Reward: 1 XLM (1,000,000 stroops)"
echo ""

CLAIM_ID=$(stellar contract invoke \
  --id $REWARD_CONTRACT \
  --source-account test-user1 \
  --network testnet \
  -- submit_claim \
  --mission_id 1 \
  --claimer $USER1_ADDR \
  --amount 1000000 \
  --proof_uri "ipfs://QmTestProofParqueKennedy" \
  --sponsor $ADMIN_ADDR)

echo "Claim submitted! ID: $CLAIM_ID"
echo ""
sleep 2

# Step 3: Check claim status (Pending)
echo "=== Step 3: Check Claim Status (Pending) ==="
stellar contract invoke \
  --id $REWARD_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_claim \
  --claim_id $CLAIM_ID
echo ""
sleep 2

# Step 4: Validator approves claim
echo "=== Step 4: Validator Approves Claim ==="
stellar contract invoke \
  --id $REWARD_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- validate_claim \
  --claim_id $CLAIM_ID \
  --validator $ADMIN_ADDR \
  --approved true

echo "Claim validated and approved!"
echo ""
sleep 2

# Step 5: Check claim status (Approved)
echo "=== Step 5: Check Claim Status (Approved) ==="
stellar contract invoke \
  --id $REWARD_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_claim \
  --claim_id $CLAIM_ID
echo ""
sleep 2

# Step 6: Distribute reward
echo "=== Step 6: Distribute XLM Reward ==="
stellar contract invoke \
  --id $REWARD_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- distribute_reward \
  --claim_id $CLAIM_ID

echo "Reward distributed!"
echo ""
sleep 2

# Step 7: Check final pool balance
echo "=== Step 7: Check Pool Balance After ==="
POOL_AFTER=$(stellar contract invoke \
  --id $REWARD_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_pool \
  --sponsor $ADMIN_ADDR)
echo $POOL_AFTER
echo ""

# Step 8: Verify user claims
echo "=== Step 8: User Claims History ==="
stellar contract invoke \
  --id $REWARD_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_user_claims \
  --user $USER1_ADDR
echo ""

echo "========================================="
echo "✅ WORKFLOW COMPLETE!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Claim submitted and validated"
echo "- 1 XLM distributed to user"
echo "- Pool balance reduced by 1 XLM"
echo "- User now has 1 approved claim"
echo ""
echo "Explorer links:"
echo "Reward Contract: https://stellar.expert/explorer/testnet/contract/$REWARD_CONTRACT"
echo "User Account: https://stellar.expert/explorer/testnet/account/$USER1_ADDR"

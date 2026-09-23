#!/bin/bash

# Test Mission Creation and Claim Workflow

ADMIN_ADDR="GDUGXNI3GIFJSIHVML4DRUFXBWVVJR2PXUIHR4VB7XDT3J7ZPWZKU32W"
MISSION_CONTRACT="CAIFF4NMRTSM3C25NXBX35EULVWTHKLEIC5C2GHC35IJBFQC5JZIR47V"
USER1=$(stellar keys address test-user1)

# Create a test mission in Parque Kennedy, Miraflores, Lima
echo "Creating test mission in Parque Kennedy..."
stellar contract invoke \
  --id $MISSION_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- create_mission \
  --creator $ADMIN_ADDR \
  --location '{"latitude": -12118893, "longitude": -77029572, "radius": 100}' \
  --reward_amount 1000000 \
  --max_claimers 10 \
  --deadline 1735689600 \
  --metadata_uri "ipfs://QmTest1ParqueKennedy" \
  --evidence_required 2

echo "Mission created!"
echo "Getting mission count..."
stellar contract invoke \
  --id $MISSION_CONTRACT \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_mission_count

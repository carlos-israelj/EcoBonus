# Despliegue a Stellar Testnet

## Contratos a Desplegar

### 1. Mission Contract
- **Ruta:** `contracts/mission-contract/`
- **Propósito:** Gestiona misiones de limpieza geolocalizadas
- **Funciones clave:** create_mission, claim_mission, validate_claim

### 2. Reward Contract
- **Ruta:** `contracts/reward-contract/`
- **Propósito:** Pools de recompensas y distribución
- **Funciones clave:** create_pool, distribute_reward, claim_reward

### 3. Certificate NFT
- **Ruta:** `contracts/certificate-nft/`
- **Propósito:** Certificados de impacto ambiental como NFTs
- **Funciones clave:** mint, transfer, metadata

## Pasos de Despliegue

### 1. Configurar cuenta de testnet

```bash
# Generar cuenta de testnet (si no existe)
stellar keys generate testnet-deployer --network testnet

# Obtener dirección
stellar keys address testnet-deployer

# Fondear cuenta desde friendbot
stellar keys fund testnet-deployer --network testnet
```

### 2. Actualizar environments.toml

Edita `environments.toml` y agrega los contratos en la sección `[staging.contracts]`:

```toml
[staging.contracts]
mission_contract = { client = true, constructor_args = "--admin testnet-deployer" }
reward_contract = { client = true, constructor_args = "--admin testnet-deployer" }
certificate_nft = { client = true, constructor_args = "--admin testnet-deployer --name EcoBonusCertificate --symbol ECOC" }
```

### 3. Compilar contratos

```bash
cd contracts/mission-contract
stellar contract build

cd ../reward-contract
stellar contract build

cd ../certificate-nft
stellar contract build
```

### 4. Desplegar a testnet

```bash
# Deploy Mission Contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/mission_contract.wasm \
  --source testnet-deployer \
  --network testnet

# Guardar el Contract ID que se imprime
# Ejemplo: CAXXX...

# Deploy Reward Contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/reward_contract.wasm \
  --source testnet-deployer \
  --network testnet

# Deploy Certificate NFT
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/certificate_nft.wasm \
  --source testnet-deployer \
  --network testnet
```

### 5. Inicializar contratos

```bash
# Initialize Mission Contract
stellar contract invoke \
  --id CAXXX_MISSION_CONTRACT_ID \
  --source testnet-deployer \
  --network testnet \
  -- initialize \
  --admin testnet-deployer

# Initialize Reward Contract
stellar contract invoke \
  --id CAXXX_REWARD_CONTRACT_ID \
  --source testnet-deployer \
  --network testnet \
  -- initialize \
  --admin testnet-deployer
```

## Evidencia para el Formulario

Una vez desplegado, documenta:

1. **Contract IDs:**
   - Mission Contract: `CA...`
   - Reward Contract: `CA...`
   - Certificate NFT: `CA...`

2. **Transaction Hashes:**
   - Deployment TX Mission: `https://stellar.expert/explorer/testnet/tx/HASH`
   - Deployment TX Reward: `https://stellar.expert/explorer/testnet/tx/HASH`
   - Deployment TX Certificate: `https://stellar.expert/explorer/testnet/tx/HASH`

3. **Testnet Account:**
   - Deployer: `GA...`
   - Explorer: `https://stellar.expert/explorer/testnet/account/GA...`

## Actualizar README.md

Agregar al final del README:

```markdown
## Stellar Testnet Deployment

### Smart Contracts

- **Mission Contract**: [CA...](https://stellar.expert/explorer/testnet/contract/CA...)
- **Reward Contract**: [CA...](https://stellar.expert/explorer/testnet/contract/CA...)
- **Certificate NFT**: [CA...](https://stellar.expert/explorer/testnet/contract/CA...)

### Deployment Transactions

- Mission Contract: [TX Hash](https://stellar.expert/explorer/testnet/tx/...)
- Reward Contract: [TX Hash](https://stellar.expert/explorer/testnet/tx/...)
- Certificate NFT: [TX Hash](https://stellar.expert/explorer/testnet/tx/...)

### Testnet Admin Account

- Address: `GA...`
- Explorer: [View on Stellar Expert](https://stellar.expert/explorer/testnet/account/GA...)
```

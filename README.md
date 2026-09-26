# EcoBonus - Clean-to-Earn Platform

**Democratizando la ecología urbana en Perú mediante blockchain**

EcoBonus es la primera plataforma Clean-to-Earn de América Latina que transforma la acción cívica de limpieza urbana en Real World Assets (RWA) verificables en blockchain pública, democratizando el acceso a recompensas ambientales mediante validación por IA y micropagos instantáneos en stablecoins.

## Propuesta de Valor

_Tradicionalmente, la limpieza de las ciudades dependía solo de los municipios o de los recicladores. Nuestro MVP democratiza la ecología urbana: permitimos que cualquier peruano de a pie, en su ruta diaria al mercado o al estudio, se convierta en un recolector por oportunidad, transformando minutos libres en impacto ambiental verificable on-chain y recompensas reales_.

_Nuestro MVP es un juego de Clean-to-Earn donde el mapa es la ciudad real y las misiones son focos de basura activa. La innovación radica en que cada acción de limpieza se convierte en un RWA (Real World Asset) en la red Stellar: un certificado de impacto ambiental transparente y auditable para el Ministerio del Ambiente, respaldado por un sistema de recompensas con valor comercial real financiado por nuestros patrocinadores_.

## Características Principales

- 🌍 **Misiones Geolocalizadas**: Descubre focos de basura en tu ciudad mediante un mapa interactivo
- 📸 **Validación por IA**: Valida tu limpieza con fotos procesadas por inteligencia artificial
- 💰 **Micropagos Instantáneos**: Recibe USDC/XLM sin mínimos ni comisiones bancarias
- 🏆 **Gamificación**: Compite en ligas locales y nacionales, sube de nivel
- 🎫 **Certificados NFT**: Cada acción genera un certificado de impacto ambiental inmutable
- 🔍 **Transparencia Total**: Contratos inteligentes públicos y auditables en Stellar
- 🌱 **Impacto Real**: Datos geolocalizados para políticas públicas ambientales

## Stack Tecnológico

- ⚡️ **Frontend**: Vite + React + TypeScript
- 🔗 **Blockchain**: Stellar (Soroban Smart Contracts)
- 🧠 **IA**: TensorFlow/PyTorch para validación visual
- 🗺 **Maps**: Mapbox API
- 💎 **Assets**: XLM (gas), USDC (rewards), NFTs (certificates)
- 📦 **Storage**: IPFS (proofs & metadata)

Built with [Stellar Scaffold](https://github.com/stellar-scaffold/cli).

## Requirements

Before getting started, make sure you’ve met the requirements listed in the
[Soroban documentation](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
and that the following tools are installed :

- [Rust](https://www.rust-lang.org/tools/install)
- [Cargo](https://doc.rust-lang.org/cargo/) (comes with Rust)
- Rust target: install the compilation target listed in the
  [Soroban setup guide](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- [Node.js](https://nodejs.org/en/download/package-manager) (v22, or higher)
- [npm](https://www.npmjs.com/): Comes with the node installer or can also be
  installed package managers such as Homebrew, Chocolatey, apt, etc.
- [Stellar CLI](https://github.com/stellar/stellar-core)
- [Stellar Scaffold CLI Plugin](https://github.com/stellar-scaffold/cli)

## Quick Start

To get started with a fresh Stellar Scaffold project, follow the steps below:

1. Initialize a new project:

```bash
stellar scaffold init my-project
cd my-project
```

2. Set up your development environment:

```bash
# Copy and configure environment variables like network and STELLAR_SCAFFOLD_ENV
cp .env.example .env

# Install frontend dependencies
npm install
```

Have a look at `environments.toml` for more fined-grained control.

3. Start development environment:

```bash
npm run dev
```

Open the server URL in your web browser.

4. For testnet/mainnet deployment:

When you are ready for testnet, you need to deploy your contract using
`stellar registry`. Some commands to get you started.

```bash
#  Note --source-account argument is omitted for clarity

# First publish your contract to the registry
stellar registry publish

# Then deploy an instance with constructor parameters
stellar registry deploy \
  --deployed-name my-contract \
  --published-name my-contract \
  -- \
  --param1 value1

# Can access the help docs with --help
stellar registry deploy \
  --deployed-name my-contract \
  --published-name my-contract \
  -- \
  --help

# Install the deployed contract locally
stellar registry create-alias my-contract
```

## Scaffold Initial Project Structure

When you run `stellar scaffold init`, it creates a frontend-focused project
structure with example contracts:

```
my-project/                      # Your initialized project
├── contracts/                   # Example smart contracts
├── packages/                    # Auto-generated TypeScript clients
├── src/                         # Frontend React application
│   ├── components/              # React components
│   ├── contracts/               # Contract interaction helpers
│   ├── debug/                   # Debugging contract explorer
│   ├── hooks/                   # Custom React hooks
│   ├── pages/                   # App Pages
│   ├── App.tsx                  # Main application component
│   └── main.tsx                 # Application entry point
├── target/                      # Build artifacts and WASM files
├── environments.toml            # Environment configurations
├── package.json                 # Frontend dependencies
└── .env                         # Local environment variables
```

This template provides a ready-to-use frontend application with example smart
contracts and their TypeScript clients. You can use these as reference while
building your own contracts and UI. The frontend is set up with Vite, React, and
includes basic components for interacting with the contracts.

## 🚀 Stellar Testnet Deployment

### Live Demo
🌐 **Frontend**: [https://carlos-israelj.github.io/EcoBonus/](https://carlos-israelj.github.io/EcoBonus/)

### Smart Contracts on Testnet

#### 1. Mission Contract
**Contract ID**: `CBITQYMLPOOOHZ3EXYKQFKB7XMOOLXIWH5WKTU6DAKZAJ5WFR5SFKUZK`

Gestiona misiones de limpieza geolocalizadas con validación descentralizada.

- 🔗 [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBITQYMLPOOOHZ3EXYKQFKB7XMOOLXIWH5WKTU6DAKZAJ5WFR5SFKUZK)
- 🔬 [View on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CBITQYMLPOOOHZ3EXYKQFKB7XMOOLXIWH5WKTU6DAKZAJ5WFR5SFKUZK)
- 📝 Deployment TX: [e1eff8a0c92421aeef4bf9421eb336bba054ac50a76f1f7db2247496cb1b39d1](https://stellar.expert/explorer/testnet/tx/e1eff8a0c92421aeef4bf9421eb336bba054ac50a76f1f7db2247496cb1b39d1)
- ⚙️ Initialize TX: [9de8f591658da36e7c4f537d8bde0395b9beb339c05f830c0c565d07d03a2c81](https://stellar.expert/explorer/testnet/tx/9de8f591658da36e7c4f537d8bde0395b9beb339c05f830c0c565d07d03a2c81)

**Functions**: `create_mission`, `claim_mission`, `fund_mission`, `get_active_missions_near`, `cancel_mission`

#### 2. Reward Contract
**Contract ID**: `CDCGUCOJX4MUXSBYNPARNORJUIP5ZNTZ6HZ3T2UZANLMCZC5OZSLFF4Y`

Administra pools de recompensas patrocinadas y distribución automática.

- 🔗 [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDCGUCOJX4MUXSBYNPARNORJUIP5ZNTZ6HZ3T2UZANLMCZC5OZSLFF4Y)
- 🔬 [View on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CDCGUCOJX4MUXSBYNPARNORJUIP5ZNTZ6HZ3T2UZANLMCZC5OZSLFF4Y)
- 📝 Deployment TX: [a089270efbd975db35c247240452e55584f84d7c03785071a80312aef0f79a30](https://stellar.expert/explorer/testnet/tx/a089270efbd975db35c247240452e55584f84d7c03785071a80312aef0f79a30)
- ⚙️ Initialize TX: [b1578ec5b27d5a39f7bcfda2db6b3f10f262d7ef603cc7aa5c7a6b6e721f2e26](https://stellar.expert/explorer/testnet/tx/b1578ec5b27d5a39f7bcfda2db6b3f10f262d7ef603cc7aa5c7a6b6e721f2e26)
- 💰 Create Pool TX: [a7e00b9d709e797893113c48dbafe0e193c7848aed1a964fd83cd85338fa4354](https://stellar.expert/explorer/testnet/tx/a7e00b9d709e797893113c48dbafe0e193c7848aed1a964fd83cd85338fa4354)

**Functions**: `create_pool`, `fund_pool`, `distribute_reward`, `submit_claim`, `validate_claim`

#### 3. Certificate NFT Contract
**Contract ID**: `CBJP7PQSFR7QNNKL6M4BVIXHRSIBLTD37GQBYU3GPT7FKOPEFEHTEXXW`

Emite certificados de impacto ambiental como NFTs inmutables.

- 🔗 [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBJP7PQSFR7QNNKL6M4BVIXHRSIBLTD37GQBYU3GPT7FKOPEFEHTEXXW)
- 🔬 [View on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CBJP7PQSFR7QNNKL6M4BVIXHRSIBLTD37GQBYU3GPT7FKOPEFEHTEXXW)
- 📝 Deployment TX: [27f5609d1ab0ede3c445a0d6cbb12807b6ae415223209b64671df1562cdaef05](https://stellar.expert/explorer/testnet/tx/27f5609d1ab0ede3c445a0d6cbb12807b6ae415223209b64671df1562cdaef05)
- ⚙️ Initialize TX: [09430b51a709dd7563be4fde9edee0c1677d58f40b2448ccdf3113b39b55c68a](https://stellar.expert/explorer/testnet/tx/09430b51a709dd7563be4fde9edee0c1677d58f40b2448ccdf3113b39b55c68a)
- 🎨 Add Minter TX: [1a85691675aca71c09decadc6bdbed53893d0276eb4b34ae753ef04b5f972a26](https://stellar.expert/explorer/testnet/tx/1a85691675aca71c09decadc6bdbed53893d0276eb4b34ae753ef04b5f972a26)

**Functions**: `mint_certificate`, `transfer`, `burn`, `get_certificate`, `get_user_impact`

### Testnet Admin Account
- **Address**: `GDUGXNI3GIFJSIHVML4DRUFXBWVVJR2PXUIHR4VB7XDT3J7ZPWZKU32W`
- 🔗 [View on Stellar Expert](https://stellar.expert/explorer/testnet/account/GDUGXNI3GIFJSIHVML4DRUFXBWVVJR2PXUIHR4VB7XDT3J7ZPWZKU32W)

### Test Transactions Log (19 Transactions Total)

#### Contract Deployment & Initialization (8 TXs)

| # | Transaction Type | TX Hash | Status |
|---|-----------------|---------|--------|
| 1 | Deploy Mission Contract | [e1eff8a...](https://stellar.expert/explorer/testnet/tx/e1eff8a0c92421aeef4bf9421eb336bba054ac50a76f1f7db2247496cb1b39d1) | ✅ Success |
| 2 | Deploy Reward Contract | [a089270...](https://stellar.expert/explorer/testnet/tx/a089270efbd975db35c247240452e55584f84d7c03785071a80312aef0f79a30) | ✅ Success |
| 3 | Deploy Certificate NFT | [27f5609...](https://stellar.expert/explorer/testnet/tx/27f5609d1ab0ede3c445a0d6cbb12807b6ae415223209b64671df1562cdaef05) | ✅ Success |
| 4 | Initialize Mission Contract | [9de8f59...](https://stellar.expert/explorer/testnet/tx/9de8f591658da36e7c4f537d8bde0395b9beb339c05f830c0c565d07d03a2c81) | ✅ Success |
| 5 | Initialize Reward Contract | [b1578ec...](https://stellar.expert/explorer/testnet/tx/b1578ec5b27d5a39f7bcfda2db6b3f10f262d7ef603cc7aa5c7a6b6e721f2e26) | ✅ Success |
| 6 | Create Reward Pool (10 XLM) | [a7e00b9...](https://stellar.expert/explorer/testnet/tx/a7e00b9d709e797893113c48dbafe0e193c7848aed1a964fd83cd85338fa4354) | ✅ Success |
| 7 | Initialize Certificate NFT | [09430b5...](https://stellar.expert/explorer/testnet/tx/09430b51a709dd7563be4fde9edee0c1677d58f40b2448ccdf3113b39b55c68a) | ✅ Success |
| 8 | Add Minter to NFT Contract | [1a85691...](https://stellar.expert/explorer/testnet/tx/1a85691675aca71c09decadc6bdbed53893d0276eb4b34ae753ef04b5f972a26) | ✅ Success |

#### Reward Contract Test Transactions (11 TXs)

| # | Transaction Type | TX Hash | Details |
|---|-----------------|---------|---------|
| 9 | Add Validator (test-user1) | [bd20a98...](https://stellar.expert/explorer/testnet/tx/bd20a980e505db8863e07d3279bf5bfd4ea9a3050c4a8a135625d1a9bd9e6727) | ✅ Added test-user1 as validator |
| 10 | Add Validator (test-user2) | [f5c422f...](https://stellar.expert/explorer/testnet/tx/f5c422f001f372c80cbd6e4d9ed801eeb04fd22b899d76b68e9487dec3abcc9f) | ✅ Added test-user2 as validator |
| 11 | Create Pool (test-user1) | [69ecd65...](https://stellar.expert/explorer/testnet/tx/69ecd65bddba4a973c6e0fc6aeb16b72b23e759b1ba0074dadcee5b4c2dbad77) | ✅ Created pool with 5 XLM |
| 12 | Create Pool (test-user2) | [1173024...](https://stellar.expert/explorer/testnet/tx/1173024e00834574d3b523ad0b63649e706ce68e27ef733a981d022423e2e4da) | ✅ Created pool with 7.5 XLM |
| 13 | Fund Pool (admin +20 XLM) | [67e0e18...](https://stellar.expert/explorer/testnet/tx/67e0e1865bb0e37effc45a2e5e810ecb6dde0736053a52edc3e9ff2745eda9b2) | ✅ Added 20 XLM to admin pool |
| 14 | Check Validator Status | [8f03d81...](https://stellar.expert/explorer/testnet/tx/8f03d81cd6d96e1c75b70a0328905ddd473a93b39b4af50553b4611cd7cb7efb) | ✅ Verified test-user1 is validator |
| 15 | Get Pool Info (admin) | [f0382b5...](https://stellar.expert/explorer/testnet/tx/f0382b5e0d2fbecd9d89ce42d3c66678e04956cecfa2d9788b101cf4e27ff24f) | ✅ Retrieved pool: 30 XLM total |
| 16 | Submit Claim (user1) | [a4f18d3...](https://stellar.expert/explorer/testnet/tx/a4f18d32e2a30fe9eddb18516e670b1e0a2ecdbc8ac52e1916fac6cdffc84b5f) | ✅ Claim #1: 0.5 XLM for mission 101 |
| 17 | Submit Claim (user2) | [de19388...](https://stellar.expert/explorer/testnet/tx/de19388792a0d13b8d7ee7ca7a857c0c133bc934420ecad0cfbcd367e7b4b0df) | ✅ Claim #2: 0.8 XLM for mission 102 |
| 18 | Validate Claim #1 | [bf94bc7...](https://stellar.expert/explorer/testnet/tx/bf94bc7c280627010f3d46c29435fe2cec88876d8ae4a861643f4ab1338666d8) | ✅ Approved by validator |
| 19 | Get Claim Info | [72e7aac...](https://stellar.expert/explorer/testnet/tx/72e7aacf8d361a4584565fe7f0ef84cb74c4a797b914d09fbcd3d9ff021a137c) | ✅ Status: Approved |

#### Certificate NFT Test Transactions (9 TXs)

| # | Transaction Type | TX Hash | Details |
|---|-----------------|---------|---------|
| 8 | Mint Certificate #1 | [0fe44e0...](https://stellar.expert/explorer/testnet/tx/0fe44e0bfbf11da72fb4b79df10c7556814119716f4a3e150d4360f2b561cb6f) | ✅ Plastic waste, 5kg, Parque Kennedy |
| 9 | Mint Certificate #2 | [5ac7081...](https://stellar.expert/explorer/testnet/tx/5ac7081f49184954321b9148f4a4be42e39d20215fec461e643df1d7148f0334) | ✅ Organic waste, 8kg, Playa Makaha |
| 10 | Mint Certificate #3 | [caf3061...](https://stellar.expert/explorer/testnet/tx/caf3061b57a7de0d822fbcbce2dc492c64343cbdb044f8eaafd67a06cb2f97eb) | ✅ Mixed waste, 12kg, Malecón Reserva |
| 11 | Get Certificate #1 Info | [2236bec...](https://stellar.expert/explorer/testnet/tx/2236beca2713b9989edbb97f7c3d24df774051f367470fe4afdb81c57d4d836a) | ✅ Retrieved full NFT metadata |
| 12 | Get Total Minted | [99086e3...](https://stellar.expert/explorer/testnet/tx/99086e333723390a8515843cafa1c428a0be8b822c43f1de0c2146fd31228e22) | ✅ Total: 5 certificates |
| 13 | Transfer Certificate #1 | [098851a...](https://stellar.expert/explorer/testnet/tx/098851a4e784aac5c05530b8e7a9fd868a3951771b3b4067e319537a4679a3e2) | ✅ user1 → user2 |
| 14 | Mint Certificate #4 | [064ac85...](https://stellar.expert/explorer/testnet/tx/064ac85d559a3a7449360ee583a9500bb4ca045c523180c2c6327c27b9f558df) | ✅ Plastic waste, 15kg, Óvalo Miraflores |
| 15 | Mint Certificate #5 | [a9cd376...](https://stellar.expert/explorer/testnet/tx/a9cd3760062d3e9eaf1ce6f07c6f1142e840db5eef85d009e2226adec94b094d) | ✅ Mixed waste, 20kg, Arequipa Plaza |

### Summary Statistics

- **Total Transactions**: 19 on Stellar Testnet
- **Contracts Deployed**: 3 (Mission, Reward, Certificate NFT)
- **Validators Registered**: 2
- **Reward Pools Created**: 3 (Total: 42.5 XLM funded)
- **Claims Submitted**: 2
- **Claims Validated**: 1 (Approved)
- **NFT Certificates Minted**: 5
- **NFT Transfers**: 1
- **Total Waste Tracked**: 60 kg (Plastic: 20kg, Organic: 8kg, Mixed: 32kg)
- **Carbon Offset**: 29 units

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

### Test Transactions Log

| Transaction Type | TX Hash | Status |
|-----------------|---------|--------|
| Deploy Mission Contract | [e1eff8a...](https://stellar.expert/explorer/testnet/tx/e1eff8a0c92421aeef4bf9421eb336bba054ac50a76f1f7db2247496cb1b39d1) | ✅ Success |
| Deploy Reward Contract | [a089270...](https://stellar.expert/explorer/testnet/tx/a089270efbd975db35c247240452e55584f84d7c03785071a80312aef0f79a30) | ✅ Success |
| Deploy Certificate NFT | [27f5609...](https://stellar.expert/explorer/testnet/tx/27f5609d1ab0ede3c445a0d6cbb12807b6ae415223209b64671df1562cdaef05) | ✅ Success |
| Initialize Mission Contract | [9de8f59...](https://stellar.expert/explorer/testnet/tx/9de8f591658da36e7c4f537d8bde0395b9beb339c05f830c0c565d07d03a2c81) | ✅ Success |
| Initialize Reward Contract | [b1578ec...](https://stellar.expert/explorer/testnet/tx/b1578ec5b27d5a39f7bcfda2db6b3f10f262d7ef603cc7aa5c7a6b6e721f2e26) | ✅ Success |
| Create Reward Pool (10 XLM) | [a7e00b9...](https://stellar.expert/explorer/testnet/tx/a7e00b9d709e797893113c48dbafe0e193c7848aed1a964fd83cd85338fa4354) | ✅ Success |
| Initialize Certificate NFT | [09430b5...](https://stellar.expert/explorer/testnet/tx/09430b51a709dd7563be4fde9edee0c1677d58f40b2448ccdf3113b39b55c68a) | ✅ Success |
| Add Minter to NFT Contract | [1a85691...](https://stellar.expert/explorer/testnet/tx/1a85691675aca71c09decadc6bdbed53893d0276eb4b34ae753ef04b5f972a26) | ✅ Success |

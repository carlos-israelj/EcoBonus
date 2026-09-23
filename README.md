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

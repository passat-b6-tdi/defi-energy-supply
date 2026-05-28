# Energy Billing Automation System

The Energy Billing Automation System is a comprehensive solution designed to automate the processes of data collection, analysis, and billing for electricity consumption among different participants in the energy market.

## Features

- Automated calculation of electricity costs based on contract terms and tariff rates
- Secure data handling and information protection
- Real-time monitoring of electricity consumption
- Generation of accurate and detailed bills for energy market participants

## Tech Stack

- **Solidity** `0.8.20` smart contracts (OpenZeppelin, Solady)
- **Hardhat** development environment with TypeScript
- **Python** utilities for simulation and Telegram bot integration
- Target network: **Arbitrum Sepolia**

## Project Structure

```
contracts/        Solidity sources (Main, Register, Escrow, EnergyOracle, StakingReward, base, mocks, tokens)
scripts/
  typescript/     Hardhat deploy & verify scripts
  python/         Simulation and Telegram bot scripts
test/             Hardhat test suites
deployed/         Deployment artifacts
docs/             Generated documentation
```

## Installation

1. Clone the repository:

```
git clone https://github.com/passat-b6-tdi/defi-energy-supply.git
cd defi-energy-supply
```

2. Install the required dependencies:

```
yarn install
```

3. Copy `.env.example` to `.env` and fill in the required environment variables.

## Available Scripts

### Build & Test

- `yarn clean` — Removes the build artifacts.
- `yarn compile` — Compiles the smart contracts.
- `yarn recompile` — Cleans and then compiles the smart contracts.
- `yarn test` — Runs the smart contract tests.
- `yarn coverage` — Generates a code coverage report.
- `yarn size` — Calculates the size of the compiled smart contracts.
- `yarn docgen` — Generates documentation for the smart contracts.

### Deployment & Verification

- `yarn run:script <path>` — Runs an arbitrary Hardhat script.
- `yarn deploy:network <network>` — Deploys to the given Hardhat network.
- `yarn deploy:arb-sepolia` — Deploys all contracts to Arbitrum Sepolia.
- `yarn verify:network <network>` — Verifies deployed contracts on the given network.
- `yarn verify:arb-sepolia` — Verifies contracts on Arbitrum Sepolia.

### Formatting

- `yarn prettier` — Formats Solidity and TypeScript sources.
- `yarn prettier:sol` — Formats Solidity sources only.
- `yarn prettier:ts` — Formats JavaScript/TypeScript sources only.
- `yarn prettier:json:md` — Formats JSON and Markdown files.

## Contributing

We welcome contributions from the community to enhance the Energy Billing Automation System. To contribute, please follow these steps:

1. Fork the repository.

2. Create a new branch.

3. Make your modifications or add new features.

4. Submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

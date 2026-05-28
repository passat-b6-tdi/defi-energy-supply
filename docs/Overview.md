# Overview

The **Energy Billing Automation System** is an on-chain protocol that automates
data collection, accounting, and settlement of electricity consumption between
the participants of a local energy market (microgrid).

The system is composed of several Solidity contracts that together provide:

- Registration of energy producers, suppliers, electricity consumers, and oracle
  providers as non-fungible identities (ERC-721 / ERC-1155).
- A trust-minimised oracle layer (`EnergyOracle`) where independent
  reporters record supplier tariffs, energy production, and consumption.
- An escrow (`Escrow`) that settles consumer debts in whitelisted stablecoins
  (USDC, DAI, USDT) and routes a protocol fee to the configured receiver.
- A reward layer (`StakingReward`) that distributes the governance token (MGT)
  to active energy producers proportionally to the time their resource is
  staked.

## Participants

| Role              | Identity token                    | What they do                                           |
| ----------------- | --------------------------------- | ------------------------------------------------------ |
| Energy Producer   | `EnergyProducerToken` (721)       | Inject electricity into the grid; earn MGT rewards.    |
| Energy Supplier   | `EnergySupplierToken` (721)       | Sell energy to consumers; set a tariff via the oracle. |
| Consumer          | `ElectricityConsumerToken` (1155) | Receive electricity from a supplier; pay debts.        |
| Oracle Provider   | `EnergyOracleProviderToken` (721) | Report tariffs / production / consumption on-chain.    |
| Protocol Manager  | role-gated                        | Wire contracts, set fees, pause / unpause oracle.      |

## Tokens

| Symbol  | Standard | Purpose                                                  |
| ------- | -------- | -------------------------------------------------------- |
| NRGCT   | ERC-20   | Energy Credit Token — 1 NRGCT represents 1 kWh produced. |
| MGT     | ERC-20   | Microgrid Governance Token — rewards and governance.     |
| NRGPT   | ERC-721  | Energy Producer identity NFT.                            |
| NRGST   | ERC-721  | Energy Supplier identity NFT.                            |
| NRGOPT  | ERC-721  | Energy Oracle Provider identity NFT.                     |
| ELCT    | ERC-1155 | Electricity Consumer pass keyed by supplier id.          |

## Stablecoin settlement

Consumers settle debts in any of the three whitelisted stablecoins configured
immutably on `Main`: **USDC**, **DAI**, **USDT**. A constant per-transaction
fee is routed to the configured fee receiver.

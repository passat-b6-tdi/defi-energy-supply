# Overview

## Who this is for

DefiEnergySupply is built for local communities that had to become their own
grid operator — neighbors in Ukraine who pooled solar panels, battery storage,
or a shared generator to keep the lights on through blackouts, and now
produce and split electricity among themselves. The same model applies more
broadly to any small group of prosumers who generate, store, and trade power
locally without a utility in the middle.

## The problem

Once a community shares power from a common source, someone has to answer a
deceptively hard question every billing cycle: who produced how much, who
consumed how much, and who owes whom. Today that answer comes from a
spreadsheet and mutual trust. That doesn't scale past a handful of neighbors
— it produces disputes over contested numbers, gives no verifiable record
when someone disagrees, and quietly discourages people from investing in
shared generation capacity in the first place, since there's no guarantee
they'll ever be paid back their fair share.

## The solution

The **Energy Billing Automation System** is an on-chain protocol that
replaces the spreadsheet with automated, auditable settlement. Metering data
reaches the chain through an oracle layer, and smart contracts — not a
neighbor's word — calculate exactly what each participant produced,
consumed, and owes, then settle it automatically between the participants
of the local energy market (microgrid).

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

## Prior work & funding

The contracts, subgraph, and Prometheus/Grafana monitoring pipeline
DefiEnergySupply runs on today were originally built under **FORWARDER**, an
international research project funded by **CRDF Global** via the Kyiv
Polytechnic Science Park, and validated on a physical laboratory stand
before moving to Base Sepolia. This grant funds the next layer on top of
that foundation: quality-aware tariffs, a hardened oracle/Smart Bridge, and
a path to a real pilot (see [Roadmap](Roadmap.md)). See [Team](Team.md) for
the full academic background.

## Why blockchain, not just a database?

A database works fine when one party is trusted to run it honestly. In an
ad-hoc neighbor microgrid, there usually isn't one — the people sharing power
are peers, not a utility with a legal mandate to keep the ledger. Whoever
hosts the database becomes the one everyone has to trust not to fudge the
numbers, and disputes have no independent record to point to.

A blockchain removes that single point of trust: every meter reading,
tariff, and payment is a transaction anyone can verify independently, the
rules that turn readings into debt are public code instead of a backend
nobody can inspect, and settlement executes automatically once conditions
are met — no operator in the loop who could delay, alter, or simply stop
running the database.

## Security / audit status

The protocol has not undergone an external security audit. It's a
pre-production prototype: the codebase follows established patterns
(OpenZeppelin, Solady), has a Hardhat test suite, and runs live on Base
Sepolia testnet only. An audit is a pre-mainnet gate, not something to
front-load before the tariff model and oracle design are finalized —
running one now would mean re-auditing after the next redesign.

## Monetization / business model

Every settlement transaction (`Escrow.payForElectricity`) carries a flat
protocol fee, pulled alongside the consumer's debt and routed to a
configurable fee receiver address — separate from the payment reaching the
supplier. Today that receiver and fee amount are protocol-configured
parameters (set via `Main.changeFees`, gated to the manager role); the same
mechanism is the foundation for a sustainable model going forward — funding
infrastructure operation (oracle relayers, subgraph indexing, dashboards)
independent of grant funding, with the fee parameters eventually governable
rather than centrally set.

## Regulatory status

Peer-to-peer electricity trading is a regulated activity in most
jurisdictions, Ukraine included, and DefiEnergySupply doesn't sidestep that
— it's infrastructure software, not a licensed energy supplier. The current
deployment operates on a public testnet with no real electricity or fiat
changing hands, which keeps it outside that regulatory perimeter while the
settlement and tariff logic gets proven out. Moving toward a real pilot
means engaging Ukrainian energy-market regulation directly, most likely
through a regulatory sandbox rather than assuming existing law already
accommodates peer-to-peer microgrid settlement.

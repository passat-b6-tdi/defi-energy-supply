# Access control

The protocol uses two layers of access control:

- **Solady `Ownable`** — single contract owner; used for low-level
  administrative actions (e.g. swapping the `Main` reference via
  `changeMain`).
- **Solady `EnumerableRoles`** — uint256 role identifiers derived from
  `keccak256("ROLE_NAME")`; granted/revoked by the contract owner.

## Roles summary

| Role                          | Contract        | Granted to                | What it unlocks                                                    |
| ----------------------------- | --------------- | ------------------------- | ------------------------------------------------------------------ |
| `MANAGER_ROLE`                | `Main`          | Deployer (initial)        | Update tokens, contracts, fees on `Main`.                          |
| `REGISTER_MANAGER_ROLE`       | `Register`      | Deployer (initial)        | Register/unregister producers, suppliers, oracle providers.        |
| `ESCROW_MANAGER_ROLE`         | `Escrow`        | Deployer (initial)        | (Reserved for future privileged actions on the escrow.)            |
| `ENERGY_ORACLE_MANAGER_ROLE`  | `EnergyOracle`  | Deployer (initial)        | `pause()` / `unpause()` data reporting.                            |
| `ESCROW` (role hash)          | `EnergyOracle`  | The `Escrow` contract     | Call `updateEnergyConsumptions` to mutate consumer debt.           |
| `MINTER_ROLE`                 | every token     | Contracts that mint it    | Issue new tokens (NFTs / fungibles).                               |
| `BURNER_ROLE`                 | every token     | Contracts that burn it    | Destroy tokens upon unregistration or settlement.                  |

## Identity-NFT gating

Some functions are gated **by NFT ownership** rather than by a granted
role hash:

| Gate                              | Required token                          | Used by                                                                       |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| `onlySupplier(supplierId)`        | `EnergySupplierToken` of `supplierId`   | `Register.registerElectricityConsumer`, `unregisterElectricityConsumer`.      |
| `onlyOracleProvider`              | Any `EnergyOracleProviderToken`         | `EnergyOracle.recordSupplierPrice`, `recordEnergyProductions`, `recordConsumerConsumptions`. |
| Consumer hold check               | `ElectricityConsumerToken(supplierId)`  | `Escrow.payForElectricity`, `EnergyOracle.updateEnergyConsumptions`.          |
| `onlyRegister`                    | `msg.sender == Register`                | `StakingReward.enterStakingProducer`, `exitStakingProducer`.                  |
| `isCorrectOwner(producer, id)`    | `EnergyProducerToken` of `producerId`   | `StakingReward.getProducerRewards`, `updateProducerInfo`.                     |

## Required role wiring at deployment

After deploying contracts (`Main`, `Register`, `Escrow`, `EnergyOracle`,
`StakingReward`) and the token contracts, the deployer must wire roles
so cross-contract calls succeed:

1. Token contracts (`NRGCT`, `MGT`, `NRGPT`, `NRGST`, `NRGOPT`, `ELCT`)
   - grant `MINTER_ROLE` and `BURNER_ROLE` to the contracts that need them
     (e.g. `Register` mints/burns identity NFTs; `EnergyOracle` mints MGT
     and NRGCT; `StakingReward` mints MGT to producers).
2. `EnergyOracle`
   - grant the `ESCROW` role to the deployed `Escrow` so it may update
     consumer debt after a payment.
3. `Main`
   - call `changeTokensAddresses(tokens)` and `changeContracts(contracts)`
     with the deployed addresses so other contracts can read them via
     `main().tokens()` / `main().contracts()`.

See `scripts/typescript/deploy.ts` for the canonical wiring sequence.

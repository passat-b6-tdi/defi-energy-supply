# Solidity API

## OnlyEnergyOracleProvider

```solidity
error OnlyEnergyOracleProvider()
```

_Error thrown when caller is not an energy oracle provider_

## IncorrectConsumer

```solidity
error IncorrectConsumer(address incorrectConsumer, uint256 supplierId)
```

_Error to indicate that the consumer address is incorrect_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| incorrectConsumer | address | The incorrect consumer address |
| supplierId | uint256 | The ID of the supplier |

## IncorrectProducer

```solidity
error IncorrectProducer(uint256 producerId)
```

_Error to indicate that the producer address is incorrect_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producerId | uint256 | The ID of the producer |

## IncorrectSupplier

```solidity
error IncorrectSupplier(uint256 supplierId)
```

_Error to indicate that the supplier address is incorrect_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The ID of the supplier |

## EnergyOracle

_This contract allows recording and retrieving energy consumption data for consumers and tokens.
The contract is managed by an Energy Oracle Provider who can record energy data, and an Energy Oracle Manager
who can pause/unpause the contract. The Escrow contract may update outstanding debts via `updateEnergyConsumptions`.
Oracle providers (holders of `EnergyOracleProviderToken`) can call `recordSupplierPrice`,
`recordEnergyProductions`, and `recordConsumerConsumptions`.
`ENERGY_ORACLE_MANAGER_ROLE` can pause/unpause; `ESCROW` role can update debts._

### EnergyPriceRecorded

```solidity
event EnergyPriceRecorded(address sender, uint256 supplierId, uint256 price, uint256 timestamp)
```

_Emmited when an Energy Oracle provider records energy production_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender who recorded the energy production |
| supplierId | uint256 | The ID of the supplier |
| price | uint256 | The energy price |
| timestamp | uint256 | The timestamp when the energy production was recorded |

### EnergyProductionRecorded

```solidity
event EnergyProductionRecorded(address sender, address supplier, uint256 supplierId, uint256 production, uint256 timestamp)
```

_Emmited when an Energy Oracle provider records energy production_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender who recorded the energy production |
| supplier | address | The address of the supplier |
| supplierId | uint256 | The ID of the supplier |
| production | uint256 | The amount of energy produced |
| timestamp | uint256 | The timestamp when the energy production was recorded |

### EnergyConsumptionRecorded

```solidity
event EnergyConsumptionRecorded(address sender, address whoseConsumption, uint256 supplierId, uint256 consumption, uint256 timestamp)
```

_Emmited when an Energy Oracle provider records energy consumption_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender who recorded the energy consumption |
| whoseConsumption | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier |
| consumption | uint256 | The amount of energy consumed |
| timestamp | uint256 | The timestamp when the energy consumption was recorded |

### EnergyConsumptionUpdated

```solidity
event EnergyConsumptionUpdated(address sender, address whoseConsumption, uint256 supplierId, uint256 consumptionToAdd, uint256 consumptionToRemove, uint256 timestamp)
```

_Emmited when called updateEnergyConsumptionsAndGetResult()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender who updated the energy consumption |
| whoseConsumption | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier |
| consumptionToAdd | uint256 |  |
| consumptionToRemove | uint256 |  |
| timestamp | uint256 | The timestamp when the energy consumption was updated |

### ENERGY_ORACLE_MANAGER_ROLE

```solidity
uint256 ENERGY_ORACLE_MANAGER_ROLE
```

_Keccak256 hashed `ENERGY_ORACLE_MANAGER_ROLE` string_

### ESCROW

```solidity
uint256 ESCROW
```

_Keccak256 hashed `ESCROW` string_

### onlyOracleProvider

```solidity
modifier onlyOracleProvider()
```

_Modifier to check if the caller is an energy oracle provider_

### constructor

```solidity
constructor(address main_) public
```

Constructor to initialize StakingManagement contract

_Grants `ENERGY_ORACLE_MANAGER_ROLE`, `ENERGY_ORACLE_PROVIDER_ROLE` and `ESCROW` roles to `msg.sender`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| main_ | address | The address of the main contract |

### changeMain

```solidity
function changeMain(address main_) public
```

Update Main contract address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| main_ | address | New Main contract address |

### recordSupplierPrice

```solidity
function recordSupplierPrice(uint256 supplierId, uint256 supplierPrice) external
```

Records the supplier energy price at a specific timestamp.

_Requirements:
- `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
- `supplierId` should exist_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The supplier address |
| supplierPrice | uint256 | The supplier price |

### recordEnergyProductions

```solidity
function recordEnergyProductions(uint256 producerId, uint256 production) external
```

Records the energy production by the producer at a specific timestamp.

_Requirements:
- `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
- `producer` must have `producerId`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producerId | uint256 | The producer ID |
| production | uint256 | The energy production value |

### recordConsumerConsumptions

```solidity
function recordConsumerConsumptions(address consumer, uint256 supplierId, uint256 consumption) external
```

Records the energy consumption for a consumer and supplier at a specific timestamp.

_Requirements:
- `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
- `consumer` must have supplier with `supplierId`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The consumer address |
| supplierId | uint256 | The supplier ID |
| consumption | uint256 | The energy consumption value |

### updateEnergyConsumptions

```solidity
function updateEnergyConsumptions(address consumer, uint256 supplierId, uint256 consumptionToAdd, uint256 consumptionToRemove) public
```

Updates the energy consumption debt for a consumer/supplier pair.

_Adds `consumptionToAdd` to and subtracts `consumptionToRemove` from the stored USD debt.
Requirements:
- `msg.sender` must have `ESCROW` role
- contract must not be paused
- `consumer` must hold the `ElectricityConsumerToken` for `supplierId`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The consumer address |
| supplierId | uint256 | The ID of the supplier |
| consumptionToAdd | uint256 | The USD amount to add to the consumer's debt |
| consumptionToRemove | uint256 | The USD amount to subtract from the consumer's debt |

### pause

```solidity
function pause() external
```

Pauses the contract

_Requirements:
- `msg.sender` must have ENERGY_ORACLE_MANAGER_ROLE_

### unpause

```solidity
function unpause() external
```

Unpauses the contract

_Requirements:
- `msg.sender` must have ENERGY_ORACLE_MANAGER_ROLE_

### supplierEnergyPrice

```solidity
function supplierEnergyPrice(uint256 supplierId) public view returns (uint256 price)
```

_Retrieves the price per energy consumption._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The id of the supplier. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| price | uint256 | The price of the energy consumption. |

### debtsUSD

```solidity
function debtsUSD(address consumer, uint256 supplierId) public view returns (uint256)
```

Retrieves the outstanding USD debt for a consumer under a given supplier.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer. |
| supplierId | uint256 | The ID of the supplier. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The outstanding USD debt amount for this consumer/supplier pair. |

### energyProductions

```solidity
function energyProductions(uint256 producerId) public view returns (uint256 production)
```

_Retrieves the production value for a specific energy production record._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producerId | uint256 | The ID of the producer. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| production | uint256 | The production value of the energy production record. |

### main

```solidity
function main() public view returns (contract Main)
```

Returns the Main contract reference

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract Main | The Main contract instance configured for this oracle |


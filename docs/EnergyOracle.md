# Solidity API

## ZeroAddressPassed

```solidity
error ZeroAddressPassed()
```

_Error to indicate that a zero address was passed as a parameter_

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

## IncorrectSupplier

```solidity
error IncorrectSupplier(address incorrectSupplier, uint256 supplierId)
```

_Error to indicate that the supplier address is incorrect_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| incorrectSupplier | address | The incorrect supplier address |
| supplierId | uint256 | The ID of the supplier |

## EnergyOracle

_This contract allows recording and retrieving energy consumption data for consumers and tokens.
The contract is managed by an Energy Oracle Provider who can record energy consumption and an Energy Oracle Manager
who can retrieve the consumption data._

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

### EnergyConsumptionPaid

```solidity
event EnergyConsumptionPaid(address sender, address whoseConsumption, uint256 supplierId, uint256 timestamp)
```

_Emmited when called updateEnergyConsumptionsAndGetResult()_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender who updated the energy consumption |
| whoseConsumption | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier |
| timestamp | uint256 | The timestamp when the energy consumption was updated |

### ENERGY_ORACLE_MANAGER_ROLE

```solidity
bytes32 ENERGY_ORACLE_MANAGER_ROLE
```

_Keccak256 hashed `ENERGY_ORACLE_MANAGER_ROLE` string_

### ENERGY_ORACLE_PROVIDER_ROLE

```solidity
bytes32 ENERGY_ORACLE_PROVIDER_ROLE
```

_Keccak256 hashed `ENERGY_ORACLE_PROVIDER_ROLE` string_

### ESCROW

```solidity
bytes32 ESCROW
```

_Keccak256 hashed `ESCROW` string_

### manager

```solidity
contract Manager manager
```

_Manager contract_

### zeroAddressCheck

```solidity
modifier zeroAddressCheck(address account)
```

_Throws if passed address 0 as parameter_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address to check |

### constructor

```solidity
constructor(contract Manager _manager) public
```

Constructor to initialize StakingManagement contract

_Grants `DEFAULT_ADMIN_ROLE`, `ENERGY_ORACLE_MANAGER_ROLE` and `ENERGY_ORACLE_PROVIDER_ROLE` roles to `msg.sender`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _manager | contract Manager | The address of the manager contract |

### changeManager

```solidity
function changeManager(contract Manager _newManager) external
```

_Changes `manager` address to the `_newManager` address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newManager | contract Manager | The address of the new manger contract |

### recordEnergyProductions

```solidity
function recordEnergyProductions(address supplier, uint256 supplierId, uint256 production) external
```

Records the energy production by the supplier at a specific timestamp.

_Requirements:
- `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
- `supplier` must have `supplierId`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The supplier address |
| supplierId | uint256 | The supplier ID |
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
function updateEnergyConsumptions(address consumer, uint256 supplierId) public
```

Updates the energy consumption for a consumer, supplier

_Retrieves the production value for a specific energy production record.
Requirements: `msg.sender` must have ESCROW role_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The consumer address |
| supplierId | uint256 | The ID of the supplier. |

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

### energyConsumptions

```solidity
function energyConsumptions(address consumer, uint256 supplierId) public view returns (uint256 consumption)
```

_Retrieves the consumption value for a specific energy consumption record._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer. |
| supplierId | uint256 | The ID of the supplier. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumption | uint256 | The consumption value of the energy consumption record. |

### energyProductions

```solidity
function energyProductions(address supplier, uint256 supplierId) public view returns (uint256 production)
```

_Retrieves the production value for a specific energy production record._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier. |
| supplierId | uint256 | The ID of the supplier. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| production | uint256 | The production value of the energy production record. |


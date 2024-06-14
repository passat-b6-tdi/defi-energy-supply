# Solidity API

## EnergyOracle

_This contract allows recording and retrieving energy consumption data for consumers and tokens.
The contract is managed by an Energy Oracle Provider who can record energy consumption and an Energy Oracle Manager
who can retrieve the consumption data._

### EnergyConsumptionRecorded

```solidity
event EnergyConsumptionRecorded(address sender, address whoseConsumption, uint256 supplierId, uint256 consumption, uint256 timestamp)
```

_Emmited when an Energy Oracle provider_

### EnergyConsumptionPaid

```solidity
event EnergyConsumptionPaid(address sender, address whoseConsumption, uint256 supplierId, uint256 timestamp)
```

_Emmited when called updateEnergyConsumptionsAndGetResult()_

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

### isCorrectUser

```solidity
modifier isCorrectUser(address account, uint256 supplierId)
```

_Throws if passed address 0 as parameter_

### constructor

```solidity
constructor(contract IManager _manager) public
```

Constructor to initialize StakingManagement contract

_Grants `DEFAULT_ADMIN_ROLE`, `ENERGY_ORACLE_MANAGER_ROLE` and `ENERGY_ORACLE_PROVIDER_ROLE` roles to `msg.sender`_

### recordEnergyProduction

```solidity
function recordEnergyProduction(address supplier, uint256 supplierId, uint256 production) external
```

Records the energy production by the supplier at a specific timestamp.
@dev
Requirements:
- `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
- `supplier` must have `supplierId`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The supplier address |
| supplierId | uint256 | The supplier ID |
| production | uint256 | The energy production value |

### recordEnergyConsumption

```solidity
function recordEnergyConsumption(address consumer, uint256 supplierId, uint256 consumption) external
```

Records the energy consumption for a consumer and supplier at a specific timestamp.
@dev
Requirements:
- `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
- `consumer` must have supplier with `supplierId`

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
Requirements: `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The consumer address |
| supplierId | uint256 | The supplier ID |

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


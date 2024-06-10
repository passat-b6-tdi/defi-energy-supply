# Solidity API

## EnergyConsumption

```solidity
struct EnergyConsumption {
  uint256 timestamp;
  uint256 consumption;
}
```

## EnergyOracle

_This contract allows recording and retrieving energy consumption data for users and tokens.
The contract is managed by an Energy Oracle Provider who can record energy consumption and an Energy Oracle Manager
who can retrieve the consumption data._

### EnergyConsumptionRecorded

```solidity
event EnergyConsumptionRecorded(address sender, address whoseConsumption, uint256 supplierId, uint256 consumption, uint256 timestamp)
```

_Emmited when an Energy Oracle provider_

### EnergyConsumptionSent

```solidity
event EnergyConsumptionSent(address sender, address whoseConsumption, uint256 supplierId, uint256 consumption, uint256 timestamp)
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

### recordEnergyConsumption

```solidity
function recordEnergyConsumption(address user, uint256 supplierId, uint256 timestamp, uint256 consumption) external
```

Records the energy consumption for a user and token at a specific timestamp.
@dev
Requirements:
- `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
- `user` must have token with `supplierId`
- `timestamp` must be equal to 21:00

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user address |
| supplierId | uint256 | The token ID |
| timestamp | uint256 | The timestamp for the energy consumption |
| consumption | uint256 | The energy consumption value |

### updateEnergyConsumptionsAndGetResult

```solidity
function updateEnergyConsumptionsAndGetResult(address user, uint256 supplierId) public returns (uint256 consumption)
```

Gets the energy consumption for a user, token
Requirements: `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user address |
| supplierId | uint256 | The token ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumption | uint256 | The energy consumption value |

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
function energyConsumptions(address user, uint256 supplierId, uint256 id) public view returns (uint256 timestamp, uint256 consumption)
```

_Retrieves the timestamp and consumption value for a specific energy consumption record._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user. |
| supplierId | uint256 | The ID of the token. |
| id | uint256 | The index of the energy consumption record. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| timestamp | uint256 | The timestamp of the energy consumption record. |
| consumption | uint256 | The consumption value of the energy consumption record. |


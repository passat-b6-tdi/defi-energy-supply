# Solidity API

## IEnergyOracle

_This contract allows recording and retrieving energy consumption data for users and tokens.
The contract is managed by an Oracle Provider who can record energy consumption and an Energy Oracle Manager
who can retrieve the consumption data._

### updateEnergyConsumptionsAndGetResult

```solidity
function updateEnergyConsumptionsAndGetResult(address user, uint256 supplierId) external returns (uint256 consumption)
```

Gets the energy consumption for a user, token
Requirements: `msg.sender` must have ORACLE_PROVIDER_ROLE

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user address |
| supplierId | uint256 | The token ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumption | uint256 | The energy consumption value |

### recordEnergyConsumption

```solidity
function recordEnergyConsumption(address user, uint256 supplierId, uint256 timestamp, uint256 consumption) external
```

Records the energy consumption for a user and token at a specific timestamp.
@dev
Requirements:
- `msg.sender` must have ORACLE_PROVIDER_ROLE
- `user` must have token with `supplierId`
- `timestamp` must be equal to 21:00

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user address |
| supplierId | uint256 | The token ID |
| timestamp | uint256 | The timestamp for the energy consumption |
| consumption | uint256 | The energy consumption value |

### energyConsumptions

```solidity
function energyConsumptions(address user, uint256 supplierId, uint256 id) external view returns (uint256 timestamp, uint256 consumption)
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


# Solidity API

## IEnergyOracle

_This contract allows recording and retrieving energy consumption data for consumers and tokens.
The contract is managed by an Energy Oracle Provider who can record energy consumption and an Energy Oracle Manager
who can retrieve the consumption data._

### updateEnergyConsumptions

```solidity
function updateEnergyConsumptions(address consumer, uint256 supplierId) external
```

Gets the energy consumption for a consumer to supplier
Requirements: `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The consumer address |
| supplierId | uint256 | The supplier ID |

### recordEnergyConsumption

```solidity
function recordEnergyConsumption(address consumer, uint256 supplierId, uint256 timestamp, uint256 consumption) external
```

Records the energy consumption for a consumer to supplier at a specific timestamp.
@dev
Requirements:
- `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
- `consumer` must have token with `supplierId`
- `timestamp` must be equal to 21:00

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The consumer address |
| supplierId | uint256 | The supplier ID |
| timestamp | uint256 | The timestamp for the energy consumption |
| consumption | uint256 | The energy consumption value |

### energyConsumptions

```solidity
function energyConsumptions(address consumer, uint256 supplierId) external view returns (uint256 consumption)
```

_Retrieves the timestamp and consumption value for a specific energy consumption record._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer. |
| supplierId | uint256 | The ID of the supplier. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumption | uint256 | The consumption value of the energy consumption record. |


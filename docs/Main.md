# Solidity API

## ZeroAddressPassed

```solidity
error ZeroAddressPassed()
```

_Error to indicate that a zero address was passed as a parameter_

## OnlyEnergySupplier

```solidity
error OnlyEnergySupplier()
```

_Error to indicate that the caller is not an energy supplier_

## OnlyEnergyOracleProvider

```solidity
error OnlyEnergyOracleProvider()
```

_Error to indicate that the caller is not an energy oracle provider_

## Main

This contract allows managing energy suppliers, consumers, and oracle providers.
It also allows recording energy production and consumption, and handling payments.

_A main contract for managing Microgrid ecosystem._

### MAIN_MANAGER_ROLE

```solidity
bytes32 MAIN_MANAGER_ROLE
```

_Keccak256 hashed `MAIN_MANAGER_ROLE` string_

### manager

```solidity
contract Manager manager
```

_Manager contract_

### onlySupplier

```solidity
modifier onlySupplier(uint256 supplierId)
```

_Modifier to check if the caller is the owner of the supplierId_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The ID of the supplier |

### onlyOracleProvider

```solidity
modifier onlyOracleProvider()
```

_Modifier to check if the caller is an energy oracle provider_

### constructor

```solidity
constructor(contract Manager _manager) public
```

Constructor to initialize the Main contract.

_Grants `DEFAULT_ADMIN_ROLE` and `MAIN_MANAGER_ROLE` roles to the contract deployer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _manager | contract Manager | The address of the Manager contract. |

### changeManager

```solidity
function changeManager(contract Manager _newManager) external
```

_Changes `manager` address to the `_newManager` address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newManager | contract Manager | The address of the new manger contract |

### registerSupplier

```solidity
function registerSupplier(address supplier) external
```

Registers an Energy supplier.

_Requirements:
- `msg.sender` must have `MAIN_MANAGER_ROLE`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier. |

### registerElectricityConsumer

```solidity
function registerElectricityConsumer(address consumer, uint256 supplierId) external
```

Registers an Electricity consumer.

_Requirements:
- `supplierId` must be greater than 0.
- `msg.sender` must be a supplier._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer. |
| supplierId | uint256 | The ID of the supplier for the consumer. |

### registerOracleProvider

```solidity
function registerOracleProvider(address oracleProvider) external
```

Registers an Energy oracle provider.

_Requirements:
- `msg.sender` must have `MAIN_MANAGER_ROLE`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracleProvider | address | The address of the oracle provider. |

### unRegisterSupplier

```solidity
function unRegisterSupplier(uint256 supplierId) external
```

Unregisters an Energy supplier.

_Requirements:
- `supplierId` must be greater than 0.
- `msg.sender` must have `MAIN_MANAGER_ROLE`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The ID of the supplier. |

### unRegisterElectricityConsumer

```solidity
function unRegisterElectricityConsumer(address consumer, uint256 supplierId) external
```

Unregisters an Electricity consumer.

_Requirements:
- `supplierId` must be greater than 0.
- `msg.sender` must be a supplier._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer. |
| supplierId | uint256 | The ID of the supplier for the consumer. |

### unRegisterOracleProvider

```solidity
function unRegisterOracleProvider(uint256 oracleProviderId) external
```

Unregisters an Energy oracle provider.

_Requirements:
- `oracleProviderId` must be greater than 0.
- `msg.sender` must have `MAIN_MANAGER_ROLE`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracleProviderId | uint256 | The ID of the oracle provider. |

### recordEnergyProductions

```solidity
function recordEnergyProductions(address supplier, uint256 supplierId, uint256 production) external
```

Records the energy production by the supplier at a specific timestamp.

_Requirements:
- `msg.sender` must be an energy oracle provider.
- `supplier` must have `supplierId`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The supplier address. |
| supplierId | uint256 | The supplier ID. |
| production | uint256 | The energy production value. |

### recordConsumerConsumptions

```solidity
function recordConsumerConsumptions(address consumer, uint256 supplierId, uint256 consumption) external
```

Records the energy consumption for a consumer and supplier at a specific timestamp.

_Requirements:
- `msg.sender` must be an energy oracle provider.
- `consumer` must have a supplier with `supplierId`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The consumer address. |
| supplierId | uint256 | The supplier ID. |
| consumption | uint256 | The energy consumption value. |

### payForElectricity

```solidity
function payForElectricity(uint256 supplierId) external
```

Pays for electricity.

_Requirements:
- `supplierId` must be greater than 0.
- `msg.sender` must be a consumer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The ID of the supplier for the consumer. |

### getRewards

```solidity
function getRewards(uint256 supplierId) external
```

Gets the rewards for a supplier.

_Requirements:
- `supplierId` must be greater than 0.
- `msg.sender` must be a supplier._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The ID of the supplier. |


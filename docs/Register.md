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

## Register

This contract allows for registering and unregistering suppliers, consumers, and oracle providers in the energy microgrid system.
It ensures that only authorized roles can perform these operations and emits events for tracking.

_This contract manages the registration and unregistration of energy suppliers, consumers, and oracle providers._

### SupplierRegistered

```solidity
event SupplierRegistered(address sender, address supplier, uint256 supplierId, uint256 timestamp)
```

_Emitted when a user registers as an Energy supplier_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| supplier | address | The address of the supplier |
| supplierId | uint256 | The ID of the supplier |
| timestamp | uint256 | The timestamp of registration |

### SupplierUnregistered

```solidity
event SupplierUnregistered(address sender, address supplier, uint256 supplierId, uint256 timestamp)
```

_Emitted when an Energy supplier unregisters_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| supplier | address | The address of the supplier |
| supplierId | uint256 | The ID of the supplier |
| timestamp | uint256 | The timestamp of unregistration |

### ConsumerRegistered

```solidity
event ConsumerRegistered(address sender, address consumer, uint256 supplierId, address supplierAddress, uint256 timestamp)
```

_Emitted when a supplier registers a user as Electricity consumer_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| consumer | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier |
| supplierAddress | address | The address of the supplier |
| timestamp | uint256 | The timestamp of registration |

### ConsumerUnregistered

```solidity
event ConsumerUnregistered(address sender, address consumer, uint256 supplierId, address supplierAddress, uint256 timestamp)
```

_Emitted when a supplier unregisters an Electricity consumer_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| consumer | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier |
| supplierAddress | address | The address of the supplier |
| timestamp | uint256 | The timestamp of unregistration |

### OracleProviderRegistered

```solidity
event OracleProviderRegistered(address sender, address oracleProvider, uint256 oracleProviderId, uint256 timestamp)
```

_Emitted when a user registers as an Energy oracle provider_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| oracleProvider | address | The address of the oracle provider |
| oracleProviderId | uint256 | The ID of the oracle provider |
| timestamp | uint256 | The timestamp of registration |

### OracleProviderUnregistered

```solidity
event OracleProviderUnregistered(address sender, address oracleProvider, uint256 oracleProviderId, uint256 timestamp)
```

_Emitted when an Energy oracle provider unregisters_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| oracleProvider | address | The address of the oracle provider |
| oracleProviderId | uint256 | The ID of the oracle provider |
| timestamp | uint256 | The timestamp of unregistration |

### REGISTER_MANAGER_ROLE

```solidity
bytes32 REGISTER_MANAGER_ROLE
```

_Keccak256 hashed `REGISTER_MANAGER_ROLE` string_

### manager

```solidity
contract Manager manager
```

_Manager contract_

### currentSupplierId

```solidity
uint256 currentSupplierId
```

_Counter of suppliers Ids_

### currentOracleProviderId

```solidity
uint256 currentOracleProviderId
```

_Counter of oracle providers Ids_

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

Constructor to initialize Register contract

_Grants `DEFAULT_ADMIN_ROLE` and `REGISTER_MANAGER_ROLE` roles to `msg.sender`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _manager | contract Manager | The address of the Manager contract |

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
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `supplier` must not be address 0
- `supplier` must have NRGS token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier |

### registerElectricityConsumer

```solidity
function registerElectricityConsumer(address consumer, uint256 supplierId) external
```

Registers an Electricity consumer.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `consumer` must not be address 0_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier for the consumer |

### registerOracleProvider

```solidity
function registerOracleProvider(address oracleProvider) external
```

Registers an Energy oracle provider.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `oracleProvider` must not be address 0_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracleProvider | address | The address of the oracle provider |

### unRegisterSupplier

```solidity
function unRegisterSupplier(uint256 supplierId) external
```

Unregisters an Energy supplier.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `supplier` must have NRGS token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The ID of the supplier |

### unRegisterElectricityConsumer

```solidity
function unRegisterElectricityConsumer(address consumer, uint256 supplierId) external
```

Unregisters an Electricity consumer.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `consumer` must not be address 0
- `consumer` must have ECU token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier for the consumer |

### unRegisterOracleProvider

```solidity
function unRegisterOracleProvider(uint256 oracleProviderId) external
```

Unregisters an Energy oracle provider.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `oracleProvider` must have NRGS token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracleProviderId | uint256 | The ID of the oracle provider |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

Supports interface for ERC1155Receiver and AccessControl

_See {IERC165-supportsInterface}._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| interfaceId | bytes4 | The interface ID to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the interface is supported, false otherwise |


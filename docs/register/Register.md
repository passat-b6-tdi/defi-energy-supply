# Solidity API

## Register

### SupplierRegistered

```solidity
event SupplierRegistered(address sender, address supplier, uint256 supplierId, uint256 timestamp)
```

_Emmited when a user registers as an Energy supplier_

### SupplierUnregistered

```solidity
event SupplierUnregistered(address sender, address supplier, uint256 supplierId, uint256 timestamp)
```

_Emmited when an Energy supplier unregisters_

### UserRegistered

```solidity
event UserRegistered(address sender, address consumer, uint256 supplierId, address supplierAddress, uint256 timestamp)
```

_Emmited when a supplier registers a user as Electricity consumer_

### UserUnregistered

```solidity
event UserUnregistered(address sender, address consumer, uint256 supplierId, address supplierAddress, uint256 timestamp)
```

_Emmited when a supplier unregisters an Electricity consumer_

### REGISTER_MANAGER_ROLE

```solidity
bytes32 REGISTER_MANAGER_ROLE
```

_Keccak256 hashed `REGISTER_MANAGER_ROLE` string_

### currentSupplierId

```solidity
uint256 currentSupplierId
```

_Counter of suppliers Ids_

### constructor

```solidity
constructor(contract IManager _manager) public
```

Constructor to initialize Register contract

_Grants `DEFAULT_ADMIN_ROLE` and `REGISTER_MANAGER_ROLE` roles to `msg.sender`_

### registerSupplier

```solidity
function registerSupplier(address supplier) external
```

Registers an Energy supplier.
Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE.
- `supplier` must not be address 0.
- `supplier` must have NRGS token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier. |

### registerElectricityConsumer

```solidity
function registerElectricityConsumer(address consumer, uint256 supplierId) external
```

Registers an Electricity consumer.
Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE.
- `consumer` must not be address 0.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer. |
| supplierId | uint256 | The ID of the supplier for the consumer. |

### unRegisterSupplier

```solidity
function unRegisterSupplier(uint256 supplierId) external
```

Unregisters an Energy supplier.
Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE.
- `supplier` must have NRGS token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The ID of the supplier. |

### unRegisterElectricityConsumer

```solidity
function unRegisterElectricityConsumer(address consumer, uint256 supplierId) external
```

Unregisters an Electricity consumer.
Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE.
- `consumer` must not be address 0.
- `consumer` must have ECU token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer. |
| supplierId | uint256 | The ID of the supplier for the consumer. |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_See {IERC165-supportsInterface}._


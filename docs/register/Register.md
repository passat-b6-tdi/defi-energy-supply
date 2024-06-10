# Solidity API

## Register

### SupplierRegistered

```solidity
event SupplierRegistered(address sender, address supplier, uint256 supplierId, uint256 amountOfUsers, uint256 timestamp)
```

_Emmited when a user registers as an Energy supplier_

### SupplierUnregistered

```solidity
event SupplierUnregistered(address sender, address supplier, uint256 supplierId, uint256 timestamp)
```

_Emmited when a user unregisters as an Energy supplier_

### UserRegistered

```solidity
event UserRegistered(address sender, address user, uint256 usersSupplierId, uint256 timestamp)
```

_Emmited when a user registers as an Electricity user_

### UserUnregistered

```solidity
event UserUnregistered(address sender, address user, uint256 usersSupplierId, uint256 timestamp)
```

_Emmited when a user unregisters as an Electricity user_

### REGISTER_MANAGER_ROLE

```solidity
bytes32 REGISTER_MANAGER_ROLE
```

_Keccak256 hashed `REGISTER_MANAGER_ROLE` string_

### constructor

```solidity
constructor(contract IManager _manager) public
```

Constructor to initialize Register contract

_Grants `DEFAULT_ADMIN_ROLE` and `REGISTER_MANAGER_ROLE` roles to `msg.sender`_

### registerSupplier

```solidity
function registerSupplier(address supplier, uint256 supplierId, uint256 amountOfUsers) external
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
| supplierId | uint256 | The ID of the supplier. |
| amountOfUsers | uint256 | The amount of users for the supplier. |

### registerElectricityUser

```solidity
function registerElectricityUser(address user, uint256 usersSupplierId) external
```

Registers an Electricity user.
Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE.
- `user` must not be address 0.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user. |
| usersSupplierId | uint256 | The ID of the supplier for the user. |

### unRegisterSupplier

```solidity
function unRegisterSupplier(address supplier, uint256 supplierId) external
```

Unregisters an Energy supplier.
Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE.
- `supplier` must not be address 0.
- `supplier` must have NRGS token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier. |
| supplierId | uint256 | The ID of the supplier. |

### unRegisterElectricityUser

```solidity
function unRegisterElectricityUser(address user, uint256 usersSupplierId) external
```

Unregisters an Electricity user.
Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE.
- `user` must not be address 0.
- `user` must have ELU token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user. |
| usersSupplierId | uint256 | The ID of the supplier for the user. |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_See {IERC165-supportsInterface}._


# Solidity API

## IRegister

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

### registerElectricityConsumer

```solidity
function registerElectricityConsumer(address user, uint256 supplierId) external
```

Registers an Electricity consumer.
Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE.
- `user` must not be address 0.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user. |
| supplierId | uint256 | The ID of the supplier. |

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
function unRegisterElectricityConsumer(address user, uint256 supplierId) external
```

Unregisters an Electricity consumer.
Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE.
- `user` must not be address 0.
- `user` must have ECU token.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The address of the user. |
| supplierId | uint256 | The ID of the supplier. |


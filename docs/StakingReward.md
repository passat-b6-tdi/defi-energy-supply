# Solidity API

## ZeroAddressPassed

```solidity
error ZeroAddressPassed()
```

_Error to indicate that a zero address was passed as a parameter_

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

## SupplierNotEnteredStaking

```solidity
error SupplierNotEnteredStaking(address supplier)
```

_Error to indicate that the supplier has not entered staking_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier |

## StakingReward

This contract allows for entering and exiting staking, updating rewards, and sending rewards to suppliers.

_This contract manages the staking and reward distribution for energy suppliers._

### EnterStaking

```solidity
event EnterStaking(address sender, address supplier, uint256 timestamp)
```

_Emitted when a user registers as an Energy supplier_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| supplier | address | The address of the supplier |
| timestamp | uint256 | The timestamp of entering staking |

### ExitStaking

```solidity
event ExitStaking(address sender, address supplier, uint256 timestamp)
```

_Emitted when a user unregisters as an Energy supplier_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| supplier | address | The address of the supplier |
| timestamp | uint256 | The timestamp of exiting staking |

### RewardSent

```solidity
event RewardSent(address sender, address to, uint256 amount)
```

_Emitted when a supplier withdraws some amount of rewards from `StakingReward`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| to | address | The address of the recipient |
| amount | uint256 | The amount of rewards sent |

### Supplier

_Structure to hold supplier information_

```solidity
struct Supplier {
  uint256 updatedAt;
  uint256 pendingReward;
}
```

### STAKING_MANAGER_ROLE

```solidity
bytes32 STAKING_MANAGER_ROLE
```

_Keccak256 hashed `STAKING_MANAGER_ROLE` string_

### manager

```solidity
contract Manager manager
```

_Manager contract_

### totalSuppliers

```solidity
uint256 totalSuppliers
```

_Total suppliers_

### suppliers

```solidity
mapping(address => mapping(uint256 => struct StakingReward.Supplier)) suppliers
```

_Mapping from address to supplier ID to supplier information_

### isCorrectOwner

```solidity
modifier isCorrectOwner(address supplier, uint256 tokenId)
```

_Modifier to check if the caller is the correct owner of the supplier ID_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier |
| tokenId | uint256 | The ID of the supplier |

### zeroAddressCheck

```solidity
modifier zeroAddressCheck(address account)
```

_Modifier to check if the address is not zero_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address to check |

### constructor

```solidity
constructor(contract Manager _manager) public
```

Constructor to initialize StakingReward contract

_Grants `DEFAULT_ADMIN_ROLE` and `STAKING_MANAGER_ROLE` roles to `msg.sender`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _manager | contract Manager | The address of the Manager contract |

### changeManager

```solidity
function changeManager(contract Manager _newManager) external
```

_Changes `manager` address to the `_newManager` address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newManager | contract Manager | The address of the new manager contract |

### enterStaking

```solidity
function enterStaking(address supplier, uint256 tokenId) external
```

Enters staking process

_Requirements:
- `msg.sender` must have STAKING_MANAGER_ROLE
- `supplier` must not be address 0
- `supplier` must have NRGS token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier |
| tokenId | uint256 | The ID of the supplier |

### sendRewards

```solidity
function sendRewards(address supplier, uint256 tokenId) external
```

Sends rewards to suppliers

_Requirements:
- `msg.sender` must have STAKING_MANAGER_ROLE
- `supplier` must be in staking_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier |
| tokenId | uint256 | The ID of the supplier |

### exitStaking

```solidity
function exitStaking(address supplier, uint256 tokenId) external
```

Exits staking

_Requirements:
- `msg.sender` must have STAKING_MANAGER_ROLE
- `supplier` must be in staking_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier |
| tokenId | uint256 | The ID of the supplier |

### updateRewards

```solidity
function updateRewards(address supplier, uint256 tokenId) public returns (struct StakingReward.Supplier)
```

Updates rewards for `supplier`

_Requirements:
- `supplier` must be in staking_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier |
| tokenId | uint256 | The ID of the supplier |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct StakingReward.Supplier | Supplier The updated supplier information |


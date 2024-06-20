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

## Escrow

This contract allows consumers to pay for energy consumed from suppliers using ERC20 tokens.
It also allows the distribution of fees to the fee receiver.
The contract is managed by an Escrow Manager who can send funds to suppliers.

_A contract for managing energy payments and transfers between consumers and suppliers._

### PaidForEnergy

```solidity
event PaidForEnergy(address consumer, uint256 tokenId, address supplier, uint256 amount)
```

_Emmited when a consumer paid for energy_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer |
| tokenId | uint256 | The ID of the token representing the supplier |
| supplier | address | The address of the supplier |
| amount | uint256 | The amount paid for energy |

### ESCROW_MANAGER_ROLE

```solidity
bytes32 ESCROW_MANAGER_ROLE
```

_Keccak256 hashed `ESCROW_MANAGER_ROLE` string_

### manager

```solidity
contract Manager manager
```

_Manager contract_

### constructor

```solidity
constructor(contract Manager _manager) public
```

Constructor to initialize the Escrow contract

_Grants `DEFAULT_ADMIN_ROLE` and `ESCROW_MANAGER_ROLE` roles to the contract deployer._

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

### sendFundsToSupplier

```solidity
function sendFundsToSupplier(address consumer, uint256 supplierId) public
```

Sends funds to the supplier for the energy consumed by a consumer.
@dev
Requirements:
- `msg.sender` must have `ESCROW_MANAGER_ROLE`
- `consumer` must not be the zero address
- `consumer` must have consumed energy
- Transfers the required amount of tokens from the consumer to the escrow contract,
and then distributes the tokens to the supplier and fee receiver.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer. |
| supplierId | uint256 | The ID of the token representing the supplier. |


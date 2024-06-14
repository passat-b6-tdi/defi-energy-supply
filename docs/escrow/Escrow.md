# Solidity API

## Escrow

_A contract for managing energy payments and transfers between consumers and suppliers._

### PaidForEnergy

```solidity
event PaidForEnergy(address consumer, uint256 tokenId, address supplier, uint256 amount)
```

_Emmited when a consumer paid for energy_

### ESCROW_MANAGER_ROLE

```solidity
bytes32 ESCROW_MANAGER_ROLE
```

_Keccak256 hashed `ESCROW_MANAGER_ROLE` string_

### constructor

```solidity
constructor(contract IManager _manager) public
```

Constructor to initialize the Escrow contract

_Grants `DEFAULT_ADMIN_ROLE` and `ESCROW_MANAGER_ROLE` roles to the contract deployer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _manager | contract IManager | The address of the Manager contract. |

### sendFundsToSupplier

```solidity
function sendFundsToSupplier(address consumer, uint256 supplierId, uint256 paidAmount) public
```

_Sends funds to the supplier for the energy consumed by a consumer.
Requirements:
- `msg.sender` must have `ESCROW_MANAGER_ROLE`
- `paidAmount` must be > 0
- `consumer` must be not address 0_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer. |
| supplierId | uint256 | The ID of the token. |
| paidAmount | uint256 | The amount of funds sent by the consumer. |


# Solidity API

## IEscrow

_Interface for the Escrow contract._

### sendFundsToSupplier

```solidity
function sendFundsToSupplier(address consumer, uint256 supplierId, uint256 paidAmount) external
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


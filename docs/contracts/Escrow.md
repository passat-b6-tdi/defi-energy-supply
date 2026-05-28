# Solidity API

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

## TokenNotWhitelisted

```solidity
error TokenNotWhitelisted(address token)
```

_Error when a payment token is not supported_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The token address provided |

## Escrow

Manages payments from consumers to suppliers using whitelisted stablecoins

_Uses Main for configuration; only ESCROW_MANAGER_ROLE can call `sendFundsToSupplier`_

### PaidForEnergy

```solidity
event PaidForEnergy(address consumer, uint256 supplierId, address supplier, uint256 amount)
```

_Emitted when a consumer pays for energy_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier token |
| supplier | address | The address of the supplier |
| amount | uint256 | The amount paid for energy (excluding fees) |

### ESCROW_MANAGER_ROLE

```solidity
uint256 ESCROW_MANAGER_ROLE
```

_Keccak256 hashed `ESCROW_MANAGER_ROLE` string_

### constructor

```solidity
constructor(address main_) public
```

Constructor sets Main reference and grants roles

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| main_ | address | Address of the Main contract |

### changeMain

```solidity
function changeMain(address main_) public
```

Update Main contract address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| main_ | address | New Main contract address |

### payForElectricity

```solidity
function payForElectricity(uint256 supplierId, address paymentToken) external
```

Consumer pays for energy and fees in a whitelisted stablecoin

_Pulls total (consumption + fee), forwards to supplier and fee receiver, then clears debt_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | ID of the supplier (tokenId) |
| paymentToken | address | ERC20 token address (must be USDC, DAI or USDT) |

### main

```solidity
function main() public view returns (contract Main)
```

Returns the Main contract reference

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract Main | The Main contract instance configured for this escrow |


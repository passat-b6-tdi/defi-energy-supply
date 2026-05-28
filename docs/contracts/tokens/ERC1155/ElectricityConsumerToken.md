# Solidity API

## ElectricityConsumerToken

### constructor

```solidity
constructor() public
```

Constructor to initialize ECU contract.

_Grants each role to `msg.sender`.
Sets `name` and `symbol` of this token._

### name

```solidity
function name() public view returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() public view returns (string)
```

_Returns the symbol of the token._

### uri

```solidity
function uri(uint256) public pure returns (string)
```

Returns the static metadata URI used for every token id

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The constant metadata URI |

### mint

```solidity
function mint(address to, uint256 tokenId, uint256 amount) external
```

_Mints `to` address ECU token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address to mint the token to |
| tokenId | uint256 | The ID of the token to mint |
| amount | uint256 | The amount of users for the token being minted |

### burn

```solidity
function burn(address from, uint256 tokenId, uint256 amount) public
```

_Burns `from` address ECU token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address to burn the token from |
| tokenId | uint256 | The ID of the token to burn |
| amount | uint256 | The amount of tokens to burn |


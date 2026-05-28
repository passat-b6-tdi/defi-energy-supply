# Solidity API

## ERC20TokenBase

### constructor

```solidity
constructor(string _name, string _symbol) public
```

Constructor to initialize ERC20 token contract

_Grants owner and MINTER/BURNER roles to `msg.sender` and sets the token's `name` and `symbol`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _name | string | The token name |
| _symbol | string | The token symbol |

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

### mint

```solidity
function mint(address to, uint256 amount) external
```

_Mints `to` address some `amount` of tokens
Requirements:
- only `MINTER_ROLE`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to mint |
| amount | uint256 | of tokens to mint |

### burn

```solidity
function burn(address from, uint256 amount) external
```

_Burns `from` address some `amount` of tokens
Requirements:
- only `BURNER_ROLE`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | address to mint |
| amount | uint256 | of tokens to burn |


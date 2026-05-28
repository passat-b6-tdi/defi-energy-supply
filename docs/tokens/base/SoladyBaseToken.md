# Solidity API

## SoladyBaseToken

### MINTER_ROLE

```solidity
uint256 MINTER_ROLE
```

_Keccak256 hashed `MINTER_ROLE` string_

### BURNER_ROLE

```solidity
uint256 BURNER_ROLE
```

_Keccak256 hashed `BURNER_ROLE` string_

### NAME

```solidity
string NAME
```

### SYMBOL

```solidity
string SYMBOL
```

### constructor

```solidity
constructor(string _name, string _symbol) public
```

Constructor to initialize token contract

_Grants ownership and MINTER/BURNER roles to `msg.sender` and sets the token's `name` and `symbol`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _name | string | The token name |
| _symbol | string | The token symbol |

### name

```solidity
function name() public view virtual returns (string)
```

_Returns the name of the token._

### symbol

```solidity
function symbol() public view virtual returns (string)
```

_Returns the symbol of the token._


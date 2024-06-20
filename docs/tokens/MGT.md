# Solidity API

## MGT

### MINTER_BURNER_ROLE

```solidity
bytes32 MINTER_BURNER_ROLE
```

_Keccak256 hashed `MINTER_BURNER_ROLE` string_

### constructor

```solidity
constructor() public
```

Constructor to initialize ERC20 token contract

_Grants each roles to `msg.sender`
Sets `name` and `symbol` of ERC20 token_

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


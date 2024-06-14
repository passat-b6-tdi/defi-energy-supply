# Solidity API

## IMGT

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

### transfer

```solidity
function transfer(address to, uint256 amount) external returns (bool)
```

_Moves `amount` tokens from the caller's account to `to`.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### transferFrom

```solidity
function transferFrom(address from, address to, uint256 amount) external returns (bool)
```

_Moves `amount` tokens from `from` to `to` using the
allowance mechanism. `amount` is then deducted from the caller's
allowance.

Returns a boolean value indicating whether the operation succeeded.

Emits a {Transfer} event._

### increaseAllowance

```solidity
function increaseAllowance(address spender, uint256 addedValue) external returns (bool)
```

_Atomically increases the allowance granted to `spender` by the caller.

This is an alternative to {approve} that can be used as a mitigation for
problems described in {IERC20-approve}.

Emits an {Approval} event indicating the updated allowance.

Requirements:

- `spender` cannot be the zero address._


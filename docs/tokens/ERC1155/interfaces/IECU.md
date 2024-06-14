# Solidity API

## IECU

### mint

```solidity
function mint(address to, uint256 tokenId, uint256 amountOfUsers) external
```

_Mints `to` address ECU token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address to mint the token to |
| tokenId | uint256 | The ID of the token to mint |
| amountOfUsers | uint256 | The amount of consumers for the token being minted |

### burn

```solidity
function burn(address from, uint256 tokenId, uint256 amount) external
```

_Burns `from` address ECU token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address to burn the token from |
| tokenId | uint256 | The ID of the token to burn |
| amount | uint256 | The amount of tokens to burn |

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external
```

_See {IERC1155-safeTransferFrom}._

### balanceOf

```solidity
function balanceOf(address account, uint256 id) external view returns (uint256)
```

_See {IERC1155-balanceOf}.

Requirements:

- `account` cannot be the zero address._


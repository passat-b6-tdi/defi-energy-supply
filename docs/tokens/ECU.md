# Solidity API

## ECU

### REGISTER_ROLE

```solidity
bytes32 REGISTER_ROLE
```

_Keccak256 hashed `REGISTER_ROLE` string_

### name

```solidity
string name
```

_Name of this token_

### symbol

```solidity
string symbol
```

_Symbol of this token_

### constructor

```solidity
constructor() public
```

Constructor to initialize ECU contract.

_Grants each role to `msg.sender`.
Sets `name` and `symbol` of this token._

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
| amountOfUsers | uint256 | The amount of users for the token being minted |

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

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_See {IERC165-supportsInterface}._


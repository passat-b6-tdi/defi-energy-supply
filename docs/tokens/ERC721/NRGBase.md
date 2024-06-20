# Solidity API

## NRGBase

### REGISTER_ROLE

```solidity
bytes32 REGISTER_ROLE
```

_Keccak256 hashed `REGISTER_ROLE` string_

### constructor

```solidity
constructor(string _name, string _symbol) internal
```

Constructor to initialize NFT token contract

_Grants each roles to `msg.sender`
Sets `name` and `symbol` of ERC721 token_

### mint

```solidity
function mint(address to, uint256 tokenId) external
```

_Mints `to` address NRGOP token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | address to mint |
| tokenId | uint256 |  |

### burn

```solidity
function burn(uint256 tokenId) public
```

_Burns `from` address NRGOP token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | uint256 |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

_See {IERC165-supportsInterface}._


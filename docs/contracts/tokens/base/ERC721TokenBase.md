# Solidity API

## ERC721TokenBase

### _uri

```solidity
string _uri
```

### constructor

```solidity
constructor(string _name, string _symbol, string uri) public
```

Constructor to initialize NFT token contract

_Grants owner and MINTER/BURNER roles to `msg.sender`, sets `name`/`symbol`, and stores the metadata URI._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _name | string | The token name |
| _symbol | string | The token symbol |
| uri | string | The static metadata URI returned by `tokenURI` for any tokenId |

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

### tokenURI

```solidity
function tokenURI(uint256) public view returns (string)
```

Returns the static metadata URI used for every token id

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The metadata URI shared by all tokens |

### mint

```solidity
function mint(address to, uint256 tokenId) external
```

_Mints a token to `to`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address receiving the minted token |
| tokenId | uint256 | The id of the token to mint |

### burn

```solidity
function burn(uint256 tokenId) public
```

_Burns the token with the given `tokenId`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The id of the token to burn |


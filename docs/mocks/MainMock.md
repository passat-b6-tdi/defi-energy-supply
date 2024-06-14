# Solidity API

## MainMock

### escrow

```solidity
contract IEscrow escrow
```

### MGT

```solidity
contract IMGT MGT
```

### constructor

```solidity
constructor(contract IEscrow _escrow, contract IMGT _MGT) public
```

### send

```solidity
function send(address user, uint256 tokenId, uint256 paidAmount) public
```


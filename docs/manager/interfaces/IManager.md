# Solidity API

## IManager

### MGT

```solidity
function MGT() external view returns (contract IMGT)
```

_Microgrid token_

### ECU

```solidity
function ECU() external view returns (contract IECU)
```

_Electricity Consumer User NFT token_

### NRGS

```solidity
function NRGS() external view returns (contract INRGS)
```

_Energy Supplier NFT token_

### staking

```solidity
function staking() external view returns (contract IStakingReward)
```

_Staking contract_

### energyOracle

```solidity
function energyOracle() external view returns (contract IEnergyOracle)
```

_Energy Oracle contract_

### escrow

```solidity
function escrow() external view returns (contract IEscrow)
```

_Escrow contract_

### register

```solidity
function register() external view returns (contract IRegister)
```

_Register contract_

### feeReceiver

```solidity
function feeReceiver() external view returns (address)
```

_Address where fees will be paid_

### rewardAmount

```solidity
function rewardAmount() external view returns (uint256)
```

_Amount of rewards to suppliers_

### tolerance

```solidity
function tolerance() external view returns (uint256)
```

_Tolerance for equality_

### fees

```solidity
function fees() external view returns (uint256)
```

_Fees for payments to creators_


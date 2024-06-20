# Solidity API

## ZeroAddressPassed

```solidity
error ZeroAddressPassed()
```

_Error to indicate that a zero address was passed as a parameter_

## Manager

This contract allows for managing and updating the addresses of token and functional contracts in the ecosystem.
It also manages configuration values like reward amounts and fees.

_This contract manages the links to various contracts and stores configuration values for the system._

### Tokens

_Structure to hold references to token contracts_

```solidity
struct Tokens {
  contract MGT mgt;
  contract ECU ecu;
  contract NRGS nrgs;
  contract NRGOP nrgop;
}
```

### Contracts

_Structure to hold references to functional contracts_

```solidity
struct Contracts {
  contract StakingReward staking;
  contract EnergyOracle oracle;
  contract Register register;
  contract Escrow escrow;
}
```

### Values

_Structure to hold configuration values_

```solidity
struct Values {
  uint256 rewardAmount;
  uint256 fees;
}
```

### MGTchanged

```solidity
event MGTchanged(address sender, contract MGT newMGT)
```

_Emitted when a manager changes the `MGT` link to another contract_

### ECUchanged

```solidity
event ECUchanged(address sender, contract ECU newECU)
```

_Emitted when a manager changes the `ECU` link to another contract_

### NRGSchanged

```solidity
event NRGSchanged(address sender, contract NRGS newNRGS)
```

_Emitted when a manager changes the `NRGS` link to another contract_

### NRGOPchanged

```solidity
event NRGOPchanged(address sender, contract NRGOP newNRGOP)
```

_Emitted when a manager changes the `NRGOP` link to another contract_

### StakingChanged

```solidity
event StakingChanged(address sender, contract StakingReward staking)
```

_Emitted when a manager changes the `staking` link to another contract_

### OracleChanged

```solidity
event OracleChanged(address sender, contract EnergyOracle energyOracle)
```

_Emitted when a manager changes the `energyOracle` link to another contract_

### RegisterChanged

```solidity
event RegisterChanged(address sender, contract Register register)
```

_Emitted when a manager changes the `register` link to another contract_

### EscrowChanged

```solidity
event EscrowChanged(address sender, contract Escrow escrow)
```

_Emitted when a manager changes the `escrow` link to another contract_

### FeeReceiverChanged

```solidity
event FeeReceiverChanged(address sender, address newReceiver)
```

_Emitted when a manager changes the `feeReceiver` link to another address_

### RewardAmountChanged

```solidity
event RewardAmountChanged(address sender, uint256 newRewardAmount)
```

_Emitted when a manager changes the `rewardAmount`_

### FeesChanged

```solidity
event FeesChanged(address sender, uint256 newFees)
```

_Emitted when a manager changes the `fees`_

### MANAGER_ROLE

```solidity
bytes32 MANAGER_ROLE
```

_Keccak256 hashed `MANAGER_ROLE` string_

### _contracts

```solidity
struct Manager.Contracts _contracts
```

_Contracts struct_

### feeReceiver

```solidity
address feeReceiver
```

_Address where fees will be paid_

### _values

```solidity
struct Manager.Values _values
```

_Values struct_

### constructor

```solidity
constructor(struct Manager.Tokens tokens_, address _feeReceiver, struct Manager.Values values_) public
```

Constructor to initialize the Manager contract

_Grants `DEFAULT_ADMIN_ROLE` and `MANAGER_ROLE` roles to `msg.sender`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokens_ | struct Manager.Tokens | The initial addresses of the token contracts |
| _feeReceiver | address | The address of the fee receiver |
| values_ | struct Manager.Values | The initial values for reward amount and fees |

### changeTokensAddresses

```solidity
function changeTokensAddresses(struct Manager.Tokens tokens_) external
```

Changes tokens links to others.

_Requirements:
- `msg.sender` must have `MANAGER_ROLE`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokens_ | struct Manager.Tokens | The new addresses of the token contracts |

### changeContracts

```solidity
function changeContracts(struct Manager.Contracts contracts_) external
```

Changes contracts links to others.

_Requirements:
- `msg.sender` must have `MANAGER_ROLE`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contracts_ | struct Manager.Contracts | The new addresses of the functional contracts |

### changeFeeReceiver

```solidity
function changeFeeReceiver(address _newFeeReceiver) external
```

Changes `feeReceiver` link to another address.

_Requirements:
- `msg.sender` must have `MANAGER_ROLE`
- `_newFeeReceiver` must be not address 0_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newFeeReceiver | address | The new address of the fee receiver |

### changeValues

```solidity
function changeValues(struct Manager.Values values_) external
```

Changes configuration values.

_Requirements:
- `msg.sender` must have `MANAGER_ROLE`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| values_ | struct Manager.Values | The new configuration values |

### tokens

```solidity
function tokens() external view returns (struct Manager.Tokens)
```

Gets the current token contract addresses

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Manager.Tokens | The current token contract addresses |

### contracts

```solidity
function contracts() external view returns (struct Manager.Contracts)
```

Gets the current functional contract addresses

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Manager.Contracts | The current functional contract addresses |

### values

```solidity
function values() external view returns (struct Manager.Values)
```

Gets the current configuration values

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Manager.Values | The current configuration values |


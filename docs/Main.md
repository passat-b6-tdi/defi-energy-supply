# Solidity API

## ZeroAddressPassed

```solidity
error ZeroAddressPassed()
```

_Error to indicate that a zero address was passed as a parameter_

## Main

This contract allows for managing and updating the addresses of token and functional contracts in the ecosystem.
It also manages configuration values like reward amounts and fees, and stores immutable stablecoin addresses.

_This contract manages the links to various contracts and stores configuration values for the system._

### Tokens

_Structure to hold references to token contracts_

```solidity
struct Tokens {
  contract ERC20TokenBase energyCreditToken;
  contract ERC20TokenBase microgridGovernanceToken;
  contract ERC721TokenBase energyOracleProviderToken;
  contract ERC721TokenBase energyProducerToken;
  contract ERC721TokenBase energySupplierToken;
  contract ElectricityConsumerToken electricityConsumerToken;
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

### Fees

_Structure to hold references to fees related data_

```solidity
struct Fees {
  address receiver;
  uint256 amount;
}
```

### TokensUpdated

```solidity
event TokensUpdated(address sender, struct Main.Tokens tokens)
```

_Emitted when a manager changes the `Tokens _tokens`_

### ContractsUpdated

```solidity
event ContractsUpdated(address sender, struct Main.Contracts staking)
```

_Emitted when a manager changes the `Contracts _contracts`_

### FeesChanged

```solidity
event FeesChanged(address sender, address newFeeReceiver, uint256 newFees)
```

_Emitted when a manager changes the `feeReceiver` and `fees`_

### ValuesUpdated

```solidity
event ValuesUpdated(address sender, uint256 values)
```

_Emitted when a manager changes other configuration values_

### MANAGER_ROLE

```solidity
uint256 MANAGER_ROLE
```

_Keccak256 hashed `MANAGER_ROLE` string_

### MGT_TO_ORACLE_PROVIDER

```solidity
uint256 MGT_TO_ORACLE_PROVIDER
```

MGT amount minted to an oracle provider per recording action (0.05 MGT, 18 decimals)

### MGT_PER_ECT_CONSUMED

```solidity
uint256 MGT_PER_ECT_CONSUMED
```

MGT amount minted to a supplier per unit of consumed ECT (0.0005 MGT, 18 decimals)

### _contracts

```solidity
struct Main.Contracts _contracts
```

_Contracts struct storage_

### _fees

```solidity
struct Main.Fees _fees
```

_Fees struct storage_

### USDC

```solidity
address USDC
```

Immutable address of the USDC stablecoin used for payments

### DAI

```solidity
address DAI
```

Immutable address of the DAI stablecoin used for payments

### USDT

```solidity
address USDT
```

Immutable address of the USDT stablecoin used for payments

### constructor

```solidity
constructor(struct Main.Tokens tokens_, struct Main.Fees fees_, address USDC_, address DAI_, address USDT_) public
```

Constructor to initialize the Manager contract

_Grants `DEFAULT_ADMIN_ROLE` and `MANAGER_ROLE` roles to `msg.sender` and sets immutable stablecoin addresses_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokens_ | struct Main.Tokens | The initial addresses of the token contracts |
| fees_ | struct Main.Fees | The initial values for fees structure |
| USDC_ | address | The address of the USDC stablecoin contract |
| DAI_ | address | The address of the DAI stablecoin contract |
| USDT_ | address | The address of the USDT stablecoin contract |

### changeTokensAddresses

```solidity
function changeTokensAddresses(struct Main.Tokens tokens_) external
```

Changes token contract addresses

_Caller must have MANAGER_ROLE_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokens_ | struct Main.Tokens | The new addresses of the token contracts |

### changeContracts

```solidity
function changeContracts(struct Main.Contracts contracts_) external
```

Changes functional contract addresses

_Caller must have MANAGER_ROLE_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| contracts_ | struct Main.Contracts | The new addresses of the functional contracts |

### changeFees

```solidity
function changeFees(struct Main.Fees _newFees) external
```

Updates fees structure

_Caller must have MANAGER_ROLE; receiver must not be zero address_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _newFees | struct Main.Fees | The new fees structure |

### fees

```solidity
function fees() external view returns (struct Main.Fees)
```

Retrieves current fees structure

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Main.Fees | The fees structure |

### tokens

```solidity
function tokens() external view returns (struct Main.Tokens)
```

Retrieves current token contract addresses

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Main.Tokens | The token contract addresses structure |

### contracts

```solidity
function contracts() external view returns (struct Main.Contracts)
```

Retrieves current functional contract addresses

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Main.Contracts | The functional contract addresses structure |


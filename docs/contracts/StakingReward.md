# Solidity API

## ZeroAddressPassed

```solidity
error ZeroAddressPassed()
```

_Error to indicate that a zero address was passed as a parameter_

## IncorrectProducerId

```solidity
error IncorrectProducerId(uint256 producerId)
```

_Error to indicate that the caller is not the correct producer owner_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producerId | uint256 | The ID of the producer token |

## IncorrectProducer

```solidity
error IncorrectProducer(address producer, uint256 producerId)
```

_Error to indicate that the caller is not the correct producer owner_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producer | address | The address of the producer |
| producerId | uint256 | The ID of the producer token |

## ProducerNotEnteredStaking

```solidity
error ProducerNotEnteredStaking(uint256 producerId)
```

_Error to indicate that the producer has not entered staking_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producerId | uint256 | The id of the producer |

## OnlyRegister

```solidity
error OnlyRegister()
```

_Error thrown when caller is not the Register contract_

## StakingReward

Producers call enterStakingProducer, getProducerRewards, exitStakingProducer to manage their MGT rewards.

_This contract manages staking and reward distribution for energy producers._

### EnterStakingProducer

```solidity
event EnterStakingProducer(address producer, uint256 producerId, uint256 timestamp)
```

_Emitted when a producer enters staking_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producer | address | The address of the producer |
| producerId | uint256 | The address of the producerId |
| timestamp | uint256 | The timestamp of entering staking |

### ExitStakingProducer

```solidity
event ExitStakingProducer(address producer, uint256 producerId, uint256 timestamp)
```

_Emitted when a producer exits staking_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producer | address | The address of the producer |
| producerId | uint256 | The address of the producerId |
| timestamp | uint256 | The timestamp of exiting staking |

### RewardSentProducer

```solidity
event RewardSentProducer(address producer, uint256 amount)
```

_Emitted when a producer withdraws reward_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producer | address | The address of the producer |
| amount | uint256 | The amount of rewards sent |

### ProducerInfo

_Structure to hold producer staking info_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct ProducerInfo {
  uint256 updatedAt;
  uint256 pendingReward;
}
```

### totalProducers

```solidity
uint256 totalProducers
```

Total number of producers currently staking

### producers

```solidity
mapping(uint256 => struct StakingReward.ProducerInfo) producers
```

Mapping of producerId to staking info

### onlyRegister

```solidity
modifier onlyRegister()
```

_Modifier to that the caller is the Register contract_

### isCorrectOwner

```solidity
modifier isCorrectOwner(address producer, uint256 producerId)
```

_Modifier to check producer ownership of tokenId_

### constructor

```solidity
constructor(address main_) public
```

Constructor initializes StakingReward with Main reference

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| main_ | address | The address of the Main contract |

### changeMain

```solidity
function changeMain(address main_) public
```

Update Main contract address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| main_ | address | New Main contract address |

### enterStakingProducer

```solidity
function enterStakingProducer(uint256 producerId) external
```

Producer enters staking to start accumulating MGT rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producerId | uint256 | The ID of the producer token |

### exitStakingProducer

```solidity
function exitStakingProducer(uint256 producerId) external
```

Producer exits staking and claims rewards

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producerId | uint256 | The ID of the producer token |

### getProducerRewards

```solidity
function getProducerRewards(uint256 producerId) external
```

Producer claims accumulated rewards without exiting staking

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producerId | uint256 | The ID of the producer token |

### updateProducerInfo

```solidity
function updateProducerInfo(address producer, uint256 producerId) public returns (struct StakingReward.ProducerInfo)
```

Update and return the current ProducerInfo for the given producer.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producer | address | The address of the producer (must own `producerId`) |
| producerId | uint256 | The ID of the producer token |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct StakingReward.ProducerInfo | The updated `ProducerInfo` containing latest timestamp and pending reward |

### main

```solidity
function main() public view returns (contract Main)
```

Returns the Main contract reference

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract Main | The Main contract instance configured for this staking contract |


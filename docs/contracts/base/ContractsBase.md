# Solidity API

## ZeroAddressPassed

```solidity
error ZeroAddressPassed()
```

_Error to indicate that a zero address was passed as a parameter_

## ContractsBase

Shared base contract holding the Main contract reference and a zero-address check modifier

### _main

```solidity
address _main
```

_Address of the Main contract used to read system configuration_

### zeroAddressCheck

```solidity
modifier zeroAddressCheck(address account)
```

_Throws if passed address 0 as parameter_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The address to check |

### constructor

```solidity
constructor(address main_) public
```

Initializes the base contract with the Main contract address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| main_ | address | The address of the Main contract |

### changeMain

```solidity
function changeMain(address main_) public virtual
```

_Changes `main` address to the `_main` address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| main_ | address | The address of the new main contract |


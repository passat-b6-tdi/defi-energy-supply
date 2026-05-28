# Solidity API

## ZeroAddressPassed

```solidity
error ZeroAddressPassed()
```

_Error to indicate that a zero address was passed as a parameter_

## OnlyEnergySupplier

```solidity
error OnlyEnergySupplier()
```

_Error thrown when caller is not an energy supplier_

## IncorrectConsumer

```solidity
error IncorrectConsumer(address incorrectConsumer, uint256 supplierId)
```

_Error to indicate that the consumer address is incorrect_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| incorrectConsumer | address | The incorrect consumer address |
| supplierId | uint256 | The ID of the supplier |

## ProducerAlreadyRegistered

```solidity
error ProducerAlreadyRegistered(address producer)
```

_Error when attempting to register a producer that's already registered_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producer | address | The producer address attempted to be re-registered |

## SupplierAlreadyRegistered

```solidity
error SupplierAlreadyRegistered(address supplier)
```

_Error when attempting to register a supplier that's already registered_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The supplier address attempted to be re-registered |

## OracleProviderAlreadyRegistered

```solidity
error OracleProviderAlreadyRegistered(address op)
```

_Error when attempting to register a oracle provider that's already registered_

### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| op | address | The oracle provider address attempted to be re-registered |

## Register

This contract allows for registering and unregistering suppliers, consumers, and oracle providers in the energy microgrid system.
It ensures that only authorized roles can perform these operations and emits events for tracking.

_This contract manages the registration and unregistration of energy suppliers, consumers, and oracle providers._

### ProducerRegistered

```solidity
event ProducerRegistered(address sender, address producer, uint256 producerId, uint256 timestamp)
```

_Emitted when a user registers as an Energy producer_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| producer | address | The address of the producer |
| producerId | uint256 | The ID of the producer |
| timestamp | uint256 | The timestamp of registration |

### SupplierRegistered

```solidity
event SupplierRegistered(address sender, address supplier, uint256 supplierId, uint256 timestamp)
```

_Emitted when a user registers as an Energy supplier_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| supplier | address | The address of the supplier |
| supplierId | uint256 | The ID of the supplier |
| timestamp | uint256 | The timestamp of registration |

### ProducerUnregistered

```solidity
event ProducerUnregistered(address sender, uint256 producerId, uint256 timestamp)
```

_Emitted when an Energy producer unregisters_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| producerId | uint256 | The ID of the producer |
| timestamp | uint256 | The timestamp of unregistration |

### SupplierUnregistered

```solidity
event SupplierUnregistered(address sender, uint256 supplierId, uint256 timestamp)
```

_Emitted when an Energy supplier unregisters_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| supplierId | uint256 | The ID of the supplier |
| timestamp | uint256 | The timestamp of unregistration |

### ConsumerRegistered

```solidity
event ConsumerRegistered(address sender, address consumer, uint256 supplierId, uint256 timestamp)
```

_Emitted when a supplier registers a user as Electricity consumer_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| consumer | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier |
| timestamp | uint256 | The timestamp of registration |

### ConsumerUnregistered

```solidity
event ConsumerUnregistered(address sender, address consumer, uint256 supplierId, uint256 timestamp)
```

_Emitted when a supplier unregisters an Electricity consumer_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| consumer | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier |
| timestamp | uint256 | The timestamp of unregistration |

### OracleProviderRegistered

```solidity
event OracleProviderRegistered(address sender, address oracleProvider, uint256 oracleProviderId, uint256 timestamp)
```

_Emitted when a user registers as an Energy oracle provider_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| oracleProvider | address | The address of the oracle provider |
| oracleProviderId | uint256 | The ID of the oracle provider |
| timestamp | uint256 | The timestamp of registration |

### OracleProviderUnregistered

```solidity
event OracleProviderUnregistered(address sender, uint256 oracleProviderId, uint256 timestamp)
```

_Emitted when an Energy oracle provider unregisters_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sender | address | The address of the sender |
| oracleProviderId | uint256 | The ID of the oracle provider |
| timestamp | uint256 | The timestamp of unregistration |

### REGISTER_MANAGER_ROLE

```solidity
uint256 REGISTER_MANAGER_ROLE
```

_Keccak256 hashed `REGISTER_MANAGER_ROLE` string_

### currentProducerId

```solidity
uint256 currentProducerId
```

_Counter of producers Ids_

### currentSupplierId

```solidity
uint256 currentSupplierId
```

_Counter of suppliers Ids_

### currentOracleProviderId

```solidity
uint256 currentOracleProviderId
```

_Counter of oracle providers Ids_

### onlySupplier

```solidity
modifier onlySupplier(uint256 supplierId)
```

_Modifier to check if the caller is the owner of the supplierId_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The ID of the supplier |

### constructor

```solidity
constructor(address main_) public
```

Constructor to initialize Register contract

_Grants `DEFAULT_ADMIN_ROLE` and `REGISTER_MANAGER_ROLE` roles to `msg.sender`_

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

### registerProducer

```solidity
function registerProducer(address producer) external
```

Registers an Energy producer.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `producer` must not be address 0
- `producer` must have EnergyProducerToken_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producer | address | The address of the producer |

### registerSupplier

```solidity
function registerSupplier(address supplier) external
```

Registers an Energy supplier.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `supplier` must not be address 0
- `supplier` must have EnergySupplierToken token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplier | address | The address of the supplier |

### registerElectricityConsumer

```solidity
function registerElectricityConsumer(address consumer, uint256 supplierId) external
```

Registers an Electricity consumer.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `consumer` must not be address 0_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier for the consumer |

### registerOracleProvider

```solidity
function registerOracleProvider(address oracleProvider) external
```

Registers an Energy oracle provider.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `oracleProvider` must not be address 0_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracleProvider | address | The address of the oracle provider |

### unregisterProducer

```solidity
function unregisterProducer(uint256 producerId) external
```

Unregisters an Energy producer.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `producer` must have NRGS token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| producerId | uint256 | The ID of the producer |

### unregisterSupplier

```solidity
function unregisterSupplier(uint256 supplierId) external
```

Unregisters an Energy supplier.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `supplier` must have NRGS token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| supplierId | uint256 | The ID of the supplier |

### unregisterElectricityConsumer

```solidity
function unregisterElectricityConsumer(address consumer, uint256 supplierId) external
```

Unregisters an Electricity consumer.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `consumer` must not be address 0
- `consumer` must have ECU token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consumer | address | The address of the consumer |
| supplierId | uint256 | The ID of the supplier for the consumer |

### unregisterOracleProvider

```solidity
function unregisterOracleProvider(uint256 oracleProviderId) external
```

Unregisters an Energy oracle provider.

_Requirements:
- `msg.sender` must have REGISTER_MANAGER_ROLE
- `oracleProvider` must have NRGS token_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| oracleProviderId | uint256 | The ID of the oracle provider |

### main

```solidity
function main() public view returns (contract Main)
```

Returns the Main contract reference

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract Main | The Main contract instance configured for this register |


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";
import { Receiver } from "solady/src/accounts/Receiver.sol";

import { IToken } from "./interfaces/IToken.sol";
import { IContract } from "./interfaces/IContract.sol";
import { Main } from "./Main.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/// @dev Error to indicate that the consumer address is incorrect
/// @param incorrectConsumer The incorrect consumer address
/// @param supplierId The ID of the supplier
error IncorrectConsumer(address incorrectConsumer, uint256 supplierId);

/// @dev Error when attempting to register a producer that's already registered
/// @param producer The producer address attempted to be re-registered
error ProducerAlreadyRegistered(address producer);

/// @dev Error when attempting to register a supplier that's already registered
/// @param supplier The supplier address attempted to be re-registered
error SupplierAlreadyRegistered(address supplier);

/**
 * @title Contract for registration of suppliers and consumers
 * @dev This contract manages the registration and unregistration of energy suppliers, consumers, and oracle providers.
 * @notice This contract allows for registering and unregistering suppliers, consumers, and oracle providers in the energy microgrid system.
 * It ensures that only authorized roles can perform these operations and emits events for tracking.
 * @custom:security-contact security@example.com
 */
contract Register is Ownable, EnumerableRoles, Receiver {
    /// @dev Emitted when a user registers as an Energy producer
    /// @param sender The address of the sender
    /// @param producer The address of the producer
    /// @param producerId The ID of the producer
    /// @param timestamp The timestamp of registration
    event ProducerRegistered(
        address indexed sender,
        address indexed producer,
        uint256 indexed producerId,
        uint256 timestamp
    );

    /// @dev Emitted when a user registers as an Energy supplier
    /// @param sender The address of the sender
    /// @param supplier The address of the supplier
    /// @param supplierId The ID of the supplier
    /// @param timestamp The timestamp of registration
    event SupplierRegistered(
        address indexed sender,
        address indexed supplier,
        uint256 indexed supplierId,
        uint256 timestamp
    );

    /// @dev Emitted when an Energy producer unregisters
    /// @param sender The address of the sender
    /// @param producer The address of the supplier
    /// @param producerId The ID of the producer
    /// @param timestamp The timestamp of unregistration
    event ProducerUnregistered(
        address indexed sender,
        address indexed producer,
        uint256 indexed producerId,
        uint256 timestamp
    );

    /// @dev Emitted when an Energy supplier unregisters
    /// @param sender The address of the sender
    /// @param supplier The address of the supplier
    /// @param supplierId The ID of the supplier
    /// @param timestamp The timestamp of unregistration
    event SupplierUnregistered(
        address indexed sender,
        address indexed supplier,
        uint256 indexed supplierId,
        uint256 timestamp
    );

    /// @dev Emitted when a supplier registers a user as Electricity consumer
    /// @param sender The address of the sender
    /// @param consumer The address of the consumer
    /// @param supplierId The ID of the supplier
    /// @param supplierAddress The address of the supplier
    /// @param timestamp The timestamp of registration
    event ConsumerRegistered(
        address indexed sender,
        address indexed consumer,
        uint256 indexed supplierId,
        address supplierAddress,
        uint256 timestamp
    );

    /// @dev Emitted when a supplier unregisters an Electricity consumer
    /// @param sender The address of the sender
    /// @param consumer The address of the consumer
    /// @param supplierId The ID of the supplier
    /// @param supplierAddress The address of the supplier
    /// @param timestamp The timestamp of unregistration
    event ConsumerUnregistered(
        address indexed sender,
        address indexed consumer,
        uint256 indexed supplierId,
        address supplierAddress,
        uint256 timestamp
    );

    /// @dev Emitted when a user registers as an Energy oracle provider
    /// @param sender The address of the sender
    /// @param oracleProvider The address of the oracle provider
    /// @param oracleProviderId The ID of the oracle provider
    /// @param timestamp The timestamp of registration
    event OracleProviderRegistered(
        address indexed sender,
        address indexed oracleProvider,
        uint256 indexed oracleProviderId,
        uint256 timestamp
    );

    /// @dev Emitted when an Energy oracle provider unregisters
    /// @param sender The address of the sender
    /// @param oracleProvider The address of the oracle provider
    /// @param oracleProviderId The ID of the oracle provider
    /// @param timestamp The timestamp of unregistration
    event OracleProviderUnregistered(
        address indexed sender,
        address indexed oracleProvider,
        uint256 indexed oracleProviderId,
        uint256 timestamp
    );

    /// @dev Keccak256 hashed `REGISTER_MANAGER_ROLE` string
    uint256 public constant REGISTER_MANAGER_ROLE = uint256(keccak256(bytes("REGISTER_MANAGER_ROLE")));

    /// @dev Main contract
    Main public main;

    /// @dev Counter of producers Ids
    uint256 public currentProducerId = 1;

    /// @dev Counter of suppliers Ids
    uint256 public currentSupplierId = 1;

    /// @dev Counter of oracle providers Ids
    uint256 public currentOracleProviderId = 1;

    /// @dev Throws if passed address 0 as parameter
    /// @param account The address to check
    modifier zeroAddressCheck(address account) {
        if (account == address(0)) {
            revert ZeroAddressPassed();
        }
        _;
    }

    /// @notice Constructor to initialize Register contract
    /// @param _main The address of the Main contract
    /// @dev Grants `DEFAULT_ADMIN_ROLE` and `REGISTER_MANAGER_ROLE` roles to `msg.sender`
    constructor(Main _main) {
        _setOwner(msg.sender);

        main = _main;
    }

    /// @notice Changes the Main contract reference used for all registrations
    /// @param _main The address of the new Main contract
    function changeMain(Main _main) external onlyOwner zeroAddressCheck(address(_main)) {
        main = _main;
    }

    /**
     * @notice Registers an Energy producer.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `producer` must not be address 0
     * - `producer` must have EnergyProducerToken
     * @param producer The address of the producer
     */
    function registerProducer(address producer) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(producer) {
        Main _main = main;

        require(
            IToken(_main.tokens().energyProducerToken).balanceOf(producer) == 0,
            ProducerAlreadyRegistered(producer)
        );

        uint256 producerId = currentProducerId;
        ++currentProducerId;

        IToken(_main.tokens().energyProducerToken).mint(producer, producerId);
        IContract(_main.contracts().staking).enterStaking(producer, producerId);
        emit ProducerRegistered(msg.sender, producer, producerId, block.timestamp);
    }

    /**
     * @notice Registers an Energy supplier.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `supplier` must not be address 0
     * - `supplier` must have EnergySupplierToken token
     * @param supplier The address of the supplier
     */
    function registerSupplier(address supplier) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(supplier) {
        Main _main = main;

        require(
            IToken(_main.tokens().energySupplierToken).balanceOf(supplier) == 0,
            SupplierAlreadyRegistered(supplier)
        );

        uint256 supplierId = currentSupplierId;
        currentSupplierId++;

        IToken(_main.tokens().energySupplierToken).mint(supplier, supplierId);
        IContract(_main.contracts().staking).enterStaking(supplier, supplierId);
        emit SupplierRegistered(msg.sender, supplier, supplierId, block.timestamp);
    }

    /**
     * @notice Registers an Electricity consumer.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `consumer` must not be address 0
     * @param consumer The address of the consumer
     * @param supplierId The ID of the supplier for the consumer
     */
    function registerElectricityConsumer(
        address consumer,
        uint256 supplierId
    ) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(consumer) {
        Main.Tokens memory tokens = main.tokens();

        if (IToken(tokens.electricityConsumerToken).balanceOf(consumer, supplierId) != 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }

        address supplier = IToken(tokens.energySupplierToken).ownerOf(supplierId);
        IToken(tokens.electricityConsumerToken).mint(consumer, supplierId, 1);
        emit ConsumerRegistered(msg.sender, consumer, supplierId, supplier, block.timestamp);
    }

    /**
     * @notice Registers an Energy oracle provider.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `oracleProvider` must not be address 0
     * @param oracleProvider The address of the oracle provider
     */
    function registerOracleProvider(
        address oracleProvider
    ) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(oracleProvider) {
        uint256 oracleProviderId = currentOracleProviderId;
        currentOracleProviderId++;

        IToken(main.tokens().energyOracleProviderToken).mint(oracleProvider, oracleProviderId);
        emit OracleProviderRegistered(msg.sender, oracleProvider, oracleProviderId, block.timestamp);
    }

    /**
     * @notice Unregisters an Energy producer.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `producer` must have NRGS token
     * @param producerId The ID of the producer
     */
    function unregisterProducer(uint256 producerId) external onlyRole(REGISTER_MANAGER_ROLE) {
        Main _main = main;
        IToken energyProducerToken = IToken(_main.tokens().energyProducerToken);
        address producer = energyProducerToken.ownerOf(producerId);

        energyProducerToken.burn(producerId);
        IContract(_main.contracts().staking).exitStaking(producer, producerId);
        emit ProducerUnregistered(msg.sender, producer, producerId, block.timestamp);
    }

    /**
     * @notice Unregisters an Energy supplier.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `supplier` must have NRGS token
     * @param supplierId The ID of the supplier
     */
    function unregisterSupplier(uint256 supplierId) external onlyRole(REGISTER_MANAGER_ROLE) {
        Main _main = main;
        IToken energySupplierToken = IToken(_main.tokens().energySupplierToken);
        address supplier = energySupplierToken.ownerOf(supplierId);

        energySupplierToken.burn(supplierId);
        IContract(_main.contracts().staking).exitStaking(supplier, supplierId);
        emit SupplierUnregistered(msg.sender, supplier, supplierId, block.timestamp);
    }

    /**
     * @notice Unregisters an Electricity consumer.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `consumer` must not be address 0
     * - `consumer` must have ECU token
     * @param consumer The address of the consumer
     * @param supplierId The ID of the supplier for the consumer
     */
    function unregisterElectricityConsumer(
        address consumer,
        uint256 supplierId
    ) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(consumer) {
        Main.Tokens memory tokens = main.tokens();

        if (IToken(tokens.electricityConsumerToken).balanceOf(consumer, supplierId) == 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }

        address supplier = IToken(tokens.energySupplierToken).ownerOf(supplierId);

        IToken(tokens.electricityConsumerToken).burn(consumer, supplierId, 1);
        emit ConsumerUnregistered(msg.sender, consumer, supplierId, supplier, block.timestamp);
    }

    /**
     * @notice Unregisters an Energy oracle provider.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `oracleProvider` must have NRGS token
     * @param oracleProviderId The ID of the oracle provider
     */
    function unregisterOracleProvider(uint256 oracleProviderId) external onlyRole(REGISTER_MANAGER_ROLE) {
        IToken energyOracleProviderToken = IToken(main.tokens().energyOracleProviderToken);
        address oracleProvider = energyOracleProviderToken.ownerOf(oracleProviderId);

        energyOracleProviderToken.burn(oracleProviderId);
        emit OracleProviderUnregistered(msg.sender, oracleProvider, oracleProviderId, block.timestamp);
    }
}

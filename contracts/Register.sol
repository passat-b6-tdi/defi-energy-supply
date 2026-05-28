// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Receiver } from "solady/src/accounts/Receiver.sol";

import { OwnableEnumerableRoles } from "./base/OwnableEnumerableRoles.sol";
import { ContractsBase } from "./base/ContractsBase.sol";
import { Main } from "./Main.sol";

import { ERC721TokenBase } from "./tokens/base/ERC721TokenBase.sol";
import { ElectricityConsumerToken } from "./tokens/ERC1155/ElectricityConsumerToken.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/// @dev Error thrown when caller is not an energy supplier
error OnlyEnergySupplier();

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

/// @dev Error when attempting to register a oracle provider that's already registered
/// @param op The oracle provider address attempted to be re-registered
error OracleProviderAlreadyRegistered(address op);

/**
 * @title Contract for registration of suppliers and consumers
 * @dev This contract manages the registration and unregistration of energy suppliers, consumers, and oracle providers.
 * @notice This contract allows for registering and unregistering suppliers, consumers, and oracle providers in the energy microgrid system.
 * It ensures that only authorized roles can perform these operations and emits events for tracking.
 * @custom:security-contact security@example.com
 */
contract Register is OwnableEnumerableRoles, ContractsBase, Receiver {
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
    /// @param producerId The ID of the producer
    /// @param timestamp The timestamp of unregistration
    event ProducerUnregistered(address indexed sender, uint256 indexed producerId, uint256 timestamp);

    /// @dev Emitted when an Energy supplier unregisters
    /// @param sender The address of the sender
    /// @param supplierId The ID of the supplier
    /// @param timestamp The timestamp of unregistration
    event SupplierUnregistered(address indexed sender, uint256 indexed supplierId, uint256 timestamp);

    /// @dev Emitted when a supplier registers a user as Electricity consumer
    /// @param sender The address of the sender
    /// @param consumer The address of the consumer
    /// @param supplierId The ID of the supplier
    /// @param timestamp The timestamp of registration
    event ConsumerRegistered(
        address indexed sender,
        address indexed consumer,
        uint256 indexed supplierId,
        uint256 timestamp
    );

    /// @dev Emitted when a supplier unregisters an Electricity consumer
    /// @param sender The address of the sender
    /// @param consumer The address of the consumer
    /// @param supplierId The ID of the supplier
    /// @param timestamp The timestamp of unregistration
    event ConsumerUnregistered(
        address indexed sender,
        address indexed consumer,
        uint256 indexed supplierId,
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
    /// @param oracleProviderId The ID of the oracle provider
    /// @param timestamp The timestamp of unregistration
    event OracleProviderUnregistered(address indexed sender, uint256 indexed oracleProviderId, uint256 timestamp);

    /// @dev Keccak256 hashed `REGISTER_MANAGER_ROLE` string
    uint256 public constant REGISTER_MANAGER_ROLE = uint256(keccak256(bytes("REGISTER_MANAGER_ROLE")));

    /// @dev Counter of producers Ids
    uint256 public currentProducerId = 1;

    /// @dev Counter of suppliers Ids
    uint256 public currentSupplierId = 1;

    /// @dev Counter of oracle providers Ids
    uint256 public currentOracleProviderId = 1;

    /**
     * @dev Modifier to check if the caller is the owner of the supplierId
     * @param supplierId The ID of the supplier
     */
    modifier onlySupplier(uint256 supplierId) {
        if (main().tokens().energySupplierToken.ownerOf(supplierId) != msg.sender) {
            revert OnlyEnergySupplier();
        }
        _;
    }

    /// @notice Constructor to initialize Register contract
    /// @param main_ The address of the Main contract
    /// @dev Grants `DEFAULT_ADMIN_ROLE` and `REGISTER_MANAGER_ROLE` roles to `msg.sender`
    constructor(address main_) ContractsBase(main_) {
        _setRole(msg.sender, REGISTER_MANAGER_ROLE, true);
    }

    /// @notice Update Main contract address
    /// @param main_ New Main contract address
    function changeMain(address main_) public override onlyOwner {
        super.changeMain(main_);
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
        Main main_ = main();
        ERC721TokenBase pToken = main_.tokens().energyProducerToken;

        require(pToken.balanceOf(producer) == 0, ProducerAlreadyRegistered(producer));

        uint256 producerId = currentProducerId;
        ++currentProducerId;

        pToken.mint(producer, producerId);

        main_.contracts().staking.enterStakingProducer(producerId);
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
        ERC721TokenBase sToken = main().tokens().energySupplierToken;

        require(sToken.balanceOf(supplier) == 0, SupplierAlreadyRegistered(supplier));

        uint256 supplierId = currentSupplierId;
        currentSupplierId++;

        sToken.mint(supplier, supplierId);
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
    ) external onlySupplier(supplierId) zeroAddressCheck(consumer) {
        ElectricityConsumerToken elcToken = main().tokens().electricityConsumerToken;

        require(elcToken.balanceOf(consumer, supplierId) == 0, IncorrectConsumer(consumer, supplierId));

        elcToken.mint(consumer, supplierId, 1);
        emit ConsumerRegistered(msg.sender, consumer, supplierId, block.timestamp);
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
        ERC721TokenBase opToken = main().tokens().energyOracleProviderToken;

        require(opToken.balanceOf(oracleProvider) == 0, OracleProviderAlreadyRegistered(oracleProvider));

        uint256 oracleProviderId = currentOracleProviderId;
        currentOracleProviderId++;

        opToken.mint(oracleProvider, oracleProviderId);
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
        Main main_ = main();

        main_.contracts().staking.exitStakingProducer(producerId);
        main_.tokens().energyProducerToken.burn(producerId);

        emit ProducerUnregistered(msg.sender, producerId, block.timestamp);
    }

    /**
     * @notice Unregisters an Energy supplier.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `supplier` must have NRGS token
     * @param supplierId The ID of the supplier
     */
    function unregisterSupplier(uint256 supplierId) external onlyRole(REGISTER_MANAGER_ROLE) {
        main().tokens().energySupplierToken.burn(supplierId);

        emit SupplierUnregistered(msg.sender, supplierId, block.timestamp);
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
    ) external onlySupplier(supplierId) zeroAddressCheck(consumer) {
        Main.Tokens memory tokens = main().tokens();

        if (tokens.electricityConsumerToken.balanceOf(consumer, supplierId) == 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }

        tokens.electricityConsumerToken.burn(consumer, supplierId, 1);
        emit ConsumerUnregistered(msg.sender, consumer, supplierId, block.timestamp);
    }

    /**
     * @notice Unregisters an Energy oracle provider.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `oracleProvider` must have NRGS token
     * @param oracleProviderId The ID of the oracle provider
     */
    function unregisterOracleProvider(uint256 oracleProviderId) external onlyRole(REGISTER_MANAGER_ROLE) {
        main().tokens().energyOracleProviderToken.burn(oracleProviderId);

        emit OracleProviderUnregistered(msg.sender, oracleProviderId, block.timestamp);
    }

    /// @notice Returns the Main contract reference
    /// @return The Main contract instance configured for this register
    function main() public view returns (Main) {
        return Main(_main);
    }
}

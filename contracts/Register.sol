// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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

/**
 * @title Contract for registration of suppliers and consumers
 * @dev This contract manages the registration and unregistration of energy suppliers, consumers, and oracle providers.
 * @notice This contract allows for registering and unregistering suppliers, consumers, and oracle providers in the energy microgrid system.
 * It ensures that only authorized roles can perform these operations and emits events for tracking.
 * @custom:security-contact security@example.com
 */
contract Register is Ownable, EnumerableRoles, Receiver {
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

    /// @dev Changes `main` address to the `_main` address.
    /// @param _main The address of the new main contract
    function changeManager(Main _main) external onlyOwner zeroAddressCheck(address(_main)) {
        main = _main;
    }

    /**
     * @notice Registers an Energy supplier.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `supplier` must not be address 0
     * - `supplier` must have NRGS token
     * @param supplier The address of the supplier
     */
    function registerSupplier(address supplier) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(supplier) {
        Main _main = main;

        uint256 supplierId = currentSupplierId;
        currentSupplierId++;
        IToken(_main.tokens().nrgs).mint(supplier, supplierId);
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

        if (IToken(tokens.ecu).balanceOf(msg.sender, supplierId) != 0) {
            revert IncorrectConsumer(msg.sender, supplierId);
        }
        address supplier = IToken(tokens.nrgs).ownerOf(supplierId);
        IToken(tokens.ecu).mint(consumer, supplierId, 1);
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
        IToken(main.tokens().nrgop).mint(oracleProvider, oracleProviderId);
        emit OracleProviderRegistered(msg.sender, oracleProvider, oracleProviderId, block.timestamp);
    }

    /**
     * @notice Unregisters an Energy supplier.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `supplier` must have NRGS token
     * @param supplierId The ID of the supplier
     */
    function unRegisterSupplier(uint256 supplierId) external onlyRole(REGISTER_MANAGER_ROLE) {
        Main _main = main;
        IToken nrgs = IToken(_main.tokens().nrgs);
        address supplier = nrgs.ownerOf(supplierId);
        nrgs.burn(supplierId);
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
    function unRegisterElectricityConsumer(
        address consumer,
        uint256 supplierId
    ) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(consumer) {
        Main.Tokens memory tokens = main.tokens();
        if (IToken(tokens.ecu).balanceOf(consumer, supplierId) == 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }
        address supplier = IToken(tokens.nrgs).ownerOf(supplierId);
        IToken(tokens.ecu).burn(consumer, supplierId, 1);
        emit ConsumerUnregistered(msg.sender, consumer, supplierId, supplier, block.timestamp);
    }

    /**
     * @notice Unregisters an Energy oracle provider.
     * @dev Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE
     * - `oracleProvider` must have NRGS token
     * @param oracleProviderId The ID of the oracle provider
     */
    function unRegisterOracleProvider(uint256 oracleProviderId) external onlyRole(REGISTER_MANAGER_ROLE) {
        IToken nrgop = IToken(main.tokens().nrgop);
        address oracleProvider = nrgop.ownerOf(oracleProviderId);
        nrgop.burn(oracleProviderId);
        emit OracleProviderUnregistered(msg.sender, oracleProvider, oracleProviderId, block.timestamp);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC1155Holder, ERC1155Receiver } from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Manager } from "./Manager.sol";

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
contract Register is AccessControl, ERC1155Holder {
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
    bytes32 public constant REGISTER_MANAGER_ROLE = keccak256(bytes("REGISTER_MANAGER_ROLE"));

    /// @dev Manager contract
    Manager public manager;

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
    /// @param _manager The address of the Manager contract
    /// @dev Grants `DEFAULT_ADMIN_ROLE` and `REGISTER_MANAGER_ROLE` roles to `msg.sender`
    constructor(Manager _manager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTER_MANAGER_ROLE, msg.sender);
        manager = _manager;
    }

    /// @dev Changes `manager` address to the `_newManager` address.
    /// @param _newManager The address of the new manger contract
    function changeManager(
        Manager _newManager
    ) external onlyRole(DEFAULT_ADMIN_ROLE) zeroAddressCheck(address(_newManager)) {
        manager = _newManager;
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
        uint256 supplierId = currentSupplierId;
        currentSupplierId++;
        manager.tokens().nrgs.mint(supplier, supplierId);
        manager.contracts().staking.enterStaking(supplier, supplierId);
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
        if (manager.tokens().ecu.balanceOf(msg.sender, supplierId) != 0) {
            revert IncorrectConsumer(msg.sender, supplierId);
        }
        address supplier = manager.tokens().nrgs.ownerOf(supplierId);
        manager.tokens().ecu.mint(consumer, supplierId, 1);
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
        manager.tokens().nrgop.mint(oracleProvider, oracleProviderId);
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
        address supplier = manager.tokens().nrgs.ownerOf(supplierId);
        manager.tokens().nrgs.burn(supplierId);
        manager.contracts().staking.exitStaking(supplier, supplierId);
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
        if (manager.tokens().ecu.balanceOf(consumer, supplierId) == 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }
        address supplier = manager.tokens().nrgs.ownerOf(supplierId);
        manager.tokens().ecu.burn(consumer, supplierId, 1);
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
        address oracleProvider = manager.tokens().nrgop.ownerOf(oracleProviderId);
        manager.tokens().nrgop.burn(oracleProviderId);
        emit OracleProviderUnregistered(msg.sender, oracleProvider, oracleProviderId, block.timestamp);
    }

    /**
     * @inheritdoc AccessControl
     * @notice Supports interface for ERC1155Receiver and AccessControl
     * @param interfaceId The interface ID to check
     * @return True if the interface is supported, false otherwise
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Receiver, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

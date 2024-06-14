// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "../Parent.sol";

/**
 * @title Contract for registration of suppliers and consumers
 * @author Bohdan
 */
contract Register is Parent, ERC1155Holder {
    ///@dev Emmited when a user registers as an Energy supplier
    event SupplierRegistered(
        address indexed sender,
        address indexed supplier,
        uint256 indexed supplierId,
        uint256 timestamp
    );
    ///@dev Emmited when an Energy supplier unregisters
    event SupplierUnregistered(
        address indexed sender,
        address indexed supplier,
        uint256 indexed supplierId,
        uint256 timestamp
    );

    ///@dev Emmited when a supplier registers a user as Electricity consumer
    event ConsumerRegistered(
        address indexed sender,
        address indexed consumer,
        uint256 indexed supplierId,
        address supplierAddress,
        uint256 timestamp
    );
    ///@dev Emmited when a supplier unregisters an Electricity consumer
    event ConsumerUnregistered(
        address indexed sender,
        address indexed consumer,
        uint256 indexed supplierId,
        address supplierAddress,
        uint256 timestamp
    );

    /// @dev Keccak256 hashed `REGISTER_MANAGER_ROLE` string
    bytes32 public constant REGISTER_MANAGER_ROLE = keccak256(bytes("REGISTER_MANAGER_ROLE"));

    /// @dev Counter of suppliers Ids
    uint256 public currentSupplierId = 1;

    /// @notice Constructor to initialize Register contract
    /// @dev Grants `DEFAULT_ADMIN_ROLE` and `REGISTER_MANAGER_ROLE` roles to `msg.sender`
    constructor(IManager _manager) Parent(_manager) {
        _grantRole(REGISTER_MANAGER_ROLE, msg.sender);
    }

    /**
     * @notice Registers an Energy supplier.
     * Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE.
     * - `supplier` must not be address 0.
     * - `supplier` must have NRGS token.
     *
     * @param supplier The address of the supplier.
     */
    function registerSupplier(address supplier) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(supplier) {
        uint256 supplierId = currentSupplierId;

        currentSupplierId++;

        manager.NRGS().mint(supplier, supplierId);

        manager.staking().enterStaking(supplier, supplierId);

        emit SupplierRegistered(msg.sender, supplier, supplierId, block.timestamp);
    }

    /**
     * @notice Registers an Electricity consumer.
     * Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE.
     * - `consumer` must not be address 0.
     *
     * @param consumer The address of the consumer.
     * @param supplierId The ID of the supplier for the consumer.
     */
    function registerElectricityConsumer(
        address consumer,
        uint256 supplierId
    ) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(consumer) {
        require(
            manager.ECU().balanceOf(consumer, supplierId) == 0,
            "Register: can not register already registered consumer"
        );

        address supplier = manager.NRGS().ownerOf(supplierId);

        manager.ECU().mint(consumer, supplierId, 1);

        emit ConsumerRegistered(msg.sender, consumer, supplierId, supplier, block.timestamp);
    }

    /**
     * @notice Unregisters an Energy supplier.
     * Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE.
     * - `supplier` must have NRGS token.
     *
     * @param supplierId The ID of the supplier.
     */
    function unRegisterSupplier(uint256 supplierId) external onlyRole(REGISTER_MANAGER_ROLE) {
        address supplier = manager.NRGS().ownerOf(supplierId);

        manager.NRGS().burn(supplierId);

        manager.staking().exitStaking(supplier, supplierId);

        emit SupplierUnregistered(msg.sender, supplier, supplierId, block.timestamp);
    }

    /**
     * @notice Unregisters an Electricity consumer.
     * Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE.
     * - `consumer` must not be address 0.
     * - `consumer` must have ECU token.
     *
     * @param consumer The address of the consumer.
     * @param supplierId The ID of the supplier for the consumer.
     */
    function unRegisterElectricityConsumer(
        address consumer,
        uint256 supplierId
    ) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(consumer) {
        require(manager.ECU().balanceOf(consumer, supplierId) == 1, "Register: supplier is not correct");
        address supplier = manager.NRGS().ownerOf(supplierId);

        manager.ECU().burn(consumer, supplierId, 1);

        emit ConsumerUnregistered(msg.sender, consumer, supplierId, supplier, block.timestamp);
    }

    /// @inheritdoc AccessControl
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Receiver, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

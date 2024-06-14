// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "../Parent.sol";

/**
 * @title Contract for registration of suppliers and users
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
    ///@dev Emmited when a user unregisters as an Energy supplier
    event SupplierUnregistered(
        address indexed sender,
        address indexed supplier,
        uint256 indexed supplierId,
        uint256 timestamp
    );

    ///@dev Emmited when a user registers as an Electricity user
    event UserRegistered(
        address indexed sender,
        address indexed user,
        uint256 indexed usersSupplierId,
        address supplierAddress,
        uint256 timestamp
    );
    ///@dev Emmited when a user unregisters as an Electricity user
    event UserUnregistered(
        address indexed sender,
        address indexed user,
        uint256 indexed usersSupplierId,
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
     * @notice Registers an Electricity user.
     * Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE.
     * - `user` must not be address 0.
     *
     * @param user The address of the user.
     * @param usersSupplierId The ID of the supplier for the user.
     */
    function registerElectricityUser(
        address user,
        uint256 usersSupplierId
    ) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(user) {
        require(
            manager.ELU().balanceOf(user, usersSupplierId) == 0,
            "Register: can not register already registered user"
        );

        address supplier = manager.NRGS().ownerOf(usersSupplierId);

        manager.ELU().mint(user, usersSupplierId, 1);

        emit UserRegistered(msg.sender, user, usersSupplierId, supplier, block.timestamp);
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
     * @notice Unregisters an Electricity user.
     * Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE.
     * - `user` must not be address 0.
     * - `user` must have ELU token.
     *
     * @param user The address of the user.
     * @param usersSupplierId The ID of the supplier for the user.
     */
    function unRegisterElectricityUser(
        address user,
        uint256 usersSupplierId
    ) external onlyRole(REGISTER_MANAGER_ROLE) zeroAddressCheck(user) {
        require(manager.ELU().balanceOf(user, usersSupplierId) == 1, "Register: supplier is not correct");
        address supplier = manager.NRGS().ownerOf(usersSupplierId);

        manager.ELU().burn(user, usersSupplierId, 1);

        emit UserUnregistered(msg.sender, user, usersSupplierId, supplier, block.timestamp);
    }

    /// @inheritdoc AccessControl
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Receiver, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../Parent.sol";

/**
 * @title Main
 * @dev A main contract for managing Microgrid ecosystem.
 * @author Bohdan
 */
contract Main is Parent {
    /// @dev Keccak256 hashed `MAIN_MANAGER_ROLE` string
    bytes32 public constant MAIN_MANAGER_ROLE = keccak256(bytes("MAIN_MANAGER_ROLE"));
    /// @dev Keccak256 hashed `SUPPLIER_ROLE` string
    bytes32 public constant SUPPLIER_ROLE = keccak256(bytes("SUPPLIER_ROLE"));
    /// @dev Keccak256 hashed `USER_ROLE` string
    bytes32 public constant USER_ROLE = keccak256(bytes("USER_ROLE"));

    /**
     * @notice Constructor to initialize the Main contract.
     * @param _manager The address of the Manager contract.
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MAIN_MANAGER_ROLE`,`SUPPLIER_ROLE` and `USER_ROLE` roles to the contract deployer.
     */
    constructor(IManager _manager) Parent(_manager) {
        _grantRole(MAIN_MANAGER_ROLE, msg.sender);
        _grantRole(SUPPLIER_ROLE, msg.sender);
        _grantRole(USER_ROLE, msg.sender);
    }

    /**
     * @notice Registers an Energy supplier.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `buildingsNumber` must be greater than 0.
     * - `msg.sender` must have `MAIN_MANAGER_ROLE`.
     *
     * @param supplierId The ID of the supplier.
     * @param amountOfUsers The number of users to whom the supplier can provide electricity.
     */
    function registerSupplier(
        address supplier,
        uint256 supplierId,
        uint256 amountOfUsers
    ) external onlyRole(MAIN_MANAGER_ROLE) gtZero(amountOfUsers) {
        _grantRole(SUPPLIER_ROLE, supplier);
        manager.register().registerSupplier(supplier, supplierId, amountOfUsers);
    }

    /**
     * @notice Registers an Electricity user.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must have `SUPPLIER_ROLE`.
     *
     * @param usersSupplierId The ID of the supplier for the user.
     */
    function registerElectricityUser(address user, uint256 usersSupplierId) external onlyRole(SUPPLIER_ROLE) {
        _grantRole(USER_ROLE, user);
        manager.register().registerElectricityUser(user, usersSupplierId);
    }

    /**
     * @notice Unregisters an Energy supplier.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must have `MAIN_MANAGER_ROLE`.
     *
     * @param supplierId The ID of the supplier.
     */
    function unRegisterSupplier(uint256 supplierId) external onlyRole(MAIN_MANAGER_ROLE) {
        address supplier = manager.NRGS().ownerOf(supplierId);
        _revokeRole(SUPPLIER_ROLE, supplier);
        manager.register().unRegisterSupplier(supplier, supplierId);
    }

    /**
     * @notice Unregisters an Electricity user.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must have `USER_ROLE`.
     *
     * @param usersSupplierId The ID of the supplier for the user.
     */
    function unRegisterElectricityUser(address user, uint256 usersSupplierId) external onlyRole(SUPPLIER_ROLE) {
        _revokeRole(USER_ROLE, user);
        manager.register().unRegisterElectricityUser(user, usersSupplierId);
    }

    /**
     * @notice Pays for electricity.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `amountToPay` must be greater than 0.
     * - `msg.sender` must have `USER_ROLE`.
     *
     * @param usersSupplierId The ID of the supplier for the user.
     * @param amountToPay The amount to pay for electricity.
     */
    function payForElectricity(
        uint256 usersSupplierId,
        uint256 amountToPay
    ) external onlyRole(USER_ROLE) gtZero(amountToPay) {
        require(
            manager.MCGR().transferFrom(msg.sender, address(manager.escrow()), amountToPay + manager.fees()),
            "Main: transfer to Escrow failed"
        );
        manager.escrow().sendFundsToSupplier(msg.sender, usersSupplierId, amountToPay);
    }

    /**
     * @notice Gets the rewards for a supplier.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must have `SUPPLIER_ROLE`.
     *
     * @param supplierId The ID of the supplier.
     */
    function getRewards(uint256 supplierId) external onlyRole(SUPPLIER_ROLE) {
        manager.staking().sendRewards(msg.sender, supplierId);
    }
}

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

    modifier onlySupplier(uint256 supplierId) {
        require(manager.NRGS().ownerOf(supplierId) == msg.sender, "Main: only Energy Supplier");
        _;
    }

    /**
     * @notice Constructor to initialize the Main contract.
     * @param _manager The address of the Manager contract.
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MAIN_MANAGER_ROLE`,`SUPPLIER_ROLE` and `USER_ROLE` roles to the contract deployer.
     */
    constructor(IManager _manager) Parent(_manager) {
        _grantRole(MAIN_MANAGER_ROLE, msg.sender);
    }

    /**
     * @notice Registers an Energy supplier.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `buildingsNumber` must be greater than 0.
     * - `msg.sender` must have `MAIN_MANAGER_ROLE`.
     *
     * @param supplier The address of the supplier.
     */
    function registerSupplier(address supplier) external onlyRole(MAIN_MANAGER_ROLE) {
        manager.register().registerSupplier(supplier);
    }

    /**
     * @notice Registers an Electricity consumer.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a supplier.
     *
     * @param usersSupplierId The ID of the supplier for the user.
     */
    function registerElectricityUser(address user, uint256 usersSupplierId) external onlySupplier(usersSupplierId) {
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
        manager.register().unRegisterSupplier(supplierId);
    }

    /**
     * @notice Unregisters an Electricity consumer.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a supplier.
     *
     * @param usersSupplierId The ID of the supplier for the user.
     */
    function unRegisterElectricityUser(address user, uint256 usersSupplierId) external onlySupplier(usersSupplierId) {
        manager.register().unRegisterElectricityUser(user, usersSupplierId);
    }

    /**
     * @notice Pays for electricity.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `amountToPay` must be greater than 0.
     * - `msg.sender` must be a user.
     *
     * @param usersSupplierId The ID of the supplier for the user.
     * @param amountToPay The amount to pay for electricity.
     */
    function payForElectricity(uint256 usersSupplierId, uint256 amountToPay) external gtZero(amountToPay) {
        require(
            manager.ECU().balanceOf(msg.sender, usersSupplierId) > 0,
            "Main: only Electricity Consumers to Supplier"
        );

        require(
            manager.MGT().transferFrom(msg.sender, address(manager.escrow()), amountToPay + manager.fees()),
            "Main: transfer to Escrow failed"
        );

        manager.escrow().sendFundsToSupplier(msg.sender, usersSupplierId, amountToPay);
    }

    /**
     * @notice Gets the rewards for a supplier.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a supplier.
     *
     * @param supplierId The ID of the supplier.
     */
    function getRewards(uint256 supplierId) external onlySupplier(supplierId) {
        manager.staking().sendRewards(msg.sender, supplierId);
    }
}

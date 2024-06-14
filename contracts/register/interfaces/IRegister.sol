// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Interface for contract for registration of suppliers and users
 * @author Bohdan
 */
interface IRegister {
    /**
     * @notice Registers an Energy supplier.
     * Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE.
     * - `supplier` must not be address 0.
     * - `supplier` must have NRGS token.
     *
     * @param supplier The address of the supplier.
     */
    function registerSupplier(address supplier) external;

    /**
     * @notice Registers an Electricity consumer.
     * Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE.
     * - `user` must not be address 0.
     *
     * @param user The address of the user.
     * @param supplierId The ID of the supplier.
     */
    function registerElectricityConsumer(address user, uint256 supplierId) external;

    /**
     * @notice Unregisters an Energy supplier.
     * Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE.
     * - `supplier` must have NRGS token.
     *
     * @param supplierId The ID of the supplier.
     */
    function unRegisterSupplier(uint256 supplierId) external;

    /**
     * @notice Unregisters an Electricity consumer.
     * Requirements:
     * - `msg.sender` must have REGISTER_MANAGER_ROLE.
     * - `user` must not be address 0.
     * - `user` must have ECU token.
     *
     * @param user The address of the user.
     * @param supplierId The ID of the supplier.
     */
    function unRegisterElectricityConsumer(address user, uint256 supplierId) external;
}

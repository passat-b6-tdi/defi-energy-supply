// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IEscrow
 * @dev Interface for the Escrow contract.
 * @author Bohdan
 */
interface IEscrow {
    /**
     * @dev Sends funds to the supplier for the energy consumed by a consumer.
     * Requirements:
     * - `msg.sender` must have `ESCROW_MANAGER_ROLE`
     * - `paidAmount` must be > 0
     * - `consumer` must be not address 0
     *
     * @param consumer The address of the consumer.
     * @param supplierId The ID of the token.
     * @param paidAmount The amount of funds sent by the consumer.
     */
    function sendFundsToSupplier(address consumer, uint256 supplierId, uint256 paidAmount) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../Parent.sol";

/**
 * @title Escrow
 * @dev A contract for managing energy payments and transfers between consumers and suppliers.
 * @author Bohdan
 */
contract Escrow is Parent {
    ///@dev Emmited when a consumer paid for energy
    event PaidForEnergy(address indexed consumer, uint256 indexed tokenId, address indexed supplier, uint256 amount);

    /// @dev Keccak256 hashed `ESCROW_MANAGER_ROLE` string
    bytes32 public constant ESCROW_MANAGER_ROLE = keccak256(bytes("ESCROW_MANAGER_ROLE"));

    /**
     * @notice Constructor to initialize the Escrow contract
     * @param _manager The address of the Manager contract.
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `ESCROW_MANAGER_ROLE` roles to the contract deployer.
     */
    constructor(IManager _manager) Parent(_manager) {
        _grantRole(ESCROW_MANAGER_ROLE, msg.sender);
    }

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
    function sendFundsToSupplier(
        address consumer,
        uint256 supplierId,
        uint256 paidAmount
    ) public onlyRole(ESCROW_MANAGER_ROLE) zeroAddressCheck(consumer) gtZero(paidAmount) {
        address supplier = manager.NRGS().ownerOf(supplierId);

        require(manager.ECU().balanceOf(consumer, supplierId) > 0, "Escrow: consumer connected to another supplier");

        uint256 consumption = manager.energyOracle().energyConsumptions(consumer, supplierId);
        uint256 needToBePaid = consumption + manager.fees();

        require(paidAmount >= needToBePaid, "Escrow: not enough funds sent");

        uint256 amountRemaining = paidAmount - needToBePaid;

        require(manager.MGT().transfer(supplier, consumption), "Escrow: transfer to supplier failed");

        require(
            manager.MGT().transfer(manager.feeReceiver(), manager.fees()),
            "Escrow: transfer to fee receiver failed"
        );

        if (amountRemaining > 0) {
            require(manager.MGT().transfer(consumer, amountRemaining), "Escrow: transfer to consumer failed");
        }

        manager.energyOracle().updateEnergyConsumptions(consumer, supplierId);

        emit PaidForEnergy(consumer, supplierId, supplier, consumption);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../Parent.sol";

/**
 * @title Escrow
 * @dev A contract for managing energy payments and transfers between users and suppliers.
 * @author Bohdan
 */
contract Escrow is Parent {
    ///@dev Emmited when a user paid for energy
    event PaidForEnergy(address indexed user, uint256 indexed tokenId, address indexed supplier, uint256 amount);

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
     * @dev Sends funds to the supplier for the energy consumed by a user.
     * Requirements:
     * - `msg.sender` must have `ESCROW_MANAGER_ROLE`
     * - `paidAmount` must be > 0
     * - `user` must be not address 0
     *
     * @param user The address of the user.
     * @param supplierId The ID of the token.
     * @param paidAmount The amount of funds sent by the user.
     */
    function sendFundsToSupplier(
        address user,
        uint256 supplierId,
        uint256 paidAmount
    ) public onlyRole(ESCROW_MANAGER_ROLE) zeroAddressCheck(user) gtZero(paidAmount) {
        address supplier = manager.NRGS().ownerOf(supplierId);

        require(manager.ELU().balanceOf(user, supplierId) > 0, "Escrow: user connected to another supplier");

        uint256 consumption = manager.energyOracle().updateEnergyConsumptionsAndGetResult(user, supplierId);
        uint256 needToBePaid = consumption + manager.fees();

        require(paidAmount >= needToBePaid, "Escrow: not enough funds sent");

        uint256 amountRemaining = paidAmount - needToBePaid;

        require(manager.MCGR().transfer(supplier, consumption), "Escrow: transfer to supplier failed");

        require(
            manager.MCGR().transfer(manager.feeReceiver(), manager.fees()),
            "Escrow: transfer to fee receiver failed"
        );

        if (amountRemaining > 0) {
            require(manager.MCGR().transfer(user, amountRemaining), "Escrow: transfer to user failed");
        }

        emit PaidForEnergy(user, supplierId, supplier, consumption);
    }
}

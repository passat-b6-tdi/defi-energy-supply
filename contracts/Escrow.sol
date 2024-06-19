// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Manager } from "../manager/Manager.sol";
import { MGT } from "../tokens/ERC20/MGT.sol";

error ZeroAddressPassed();
error IncorrectConsumer(address incorrectConsumer, uint256 supplierId);

/**
 * @title Escrow
 * @dev A contract for managing energy payments and transfers between consumers and suppliers.
 * @author Bohdan
 */
contract Escrow is AccessControl {
    using SafeERC20 for MGT;

    ///@dev Emmited when a consumer paid for energy
    event PaidForEnergy(address indexed consumer, uint256 indexed tokenId, address indexed supplier, uint256 amount);

    /// @dev Keccak256 hashed `ESCROW_MANAGER_ROLE` string
    bytes32 public constant ESCROW_MANAGER_ROLE = keccak256(bytes("ESCROW_MANAGER_ROLE"));

    /// @dev Manager contract
    Manager public manager;

    /**
     * @notice Constructor to initialize the Escrow contract
     * @param _manager The address of the Manager contract.
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `ESCROW_MANAGER_ROLE` roles to the contract deployer.
     */
    constructor(Manager _manager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ESCROW_MANAGER_ROLE, msg.sender);

        manager = _manager;
    }

    /// @dev Changes `manager` address to the `_newManager` address.
    /// @param _newManager The address of the new manger contract
    function changeManager(Manager _newManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (address(_newManager) == address(0)) {
            revert ZeroAddressPassed();
        }

        manager = _newManager;
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
     */
    function sendFundsToSupplier(address consumer, uint256 supplierId) public onlyRole(ESCROW_MANAGER_ROLE) {
        if (manager.tokens().ecu.balanceOf(consumer, supplierId) == 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }

        address supplier = manager.tokens().nrgs.ownerOf(supplierId);

        uint256 consumption = manager.contracts().oracle.energyConsumptions(consumer, supplierId);
        uint256 needToBePaid = consumption + manager.values().fees;

        // Transferring MGT from the `consumer` to the `Escrow`
        manager.tokens().mgt.safeTransferFrom(consumer, address(this), needToBePaid);

        // Transferring `consumption` amount of MGT from the `Escrow` to the `supplier`
        manager.tokens().mgt.safeTransfer(supplier, consumption);

        // Transferring `fees` amount of MGT from the `Escrow` to the `feeReceiver`
        manager.tokens().mgt.safeTransfer(manager.feeReceiver(), manager.values().fees);

        manager.contracts().oracle.updateEnergyConsumptions(consumer, supplierId);

        emit PaidForEnergy(consumer, supplierId, supplier, consumption);
    }
}

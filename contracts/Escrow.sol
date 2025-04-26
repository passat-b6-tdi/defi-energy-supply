// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";
import { SafeTransferLib } from "solady/src/utils/SafeTransferLib.sol";

import { Main } from "./Main.sol";
import { IToken } from "./interfaces/IToken.sol";
import { IContract } from "./interfaces/IContract.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/// @dev Error to indicate that the consumer address is incorrect
/// @param incorrectConsumer The incorrect consumer address
/// @param supplierId The ID of the supplier
error IncorrectConsumer(address incorrectConsumer, uint256 supplierId);

/**
 * @title Escrow
 * @dev A contract for managing energy payments and transfers between consumers and suppliers.
 * @notice This contract allows consumers to pay for energy consumed from suppliers using ERC20 tokens.
 * It also allows the distribution of fees to the fee receiver.
 * The contract is managed by an Escrow Manager who can send funds to suppliers.
 * @author Bohdan
 */
contract Escrow is Ownable, EnumerableRoles {
    using SafeTransferLib for address;

    /// @dev Emmited when a consumer paid for energy
    /// @param consumer The address of the consumer
    /// @param tokenId The ID of the token representing the supplier
    /// @param supplier The address of the supplier
    /// @param amount The amount paid for energy
    event PaidForEnergy(address indexed consumer, uint256 indexed tokenId, address indexed supplier, uint256 amount);

    /// @dev Keccak256 hashed `ESCROW_MANAGER_ROLE` string
    uint256 public constant ESCROW_MANAGER_ROLE = uint256(keccak256(bytes("ESCROW_MANAGER_ROLE")));

    /// @dev Main contract
    Main public main;

    /**
     * @notice Constructor to initialize the Escrow contract
     * @param _main The address of the Main contract.
     * @dev Grants `owner` and `ESCROW_MANAGER_ROLE` roles to the contract deployer.
     */
    constructor(Main _main) {
        _setOwner(msg.sender);

        main = _main;
    }

    /// @dev Changes `main` address to the `_main` address.
    /// @param _main The address of the new manger contract
    function changeMain(Main _main) external onlyOwner {
        if (address(_main) == address(0)) {
            revert ZeroAddressPassed();
        }

        main = _main;
    }

    /**
     * @notice Sends funds to the supplier for the energy consumed by a consumer.
     * @dev
     * Requirements:
     * - `msg.sender` must have `ESCROW_MANAGER_ROLE`
     * - `consumer` must not be the zero address
     * - `consumer` must have consumed energy
     * - Transfers the required amount of tokens from the consumer to the escrow contract,
     * and then distributes the tokens to the supplier and fee receiver.
     * @param consumer The address of the consumer.
     * @param supplierId The ID of the token representing the supplier.
     */
    function sendFundsToSupplier(address consumer, uint256 supplierId) public onlyRole(ESCROW_MANAGER_ROLE) {
        Main _main = main;
        Main.Tokens memory tokens = _main.tokens();
        if (IToken(tokens.ecu).balanceOf(consumer, supplierId) == 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }

        address supplier = IToken(tokens.nrgs).ownerOf(supplierId);

        address oracle = _main.contracts().oracle;
        uint256 consumption = IContract(oracle).energyConsumptions(consumer, supplierId);

        uint256 fees = _main.values().fees;
        uint256 needToBePaid = consumption + fees;

        // Transferring MGT from the `consumer` to the `Escrow`
        tokens.mgt.safeTransferFrom(consumer, address(this), needToBePaid);

        // Transferring `consumption` amount of MGT from the `Escrow` to the `supplier`
        tokens.mgt.safeTransfer(supplier, consumption);

        // Transferring `fees` amount of MGT from the `Escrow` to the `feeReceiver`
        tokens.mgt.safeTransfer(_main.feeReceiver(), fees);

        IContract(oracle).updateEnergyConsumptions(consumer, supplierId);

        emit PaidForEnergy(consumer, supplierId, supplier, consumption);
    }
}

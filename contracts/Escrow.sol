// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import { SafeTransferLib } from "solady/src/utils/SafeTransferLib.sol";

import { OwnableEnumerableRoles } from "./base/OwnableEnumerableRoles.sol";
import { ContractsBase } from "./base/ContractsBase.sol";

import { Main } from "./Main.sol";

/// @dev Error to indicate that the consumer address is incorrect
/// @param incorrectConsumer The incorrect consumer address
/// @param supplierId The ID of the supplier
error IncorrectConsumer(address incorrectConsumer, uint256 supplierId);

/// @dev Error when a payment token is not supported
/// @param token The token address provided
error TokenNotWhitelisted(address token);

/// @title Escrow
/// @notice Manages payments from consumers to suppliers using whitelisted stablecoins
/// @dev Uses Main for configuration; only ESCROW_MANAGER_ROLE can call `sendFundsToSupplier`
contract Escrow is OwnableEnumerableRoles, ContractsBase {
    using SafeTransferLib for address;

    /// @dev Emitted when a consumer pays for energy
    /// @param consumer The address of the consumer
    /// @param supplierId The ID of the supplier token
    /// @param supplier The address of the supplier
    /// @param amount The amount paid for energy (excluding fees)
    event PaidForEnergy(address indexed consumer, uint256 indexed supplierId, address indexed supplier, uint256 amount);

    /// @dev Keccak256 hashed `ESCROW_MANAGER_ROLE` string
    uint256 public constant ESCROW_MANAGER_ROLE = uint256(keccak256("ESCROW_MANAGER_ROLE"));

    /// @notice Constructor sets Main reference and grants roles
    /// @param main_ Address of the Main contract
    constructor(address main_) ContractsBase(main_) {
        _setRole(msg.sender, ESCROW_MANAGER_ROLE, true);
    }

    /// @notice Update Main contract address
    /// @param main_ New Main contract address
    function changeMain(address main_) public override onlyOwner {
        super.changeMain(main_);
    }

    /// @notice Consumer pays for energy and fees in a whitelisted stablecoin
    /// @dev Pulls total (consumption + fee), forwards to supplier and fee receiver, then clears debt
    /// @param supplierId ID of the supplier (tokenId)
    /// @param paymentToken ERC20 token address (must be USDC, DAI or USDT)
    function payForElectricity(uint256 supplierId, address paymentToken) external {
        if (paymentToken != main().USDC() && paymentToken != main().DAI() && paymentToken != main().USDT()) {
            revert TokenNotWhitelisted(paymentToken);
        }

        Main.Tokens memory tokens = main().tokens();
        if (tokens.electricityConsumerToken.balanceOf(msg.sender, supplierId) == 0) {
            revert IncorrectConsumer(msg.sender, supplierId);
        }

        uint256 debtsUSD = main().contracts().oracle.debtsUSD(msg.sender, supplierId);
        uint256 fee = main().fees().amount;
        address supplier = tokens.energySupplierToken.ownerOf(supplierId);

        paymentToken.safeTransferFrom(msg.sender, address(this), debtsUSD + fee);
        paymentToken.safeTransfer(supplier, debtsUSD);
        paymentToken.safeTransfer(main().fees().receiver, fee);

        main().contracts().oracle.updateEnergyConsumptions(msg.sender, supplierId, 0, debtsUSD);

        emit PaidForEnergy(msg.sender, supplierId, supplier, debtsUSD);
    }

    function main() public view returns (Main) {
        return Main(_main);
    }
}

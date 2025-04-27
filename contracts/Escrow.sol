// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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

/// @dev Error when a payment token is not supported
/// @param token The token address provided
error TokenNotWhitelisted(address token);

/// @title Escrow
/// @notice Manages payments from consumers to suppliers using whitelisted stablecoins
/// @dev Uses Main for configuration; only ESCROW_MANAGER_ROLE can call `sendFundsToSupplier`
contract Escrow is Ownable, EnumerableRoles {
    using SafeTransferLib for address;

    /// @dev Emitted when a consumer pays for energy
    /// @param consumer The address of the consumer
    /// @param supplierId The ID of the supplier token
    /// @param supplier The address of the supplier
    /// @param amount The amount paid for energy (excluding fees)
    event PaidForEnergy(address indexed consumer, uint256 indexed supplierId, address indexed supplier, uint256 amount);

    /// @dev Keccak256 hashed `ESCROW_MANAGER_ROLE` string
    uint256 public constant ESCROW_MANAGER_ROLE = uint256(keccak256("ESCROW_MANAGER_ROLE"));

    /// @notice Reference to Main contract for parameters and contract addresses
    Main public main;

    /// @notice Constructor sets Main reference and grants roles
    /// @param _main Address of the Main contract
    constructor(Main _main) {
        _setOwner(msg.sender);
        _setRole(msg.sender, ESCROW_MANAGER_ROLE, true);

        main = _main;
    }

    /// @notice Update Main contract address
    /// @param _main New Main contract address
    function changeMain(Main _main) external onlyOwner {
        if (address(_main) == address(0)) revert ZeroAddressPassed();
        main = _main;
    }

    /// @notice Consumer pays for energy and fees in a whitelisted stablecoin
    /// @dev Pulls total (consumption + fee), forwards to supplier and fee receiver, then clears debt
    /// @param supplierId ID of the supplier (tokenId)
    /// @param paymentToken ERC20 token address (must be USDC, DAI or USDT)
    function payForElectricity(uint256 supplierId, address paymentToken) external onlyRole(ESCROW_MANAGER_ROLE) {
        if (paymentToken != main.USDC() && paymentToken != main.DAI() && paymentToken != main.USDT()) {
            revert TokenNotWhitelisted(paymentToken);
        }

        Main.Tokens memory tokens = main.tokens();
        if (IToken(tokens.electricityConsumerToken).balanceOf(msg.sender, supplierId) == 0) {
            revert IncorrectConsumer(msg.sender, supplierId);
        }

        address oracle = main.contracts().oracle;
        uint256 consumption = IContract(oracle).energyConsumptions(msg.sender, supplierId);
        uint256 fee = main.fees().amount;
        address supplier = IToken(tokens.energySupplierToken).ownerOf(supplierId);

        paymentToken.safeTransferFrom(msg.sender, address(this), consumption + fee);

        paymentToken.safeTransfer(supplier, consumption);

        paymentToken.safeTransfer(main.fees().receiver, fee);

        IContract(oracle).updateEnergyConsumptions(msg.sender, supplierId, 0, consumption);

        emit PaidForEnergy(msg.sender, supplierId, supplier, consumption);
    }
}

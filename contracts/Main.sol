// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";

import { IToken } from "./interfaces/IToken.sol";
import { IContract } from "./interfaces/IContract.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/**
 * @title Manager contract for contracts management
 * @dev This contract manages the links to various contracts and stores configuration values for the system.
 * @notice This contract allows for managing and updating the addresses of token and functional contracts in the ecosystem.
 * It also manages configuration values like reward amounts and fees, and stores immutable stablecoin addresses.
 * @author Bohdan
 */
contract Main is Ownable, EnumerableRoles {
    /// @dev Structure to hold references to token contracts
    struct Tokens {
        // ERC20
        address energyCreditToken;
        address microgridGovernanceToken;
        // ERC721
        address energyOracleProviderToken;
        address energyProducerToken;
        address energySupplierToken;
        // ERC1155
        address electricityConsumerToken;
    }

    /// @dev Structure to hold references to functional contracts
    struct Contracts {
        address staking;
        address oracle;
        address register;
        address escrow;
    }

    /// @dev Structure to hold references to fees related data
    struct Fees {
        address receiver;
        uint256 amount;
    }

    // Events for contract address changes
    /// @dev Emitted when a manager changes the `Tokens _tokens`
    event TokensUpdated(address indexed sender, Tokens tokens);
    /// @dev Emitted when a manager changes the `Contracts _contracts`
    event ContractsUpdated(address indexed sender, Contracts staking);

    // Event for fee receiver address change
    /// @dev Emitted when a manager changes the `feeReceiver` and `fees`
    event FeesChanged(address indexed sender, address newFeeReceiver, uint256 newFees);

    // Events for configuration value changes
    /// @dev Emitted when a manager changes other configuration values
    event ValuesUpdated(address indexed sender, uint256 values);

    /// @dev Keccak256 hashed `MANAGER_ROLE` string
    uint256 public constant MANAGER_ROLE = uint256(keccak256(bytes("MANAGER_ROLE")));

    uint256 public constant MGT_TO_ORACLE_PROVIDER = 5e16;
    uint256 public constant MGT_PER_ECT_CONSUMED = 5e14;

    /// @dev Tokens struct storage
    Tokens private _tokens;

    /// @dev Contracts struct storage
    Contracts public _contracts;

    /// @dev Fees struct storage
    Fees public _fees;

    /// @notice Immutable addresses of supported stablecoins
    address public immutable USDC;
    address public immutable DAI;
    address public immutable USDT;

    /**
     * @notice Constructor to initialize the Manager contract
     * @param tokens_ The initial addresses of the token contracts
     * @param fees_ The initial values for fees structure
     * @param USDC_ The address of the USDC stablecoin contract
     * @param DAI_ The address of the DAI stablecoin contract
     * @param USDT_ The address of the USDT stablecoin contract
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `MANAGER_ROLE` roles to `msg.sender` and sets immutable stablecoin addresses
     */
    constructor(Tokens memory tokens_, Fees memory fees_, address USDC_, address DAI_, address USDT_) {
        _setOwner(msg.sender);
        _setRole(msg.sender, MANAGER_ROLE, true);

        if (USDC_ == address(0) || DAI_ == address(0) || USDT_ == address(0)) {
            revert ZeroAddressPassed();
        }

        _tokens = tokens_;
        _fees = fees_;
        USDC = USDC_;
        DAI = DAI_;
        USDT = USDT_;
    }

    /**
     * @notice Changes token contract addresses
     * @dev Caller must have MANAGER_ROLE
     * @param tokens_ The new addresses of the token contracts
     */
    function changeTokensAddresses(Tokens calldata tokens_) external onlyRole(MANAGER_ROLE) {
        _tokens = tokens_;
        emit TokensUpdated(msg.sender, tokens_);
    }

    /**
     * @notice Changes functional contract addresses
     * @dev Caller must have MANAGER_ROLE
     * @param contracts_ The new addresses of the functional contracts
     */
    function changeContracts(Contracts calldata contracts_) external onlyRole(MANAGER_ROLE) {
        _contracts = contracts_;
        emit ContractsUpdated(msg.sender, contracts_);
    }

    /**
     * @notice Updates fees structure
     * @dev Caller must have MANAGER_ROLE; receiver must not be zero address
     * @param _newFees The new fees structure
     */
    function changeFees(Fees calldata _newFees) external onlyRole(MANAGER_ROLE) {
        if (_newFees.receiver == address(0)) revert ZeroAddressPassed();

        _fees = _newFees;
        emit FeesChanged(msg.sender, _newFees.receiver, _newFees.amount);
    }

    /**
     * @notice Retrieves current fees structure
     * @return The fees structure
     */
    function fees() external view returns (Fees memory) {
        return _fees;
    }

    /**
     * @notice Retrieves current token contract addresses
     * @return The token contract addresses structure
     */
    function tokens() external view returns (Tokens memory) {
        return _tokens;
    }

    /**
     * @notice Retrieves current functional contract addresses
     * @return The functional contract addresses structure
     */
    function contracts() external view returns (Contracts memory) {
        return _contracts;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";

import { IToken } from "./interfaces/IToken.sol";
import { IContract } from "./interfaces/IContract.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/// @dev Error thrown when caller is not an energy supplier
error OnlyEnergySupplier();

/// @dev Error thrown when caller is not an energy oracle provider
error OnlyEnergyOracleProvider();

/**
 * @title Manager contract for contracts management
 * @dev This contract manages the links to various contracts and stores configuration values for the system.
 * @notice This contract allows for managing and updating the addresses of token and functional contracts in the ecosystem.
 * It also manages configuration values like reward amounts and fees.
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
    /// @dev Emitted when a manager changes the `Values _values`
    event ValuesUpdated(address indexed sender, uint256 values);

    /// @dev Keccak256 hashed `MANAGER_ROLE` string
    uint256 public constant MANAGER_ROLE = uint256(keccak256(bytes("MANAGER_ROLE")));

    uint256 public constant MGT_TO_ORACLE_PROVIDER = 0.05e18;
    uint256 public constant MGT_PER_ECT_CONSUMED = 0.05e18;

    /// @dev Tokens struct
    Tokens private _tokens;

    /// @dev Contracts struct
    Contracts public _contracts;

    /// @dev Fees struct
    Fees public _fees;

    /// @dev Whitelisted payment tokens mapping
    mapping(address token => bool whitelisted) public whitelistedPaymentTokens;

    /**
     * @dev Modifier to check if the caller is the owner of the supplierId
     * @param supplierId The ID of the supplier
     */
    modifier onlySupplier(uint256 supplierId) {
        if (IToken(_tokens.energySupplierToken).ownerOf(supplierId) != msg.sender) {
            revert OnlyEnergySupplier();
        }
        _;
    }

    /**
     * @dev Modifier to check if the caller is an energy oracle provider
     */
    modifier onlyOracleProvider() {
        if (IToken(_tokens.energyOracleProviderToken).balanceOf(msg.sender) == 0) {
            revert OnlyEnergyOracleProvider();
        }
        _;
    }

    /**
     * @notice Constructor to initialize the Manager contract
     * @param tokens_ The initial addresses of the token contracts
     * @param fees_ The initial values for fees structure
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `MANAGER_ROLE` roles to `msg.sender`
     */
    constructor(Tokens memory tokens_, Fees memory fees_) {
        _setOwner(msg.sender);

        _tokens = tokens_;
        _fees = fees_;
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
     * @notice Whitelist or remove a token for payments
     * @dev Caller must have MANAGER_ROLE; token must not be zero address
     * @param token The token address to whitelist or remove
     * @param whitelisted True to whitelist, false to remove
     */
    function setWhitelistedPaymentToken(address token, bool whitelisted) external onlyRole(MANAGER_ROLE) {
        require(token != address(0), ZeroAddressPassed());
        whitelistedPaymentTokens[token] = whitelisted;
    }

    /**
     * @notice Registers an Energy supplier via Register contract
     * @param supplier The address of the supplier
     */
    function registerSupplier(address supplier) external onlyRole(MANAGER_ROLE) {
        IContract(_contracts.register).registerSupplier(supplier);
    }

    /**
     * @notice Registers Electricity consumer under specific supplier
     * @param consumer The address of the consumer
     * @param supplierId The ID of the supplier
     */
    function registerElectricityConsumer(address consumer, uint256 supplierId) external onlySupplier(supplierId) {
        IContract(_contracts.register).registerElectricityConsumer(consumer, supplierId);
    }

    /**
     * @notice Registers an Energy oracle provider via Register contract
     * @param oracleProvider The address of the oracle provider
     */
    function registerOracleProvider(address oracleProvider) external onlyRole(MANAGER_ROLE) {
        IContract(_contracts.register).registerOracleProvider(oracleProvider);
    }

    /**
     * @notice Unregisters an Energy supplier via Register contract
     * @param supplierId The ID of the supplier
     */
    function unRegisterSupplier(uint256 supplierId) external onlyRole(MANAGER_ROLE) {
        IContract(_contracts.register).unregisterSupplier(supplierId);
    }

    /**
     * @notice Unregisters Electricity consumer via Register contract
     * @param consumer The address of the consumer
     * @param supplierId The ID of the supplier
     */
    function unRegisterElectricityConsumer(address consumer, uint256 supplierId) external onlySupplier(supplierId) {
        IContract(_contracts.register).unregisterElectricityConsumer(consumer, supplierId);
    }

    /**
     * @notice Unregisters an Energy oracle provider via Register contract
     * @param oracleProviderId The ID of the oracle provider
     */
    function unRegisterOracleProvider(uint256 oracleProviderId) external onlyRole(MANAGER_ROLE) {
        IContract(_contracts.register).unregisterOracleProvider(oracleProviderId);
    }

    /**
     * @notice Records energy production via Oracle contract
     * @param producerId The producer ID
     * @param kWh The energy production value in kWh
     */
    function recordEnergyProductions(uint256 producerId, uint256 kWh) external onlyOracleProvider {
        IContract(_contracts.oracle).recordEnergyProductions(producerId, kWh);
    }

    /**
     * @notice Records energy consumption via Oracle contract
     * @param consumer The consumer address
     * @param supplierId The supplier ID
     * @param consumption The energy consumption in kWh
     */
    function recordConsumerConsumptions(
        address consumer,
        uint256 supplierId,
        uint256 consumption
    ) external onlyOracleProvider {
        IContract(_contracts.oracle).recordConsumerConsumptions(consumer, supplierId, consumption);
    }

    /**
     * @notice Pays for electricity via Escrow contract
     * @param supplierId The supplier ID
     */
    function payForElectricity(uint256 supplierId) external {
        IContract(_contracts.escrow).sendFundsToSupplier(msg.sender, supplierId);
    }

    /**
     * @notice Claims rewards via Staking contract
     * @param supplierId The supplier ID
     */
    function getRewards(uint256 supplierId) external onlySupplier(supplierId) {
        IContract(_contracts.staking).sendRewards(msg.sender, supplierId);
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";

import { IToken } from "./interfaces/IToken.sol";
import { IContract } from "./interfaces/IContract.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/// @dev Error to indicate that the caller is not an energy supplier
error OnlyEnergySupplier();

/// @dev Error to indicate that the caller is not an energy oracle provider
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
        address mgt;
        address ecu;
        address nrgs;
        address nrgop;
    }

    /// @dev Structure to hold references to functional contracts
    struct Contracts {
        address staking;
        address oracle;
        address register;
        address escrow;
    }

    /// @dev Structure to hold configuration values
    struct Values {
        uint256 rewardAmount;
        uint256 fees;
    }

    // Events for contract address changes
    /// @dev Emitted when a manager changes the `Tokens _tokens`
    event TokensUpdated(address indexed sender, Tokens tokens);
    /// @dev Emitted when a manager changes the `Contracts _contracts`
    event ContractsUpdated(address indexed sender, Contracts staking);

    // Event for fee receiver address change
    /// @dev Emitted when a manager changes the `feeReceiver` link to another address
    event FeeReceiverChanged(address indexed sender, address newReceiver);

    // Events for configuration value changes
    /// @dev Emitted when a manager changes the `Values _values`
    event ValuesUpdated(address indexed sender, Values values);

    /// @dev Keccak256 hashed `MANAGER_ROLE` string
    uint256 public constant MANAGER_ROLE = uint256(keccak256(bytes("MANAGER_ROLE")));

    /// @dev Tokens struct
    Tokens private _tokens;

    /// @dev Contracts struct
    Contracts public _contracts;

    /// @dev Address where fees will be paid
    address public feeReceiver;

    /// @dev Values struct
    Values public _values;

    /**
     * @dev Modifier to check if the caller is the owner of the supplierId
     * @param supplierId The ID of the supplier
     */
    modifier onlySupplier(uint256 supplierId) {
        if (IToken(_tokens.nrgs).ownerOf(supplierId) != msg.sender) {
            revert OnlyEnergySupplier();
        }
        _;
    }

    /**
     * @dev Modifier to check if the caller is an energy oracle provider
     */
    modifier onlyOracleProvider() {
        if (IToken(_tokens.nrgop).balanceOf(msg.sender) == 0) {
            revert OnlyEnergyOracleProvider();
        }
        _;
    }

    /**
     * @notice Constructor to initialize the Manager contract
     * @param tokens_ The initial addresses of the token contracts
     * @param _feeReceiver The address of the fee receiver
     * @param values_ The initial values for reward amount and fees
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `MANAGER_ROLE` roles to `msg.sender`
     */
    constructor(Tokens memory tokens_, address _feeReceiver, Values memory values_) {
        _setOwner(msg.sender);

        _tokens = tokens_;
        _values = values_;

        feeReceiver = _feeReceiver;
    }

    /**
     * @notice Changes tokens links to others.
     * @dev Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * @param tokens_ The new addresses of the token contracts
     */
    function changeTokensAddresses(Tokens calldata tokens_) external onlyRole(MANAGER_ROLE) {
        emit TokensUpdated(msg.sender, tokens_);
        _tokens = tokens_;
    }

    /**
     * @notice Changes contracts links to others.
     * @dev Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * @param contracts_ The new addresses of the functional contracts
     */
    function changeContracts(Contracts calldata contracts_) external onlyRole(MANAGER_ROLE) {
        emit ContractsUpdated(msg.sender, contracts_);
        _contracts = contracts_;
    }

    /**
     * @notice Changes `feeReceiver` link to another address.
     * @dev Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_newFeeReceiver` must be not address 0
     * @param _newFeeReceiver The new address of the fee receiver
     */
    function changeFeeReceiver(address _newFeeReceiver) external onlyRole(MANAGER_ROLE) {
        if (_newFeeReceiver == address(0)) {
            revert ZeroAddressPassed();
        }

        emit FeeReceiverChanged(msg.sender, _newFeeReceiver);
        feeReceiver = _newFeeReceiver;
    }

    /**
     * @notice Changes configuration values.
     * @dev Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * @param values_ The new configuration values
     */
    function changeValues(Values calldata values_) external onlyRole(MANAGER_ROLE) {
        emit ValuesUpdated(msg.sender, values_);
        _values = values_;
    }

    /**
     * @notice Registers an Energy supplier.
     * @dev Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`.
     * @param supplier The address of the supplier.
     */
    function registerSupplier(address supplier) external onlyRole(MANAGER_ROLE) {
        IContract(_contracts.register).registerSupplier(supplier);
    }

    /**
     * @notice Registers an Electricity consumer.
     * @dev Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a supplier.
     * @param consumer The address of the consumer.
     * @param supplierId The ID of the supplier for the consumer.
     */
    function registerElectricityConsumer(address consumer, uint256 supplierId) external onlySupplier(supplierId) {
        IContract(_contracts.register).registerElectricityConsumer(consumer, supplierId);
    }

    /**
     * @notice Registers an Energy oracle provider.
     * @dev Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`.
     * @param oracleProvider The address of the oracle provider.
     */
    function registerOracleProvider(address oracleProvider) external onlyRole(MANAGER_ROLE) {
        IContract(_contracts.register).registerOracleProvider(oracleProvider);
    }

    /**
     * @notice Unregisters an Energy supplier.
     * @dev Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must have `MANAGER_ROLE`.
     * @param supplierId The ID of the supplier.
     */
    function unRegisterSupplier(uint256 supplierId) external onlyRole(MANAGER_ROLE) {
        IContract(_contracts.register).unRegisterSupplier(supplierId);
    }

    /**
     * @notice Unregisters an Electricity consumer.
     * @dev Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a supplier.
     * @param consumer The address of the consumer.
     * @param supplierId The ID of the supplier for the consumer.
     */
    function unRegisterElectricityConsumer(address consumer, uint256 supplierId) external onlySupplier(supplierId) {
        IContract(_contracts.register).unRegisterElectricityConsumer(consumer, supplierId);
    }

    /**
     * @notice Unregisters an Energy oracle provider.
     * @dev Requirements:
     * - `oracleProviderId` must be greater than 0.
     * - `msg.sender` must have `MANAGER_ROLE`.
     * @param oracleProviderId The ID of the oracle provider.
     */
    function unRegisterOracleProvider(uint256 oracleProviderId) external onlyRole(MANAGER_ROLE) {
        IContract(_contracts.register).unRegisterOracleProvider(oracleProviderId);
    }

    /**
     * @notice Records the energy production by the supplier at a specific timestamp.
     * @dev Requirements:
     * - `msg.sender` must be an energy oracle provider.
     * - `supplier` must have `supplierId`.
     * @param supplier The supplier address.
     * @param supplierId The supplier ID.
     * @param production The energy production value.
     */
    function recordEnergyProductions(
        address supplier,
        uint256 supplierId,
        uint256 production
    ) external onlyOracleProvider {
        IContract(_contracts.oracle).recordEnergyProductions(supplier, supplierId, production);
    }

    /**
     * @notice Records the energy consumption for a consumer and supplier at a specific timestamp.
     * @dev Requirements:
     * - `msg.sender` must be an energy oracle provider.
     * - `consumer` must have a supplier with `supplierId`.
     * @param consumer The consumer address.
     * @param supplierId The supplier ID.
     * @param consumption The energy consumption value.
     */
    function recordConsumerConsumptions(
        address consumer,
        uint256 supplierId,
        uint256 consumption
    ) external onlyOracleProvider {
        IContract(_contracts.oracle).recordConsumerConsumptions(consumer, supplierId, consumption);
    }

    /**
     * @notice Pays for electricity.
     * @dev Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a consumer.
     * @param supplierId The ID of the supplier for the consumer.
     */
    function payForElectricity(uint256 supplierId) external {
        IContract(_contracts.escrow).sendFundsToSupplier(msg.sender, supplierId);
    }

    /**
     * @notice Gets the rewards for a supplier.
     * @dev Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a supplier.
     * @param supplierId The ID of the supplier.
     */
    function getRewards(uint256 supplierId) external onlySupplier(supplierId) {
        IContract(_contracts.staking).sendRewards(msg.sender, supplierId);
    }

    /**
     * @notice Gets the current token contract addresses
     * @return The current token contract addresses
     */
    function tokens() external view returns (Tokens memory) {
        return _tokens;
    }

    /**
     * @notice Gets the current functional contract addresses
     * @return The current functional contract addresses
     */
    function contracts() external view returns (Contracts memory) {
        return _contracts;
    }

    /**
     * @notice Gets the current configuration values
     * @return The current configuration values
     */
    function values() external view returns (Values memory) {
        return _values;
    }
}

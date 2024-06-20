// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

import { NRGS } from "./tokens/ERC721/NRGS.sol";
import { NRGOP } from "./tokens/ERC721/NRGOP.sol";
import { MGT } from "./tokens/MGT.sol";
import { ECU } from "./tokens/ECU.sol";

import { StakingReward } from "./StakingReward.sol";
import { EnergyOracle } from "./EnergyOracle.sol";
import { Register } from "./Register.sol";
import { Escrow } from "./Escrow.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/**
 * @title Manager contract for contracts management
 * @dev This contract manages the links to various contracts and stores configuration values for the system.
 * @notice This contract allows for managing and updating the addresses of token and functional contracts in the ecosystem.
 * It also manages configuration values like reward amounts and fees.
 * @author Bohdan
 */
contract Manager is AccessControl {
    /// @dev Structure to hold references to token contracts
    struct Tokens {
        MGT mgt;
        ECU ecu;
        NRGS nrgs;
        NRGOP nrgop;
    }

    /// @dev Structure to hold references to functional contracts
    struct Contracts {
        StakingReward staking;
        EnergyOracle oracle;
        Register register;
        Escrow escrow;
    }

    /// @dev Structure to hold configuration values
    struct Values {
        uint256 rewardAmount;
        uint256 fees;
    }

    // Events for contract address changes
    /// @dev Emitted when a manager changes the `MGT` link to another contract
    event MGTchanged(address indexed sender, MGT newMGT);
    /// @dev Emitted when a manager changes the `ECU` link to another contract
    event ECUchanged(address indexed sender, ECU newECU);
    /// @dev Emitted when a manager changes the `NRGS` link to another contract
    event NRGSchanged(address indexed sender, NRGS newNRGS);
    /// @dev Emitted when a manager changes the `NRGOP` link to another contract
    event NRGOPchanged(address indexed sender, NRGOP newNRGOP);
    /// @dev Emitted when a manager changes the `staking` link to another contract
    event StakingChanged(address indexed sender, StakingReward staking);
    /// @dev Emitted when a manager changes the `energyOracle` link to another contract
    event OracleChanged(address indexed sender, EnergyOracle energyOracle);
    /// @dev Emitted when a manager changes the `register` link to another contract
    event RegisterChanged(address indexed sender, Register register);
    /// @dev Emitted when a manager changes the `escrow` link to another contract
    event EscrowChanged(address indexed sender, Escrow escrow);

    // Event for fee receiver address change
    /// @dev Emitted when a manager changes the `feeReceiver` link to another address
    event FeeReceiverChanged(address indexed sender, address newReceiver);

    // Events for configuration value changes
    /// @dev Emitted when a manager changes the `rewardAmount`
    event RewardAmountChanged(address indexed sender, uint256 newRewardAmount);
    /// @dev Emitted when a manager changes the `fees`
    event FeesChanged(address indexed sender, uint256 newFees);

    /// @dev Keccak256 hashed `MANAGER_ROLE` string
    bytes32 public constant MANAGER_ROLE = keccak256(bytes("MANAGER_ROLE"));

    /// @dev Tokens struct
    Tokens private _tokens;

    /// @dev Contracts struct
    Contracts public _contracts;

    /// @dev Address where fees will be paid
    address public feeReceiver;

    /// @dev Values struct
    Values public _values;

    /**
     * @notice Constructor to initialize the Manager contract
     * @param tokens_ The initial addresses of the token contracts
     * @param _feeReceiver The address of the fee receiver
     * @param values_ The initial values for reward amount and fees
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `MANAGER_ROLE` roles to `msg.sender`
     */
    constructor(Tokens memory tokens_, address _feeReceiver, Values memory values_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);

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
        if (address(tokens_.mgt) != address(0)) {
            emit MGTchanged(msg.sender, tokens_.mgt);
            _tokens.mgt = tokens_.mgt;
        }

        if (address(tokens_.ecu) != address(0)) {
            emit ECUchanged(msg.sender, tokens_.ecu);
            _tokens.ecu = tokens_.ecu;
        }

        if (address(tokens_.nrgs) != address(0)) {
            emit NRGSchanged(msg.sender, tokens_.nrgs);
            _tokens.nrgs = tokens_.nrgs;
        }

        if (address(tokens_.nrgop) != address(0)) {
            emit NRGOPchanged(msg.sender, tokens_.nrgop);
            _tokens.nrgop = tokens_.nrgop;
        }
    }

    /**
     * @notice Changes contracts links to others.
     * @dev Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * @param contracts_ The new addresses of the functional contracts
     */
    function changeContracts(Contracts calldata contracts_) external onlyRole(MANAGER_ROLE) {
        if (address(contracts_.staking) != address(0)) {
            emit StakingChanged(msg.sender, contracts_.staking);
            _contracts.staking = contracts_.staking;
        }

        if (address(contracts_.oracle) != address(0)) {
            emit OracleChanged(msg.sender, contracts_.oracle);
            _contracts.oracle = contracts_.oracle;
        }

        if (address(contracts_.register) != address(0)) {
            emit RegisterChanged(msg.sender, contracts_.register);
            _contracts.register = contracts_.register;
        }

        if (address(contracts_.escrow) != address(0)) {
            emit EscrowChanged(msg.sender, contracts_.escrow);
            _contracts.escrow = contracts_.escrow;
        }
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
        if (values_.rewardAmount > 0) {
            emit RewardAmountChanged(msg.sender, values_.rewardAmount);
            _values.rewardAmount = values_.rewardAmount;
        }

        if (values_.fees > 0) {
            emit FeesChanged(msg.sender, values_.fees);
            _values.fees = values_.fees;
        }
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

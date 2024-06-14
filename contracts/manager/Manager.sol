// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/IManager.sol";

/**
 * @title Manager contract for contracts management
 * @dev This contract manages the links to various contracts and stores configuration values for the system.
 * @author Bohdan
 */
contract Manager is AccessControl, IManager {
    // Contracts
    /// @dev Emitted when a manager has changed the `MGT` link to another contract
    event MGTchanged(address indexed sender, IMGT newMGT);
    // NFTs
    /// @dev Emitted when a manager has changed the `ECU` link to another contract
    event ECUchanged(address indexed sender, IECU newECU);
    /// @dev Emitted when a manager has changed the `NRGS` link to another contract
    event NRGSchanged(address indexed sender, INRGS newNRGS);
    /// @dev Emitted when a manager has changed the `staking` link to another contract
    event StakingChanged(address indexed sender, IStakingReward staking);
    /// @dev Emitted when a manager has changed the `energyOracle` link to another contract
    event OracleChanged(address indexed sender, IEnergyOracle energyOracle);
    /// @dev Emitted when a manager has changed the `register` link to another contract
    event RegisterChanged(address indexed sender, IRegister register);
    /// @dev Emitted when a manager has changed the `escrow` link to another contract
    event EscrowChanged(address indexed sender, IEscrow escrow);

    // Address
    /// @dev Emitted when a manager has changed the `feeReceiver` link to another address
    event FeeReceiverChanged(address indexed sender, address newReceiver);

    // Amount
    /// @dev Emitted when a manager has changed the `rewardAmount`
    event RewardAmountChanged(address indexed sender, uint256 newRewardAmount);
    /// @dev Emitted when a manager has changed the `tolerance`
    event ToleranceChanged(address indexed sender, uint256 newTolerance);
    /// @dev Emitted when a manager has changed the `fees`
    event FeesChanged(address indexed sender, uint256 newFees);

    /// @dev Keccak256 hashed `MANAGER_ROLE` string
    bytes32 public constant MANAGER_ROLE = keccak256(bytes("MANAGER_ROLE"));

    // Contracts
    /// @dev Microgrid token
    IMGT public MGT;
    /// @dev Electricity Consumers SFT token
    IECU public ECU;
    /// @dev Energy Supplier NFT token
    INRGS public NRGS;

    /// @dev Staking contract
    IStakingReward public staking;
    /// @dev EnergyOracle contract
    IEnergyOracle public energyOracle;
    /// @dev Register contract
    IRegister public register;
    /// @dev Escrow contract
    IEscrow public escrow;

    /// @dev Address where fees will be paid
    address public feeReceiver;

    // Values
    /// @dev Amount of rewards to suppliers
    uint256 public rewardAmount;
    /// @dev Tolerance for equality
    uint256 public tolerance;
    /// @dev Fees for payments to creators
    uint256 public fees;

    /// @dev Throws if passed address 0 as parameter
    modifier zeroAddressCheck(address supplier) {
        require(supplier != address(0), "Manager: passed address is address 0");
        _;
    }

    /// @dev Throws if passed value is <=0
    modifier gtZero(uint256 value) {
        require(value > 0, "Manager: passed value is <= 0");
        _;
    }

    /**
     * @notice Constructor to initialize the Manager contract
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `MANAGER_ROLE` roles to `msg.sender`
     * Sets `MGT` token address, `ECU` and `NRGS` tokens addresses, `staking` address
     * Sets `feeReceiver` address
     * Sets `rewardAmount`, `tolerance`, and `fees`
     */
    constructor(
        IMGT _MGT,
        IECU _ECU,
        INRGS _NRGS,
        address _feeReceiver,
        uint256 _rewardAmount,
        uint256 _tolerance,
        uint256 _fees
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);

        MGT = _MGT;
        ECU = _ECU;
        NRGS = _NRGS;

        feeReceiver = _feeReceiver;

        rewardAmount = _rewardAmount;
        tolerance = _tolerance;
        fees = _fees;
    }

    /**
     * @notice Changes MGT link to another contract.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_MGT` must be not address 0
     *
     * @param _MGT IMGT
     */
    function changeMGT(IMGT _MGT) external onlyRole(MANAGER_ROLE) zeroAddressCheck(address(_MGT)) {
        emit MGTchanged(msg.sender, _MGT);

        MGT = _MGT;
    }

    /**
     * @notice Changes NRGS link to another contract.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_NRGS` must be not address 0
     *
     * @param _NRGS INRGS

     */
    function changeNRGS(INRGS _NRGS) external onlyRole(MANAGER_ROLE) zeroAddressCheck(address(_NRGS)) {
        emit NRGSchanged(msg.sender, _NRGS);

        NRGS = _NRGS;
    }

    /**
     * @notice Changes ECU link to another contract.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_ECU` must be not address 0
     *
     * @param _ECU IECU

     */
    function changeECU(IECU _ECU) external onlyRole(MANAGER_ROLE) zeroAddressCheck(address(_ECU)) {
        emit ECUchanged(msg.sender, _ECU);

        ECU = _ECU;
    }

    /**
     * @notice Changes `staking` link to another contract.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_staking` must be not address 0
     *
     * @param _staking IStakingReward
     */
    function changeStakingContract(
        IStakingReward _staking
    ) external onlyRole(MANAGER_ROLE) zeroAddressCheck(address(_staking)) {
        emit StakingChanged(msg.sender, _staking);

        staking = _staking;
    }

    /**
     * @notice Changes `energyOracle` link to another contract.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_energyOracle` must be not address 0
     *
     * @param _energyOracle IEnergyOracle
     */
    function changeEnergyOracle(
        IEnergyOracle _energyOracle
    ) external onlyRole(MANAGER_ROLE) zeroAddressCheck(address(_energyOracle)) {
        emit OracleChanged(msg.sender, _energyOracle);

        energyOracle = _energyOracle;
    }

    /**
     * @notice Changes `register` link to another contract.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_register` must be not address 0
     *
     * @param _register IRegister
     */
    function changeRegister(IRegister _register) external onlyRole(MANAGER_ROLE) zeroAddressCheck(address(_register)) {
        emit RegisterChanged(msg.sender, _register);

        register = _register;
    }

    /**
     * @notice Changes `escrow` link to another contract.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_escrow` must be not address 0
     *
     * @param _escrow IEscrow
     */
    function changeEscrow(IEscrow _escrow) external onlyRole(MANAGER_ROLE) zeroAddressCheck(address(_escrow)) {
        emit EscrowChanged(msg.sender, _escrow);

        escrow = _escrow;
    }

    /**
     * @notice Changes `feeReceiver` link to another address.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_newFeeReceiver` must be not address 0
     *
     * @param _newFeeReceiver address
     */
    function changeFeeReceiver(
        address _newFeeReceiver
    ) external onlyRole(MANAGER_ROLE) zeroAddressCheck(_newFeeReceiver) {
        emit FeeReceiverChanged(msg.sender, _newFeeReceiver);

        feeReceiver = _newFeeReceiver;
    }

    /**
     * @notice Changes reward amount to another amount.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_newRewardAmount` must be > 0
     *
     * @param _newRewardAmount uint256
     */
    function changeRewardAmount(uint256 _newRewardAmount) external onlyRole(MANAGER_ROLE) gtZero(_newRewardAmount) {
        emit RewardAmountChanged(msg.sender, _newRewardAmount);

        rewardAmount = _newRewardAmount;
    }

    /**
     * @notice Changes tolerance amount to another amount.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_newTolerance` must be > 0
     *
     * @param _newTolerance uint256
     */
    function changeTolerance(uint256 _newTolerance) external onlyRole(MANAGER_ROLE) gtZero(_newTolerance) {
        emit ToleranceChanged(msg.sender, _newTolerance);

        tolerance = _newTolerance;
    }

    /**
     * @notice Changes fees amount to another amount.
     * Requirements:
     * - `msg.sender` must have `MANAGER_ROLE`
     * - `_newFees` must be > 0
     *
     * @param _newFees uint256
     */
    function changeFees(uint256 _newFees) external onlyRole(MANAGER_ROLE) gtZero(_newFees) {
        emit FeesChanged(msg.sender, _newFees);

        fees = _newFees;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/Pausable.sol";

import "../Parent.sol";

/**
 * @title Energy Oracle contract to record indicators of consumed energy from the source
 * @dev This contract allows recording and retrieving energy consumption data for users and tokens.
 * The contract is managed by an Energy Oracle Provider who can record energy consumption and an Energy Oracle Manager
 * who can retrieve the consumption data.
 * @author Bohdan
 */
contract EnergyOracle is Parent, Pausable {
    ///@dev Emmited when an Energy Oracle provider
    event EnergyConsumptionRecorded(
        address indexed sender,
        address indexed whoseConsumption,
        uint256 indexed supplierId,
        uint256 consumption,
        uint256 timestamp
    );
    ///@dev Emmited when called updateEnergyConsumptionsAndGetResult()
    event EnergyConsumptionPaid(
        address indexed sender,
        address indexed whoseConsumption,
        uint256 indexed supplierId,
        uint256 timestamp
    );

    /// @dev Keccak256 hashed `ENERGY_ORACLE_MANAGER_ROLE` string
    bytes32 public constant ENERGY_ORACLE_MANAGER_ROLE = keccak256(bytes("ENERGY_ORACLE_MANAGER_ROLE"));
    /// @dev Keccak256 hashed `ENERGY_ORACLE_PROVIDER_ROLE` string
    bytes32 public constant ENERGY_ORACLE_PROVIDER_ROLE = keccak256(bytes("ENERGY_ORACLE_PROVIDER_ROLE"));
    /// @dev Keccak256 hashed `ESCROW` string
    bytes32 public constant ESCROW = keccak256(bytes("ESCROW"));

    /// @dev Mapping to store consumption
    mapping(address => mapping(uint256 => uint256)) private _energyConsumptions; // user => supplierId => id => energy consumption

    /// @dev Throws if passed address 0 as parameter
    modifier isCorrectUser(address account, uint supplierId) {
        require(manager.ELU().balanceOf(account, supplierId) > 0, "EnergyOracle: user is not correct");
        _;
    }

    /// @notice Constructor to initialize StakingManagement contract
    /// @dev Grants `DEFAULT_ADMIN_ROLE`, `ENERGY_ORACLE_MANAGER_ROLE` and `ENERGY_ORACLE_PROVIDER_ROLE` roles to `msg.sender`
    constructor(IManager _manager) Parent(_manager) {
        _grantRole(ENERGY_ORACLE_MANAGER_ROLE, msg.sender);
        _grantRole(ENERGY_ORACLE_PROVIDER_ROLE, msg.sender);
        _grantRole(ESCROW, msg.sender);
    }

    /**
     * @notice Records the energy consumption for a user and supplier at a specific timestamp.
     * @dev
     * Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
     * - `user` must have supplier with `supplierId`
     *
     * @param user The user address
     * @param supplierId The supplier ID
     * @param consumption The energy consumption value
     */
    function recordEnergyConsumption(
        address user,
        uint supplierId,
        uint256 consumption
    )
        external
        onlyRole(ENERGY_ORACLE_PROVIDER_ROLE)
        whenNotPaused
        zeroAddressCheck(user)
        isCorrectUser(user, supplierId)
    {
        _energyConsumptions[user][supplierId] = consumption;

        manager.MCGR().mint(msg.sender, manager.rewardAmount() * 2);

        emit EnergyConsumptionRecorded(msg.sender, user, supplierId, consumption, block.timestamp);
    }

    /// @notice Updates the energy consumption for a user, supplier
    /// Requirements: `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
    /// @param user The user address
    /// @param supplierId The supplier ID
    function updateEnergyConsumptions(
        address user,
        uint256 supplierId
    ) public onlyRole(ESCROW) whenNotPaused zeroAddressCheck(user) isCorrectUser(user, supplierId) {
        _energyConsumptions[user][supplierId] = 0;

        emit EnergyConsumptionPaid(msg.sender, user, supplierId, block.timestamp);
    }

    /**
     * @notice Pauses the contract
     * @dev Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_MANAGER_ROLE
     */
    function pause() external onlyRole(ENERGY_ORACLE_MANAGER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     * @dev Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_MANAGER_ROLE
     */
    function unpause() external onlyRole(ENERGY_ORACLE_MANAGER_ROLE) {
        _unpause();
    }

    /**
     * @dev Retrieves the timestamp and consumption value for a specific energy consumption record.
     * @param user The address of the user.
     * @param supplierId The ID of the token.
     * @return consumption The consumption value of the energy consumption record.
     */
    function energyConsumptions(address user, uint256 supplierId) public view returns (uint consumption) {
        consumption = _energyConsumptions[user][supplierId];
    }
}

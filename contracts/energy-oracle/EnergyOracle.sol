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

    /// @dev Mapping to store productions
    mapping(address => mapping(uint256 => uint256)) private _energyProductions; // user => supplierId => id => energy production

    /// @dev Throws if passed address 0 as parameter
    modifier isCorrectUser(address account, uint256 supplierId) {
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
     * @notice Records the energy production by the supplier at a specific timestamp.
     * @dev
     * Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
     * - `supplier` must have `supplierId`
     *
     * @param supplier The supplier address
     * @param supplierId The supplier ID
     * @param production The energy production value
     */
    function recordEnergyProduction(
        address supplier,
        uint256 supplierId,
        uint256 production
    )
        external
        onlyRole(ENERGY_ORACLE_PROVIDER_ROLE)
        whenNotPaused
        zeroAddressCheck(supplier)
        isCorrectUser(supplier, supplierId)
    {
        _energyProductions[supplier][supplierId] = production;

        emit EnergyConsumptionRecorded(msg.sender, supplier, supplierId, production, block.timestamp);
    }

    /**
     * @notice Records the energy consumption for a consumer and supplier at a specific timestamp.
     * @dev
     * Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
     * - `consumer` must have supplier with `supplierId`
     *
     * @param consumer The user address
     * @param supplierId The supplier ID
     * @param consumption The energy consumption value
     */
    function recordEnergyConsumption(
        address consumer,
        uint256 supplierId,
        uint256 consumption
    )
        external
        onlyRole(ENERGY_ORACLE_PROVIDER_ROLE)
        whenNotPaused
        zeroAddressCheck(consumer)
        isCorrectUser(consumer, supplierId)
    {
        _energyConsumptions[consumer][supplierId] = consumption;

        manager.MGT().mint(msg.sender, manager.rewardAmount() * 2);

        emit EnergyConsumptionRecorded(msg.sender, consumer, supplierId, consumption, block.timestamp);
    }

    /// @notice Updates the energy consumption for a consumer, supplier
    /// Requirements: `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
    /// @param consumer The consumer address
    /// @param supplierId The supplier ID
    function updateEnergyConsumptions(
        address consumer,
        uint256 supplierId
    ) public onlyRole(ESCROW) whenNotPaused zeroAddressCheck(consumer) isCorrectUser(consumer, supplierId) {
        _energyConsumptions[consumer][supplierId] = 0;

        emit EnergyConsumptionPaid(msg.sender, consumer, supplierId, block.timestamp);
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
     * @dev Retrieves the consumption value for a specific energy consumption record.
     * @param consumer The address of the consumer.
     * @param supplierId The ID of the supplier.
     * @return consumption The consumption value of the energy consumption record.
     */
    function energyConsumptions(address consumer, uint256 supplierId) public view returns (uint256 consumption) {
        consumption = _energyConsumptions[consumer][supplierId];
    }

    /**
     * @dev Retrieves the production value for a specific energy production record.
     * @param supplier The address of the supplier.
     * @param supplierId The ID of the supplier.
     * @return production The production value of the energy production record.
     */
    function energyProductions(address supplier, uint256 supplierId) public view returns (uint256 production) {
        production = _energyProductions[supplier][supplierId];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

import { IToken } from "./interfaces/IToken.sol";
import { Main } from "./Main.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/// @dev Error to indicate that the consumer address is incorrect
/// @param incorrectConsumer The incorrect consumer address
/// @param supplierId The ID of the supplier
error IncorrectConsumer(address incorrectConsumer, uint256 supplierId);

/// @dev Error to indicate that the supplier address is incorrect
/// @param incorrectSupplier The incorrect supplier address
/// @param supplierId The ID of the supplier
error IncorrectSupplier(address incorrectSupplier, uint256 supplierId);

/**
 * @title Energy Oracle contract to record indicators of consumed energy from the source
 * @dev This contract allows recording and retrieving energy consumption data for consumers and tokens.
 * The contract is managed by an Energy Oracle Provider who can record energy consumption and an Energy Oracle Manager
 * who can retrieve the consumption data.
 * @author Bohdan
 */
contract EnergyOracle is Ownable, EnumerableRoles, Pausable {
    /// @dev Emmited when an Energy Oracle provider records energy production
    /// @param sender The address of the sender who recorded the energy production
    /// @param supplier The address of the supplier
    /// @param supplierId The ID of the supplier
    /// @param production The amount of energy produced
    /// @param timestamp The timestamp when the energy production was recorded
    event EnergyProductionRecorded(
        address indexed sender,
        address indexed supplier,
        uint256 indexed supplierId,
        uint256 production,
        uint256 timestamp
    );

    /// @dev Emmited when an Energy Oracle provider records energy consumption
    /// @param sender The address of the sender who recorded the energy consumption
    /// @param whoseConsumption The address of the consumer
    /// @param supplierId The ID of the supplier
    /// @param consumption The amount of energy consumed
    /// @param timestamp The timestamp when the energy consumption was recorded
    event EnergyConsumptionRecorded(
        address indexed sender,
        address indexed whoseConsumption,
        uint256 indexed supplierId,
        uint256 consumption,
        uint256 timestamp
    );

    /// @dev Emmited when called updateEnergyConsumptionsAndGetResult()
    /// @param sender The address of the sender who updated the energy consumption
    /// @param whoseConsumption The address of the consumer
    /// @param supplierId The ID of the supplier
    /// @param timestamp The timestamp when the energy consumption was updated
    event EnergyConsumptionPaid(
        address indexed sender,
        address indexed whoseConsumption,
        uint256 indexed supplierId,
        uint256 timestamp
    );

    /// @dev Keccak256 hashed `ENERGY_ORACLE_MANAGER_ROLE` string
    uint256 public constant ENERGY_ORACLE_MANAGER_ROLE = uint256(keccak256(bytes("ENERGY_ORACLE_MANAGER_ROLE")));
    /// @dev Keccak256 hashed `ENERGY_ORACLE_PROVIDER_ROLE` string
    uint256 public constant ENERGY_ORACLE_PROVIDER_ROLE = uint256(keccak256(bytes("ENERGY_ORACLE_PROVIDER_ROLE")));
    /// @dev Keccak256 hashed `ESCROW` string
    uint256 public constant ESCROW = uint256(keccak256(bytes("ESCROW")));

    /// @dev Main contract
    Main public main;

    /// @dev Mapping to store consumption
    mapping(address => mapping(uint256 => uint256)) private _energyConsumptions; // consumer => supplierId => id => energy consumption

    /// @dev Mapping to store productions
    mapping(address => mapping(uint256 => uint256)) private _energyProductions; // supplier => supplierId => id => energy production

    /// @dev Throws if passed address 0 as parameter
    /// @param account The address to check
    modifier zeroAddressCheck(address account) {
        if (account == address(0)) {
            revert ZeroAddressPassed();
        }

        _;
    }

    /// @notice Constructor to initialize StakingManagement contract
    /// @dev Grants `DEFAULT_ADMIN_ROLE`, `ENERGY_ORACLE_MANAGER_ROLE` and `ENERGY_ORACLE_PROVIDER_ROLE` roles to `msg.sender`
    /// @param _main The address of the main contract
    constructor(Main _main) {
        _setOwner(msg.sender);

        main = _main;
    }

    /// @dev Changes `main` address to the `_main` address.
    /// @param _main The address of the new main contract
    function changeMain(Main _main) external onlyOwner zeroAddressCheck(address(_main)) {
        main = _main;
    }

    /**
     * @notice Records the energy production by the supplier at a specific timestamp.
     * @dev Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
     * - `supplier` must have `supplierId`
     *
     * @param supplier The supplier address
     * @param supplierId The supplier ID
     * @param production The energy production value
     */
    function recordEnergyProductions(
        address supplier,
        uint256 supplierId,
        uint256 production
    ) external onlyRole(ENERGY_ORACLE_PROVIDER_ROLE) whenNotPaused zeroAddressCheck(supplier) {
        if (IToken(main.tokens().nrgs).ownerOf(supplierId) != supplier) {
            revert IncorrectSupplier(supplier, supplierId);
        }

        _energyProductions[supplier][supplierId] = production;

        // When smart meter is using comment the line
        // main.tokens().mgt.mint(msg.sender, main.values().rewardAmount * 2);

        emit EnergyProductionRecorded(msg.sender, supplier, supplierId, production, block.timestamp);
    }

    /**
     * @notice Records the energy consumption for a consumer and supplier at a specific timestamp.
     * @dev Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
     * - `consumer` must have supplier with `supplierId`
     *
     * @param consumer The consumer address
     * @param supplierId The supplier ID
     * @param consumption The energy consumption value
     */
    function recordConsumerConsumptions(
        address consumer,
        uint256 supplierId,
        uint256 consumption
    ) external onlyRole(ENERGY_ORACLE_PROVIDER_ROLE) whenNotPaused zeroAddressCheck(consumer) {
        if (IToken(main.tokens().ecu).balanceOf(consumer, supplierId) == 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }

        _energyConsumptions[consumer][supplierId] = consumption;

        // When smart meter is using comment the line
        // main.tokens().mgt.mint(msg.sender, main.values().rewardAmount * 2);

        emit EnergyConsumptionRecorded(msg.sender, consumer, supplierId, consumption, block.timestamp);
    }

    /**
     * @notice Updates the energy consumption for a consumer, supplier
     * @dev Retrieves the production value for a specific energy production record.
     * Requirements: `msg.sender` must have ESCROW role
     * @param consumer The consumer address
     * @param supplierId The ID of the supplier.
     */
    function updateEnergyConsumptions(
        address consumer,
        uint256 supplierId
    ) public onlyRole(ESCROW) whenNotPaused zeroAddressCheck(consumer) {
        if (IToken(main.tokens().ecu).balanceOf(consumer, supplierId) == 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }

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

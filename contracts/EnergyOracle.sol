// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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

/// @dev Error to indicate that the producer address is incorrect
/// @param producerId The ID of the producer
error IncorrectProducer(uint256 producerId);

/// @dev Error to indicate that the supplier address is incorrect
/// @param supplierId The ID of the supplier
error IncorrectSupplier(uint256 supplierId);

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
    /// @param supplierId The ID of the supplier
    /// @param price The energy price
    /// @param timestamp The timestamp when the energy production was recorded
    event EnergyPriceRecorded(address indexed sender, uint256 indexed supplierId, uint256 price, uint256 timestamp);

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
    event EnergyConsumptionUpdated(
        address indexed sender,
        address indexed whoseConsumption,
        uint256 indexed supplierId,
        uint256 consumptionToAdd,
        uint256 consumptionToRemove,
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

    /// @dev Mapping to store prices
    mapping(uint256 => uint256) private _supplierEnergyPrice; // supplierId => energy price
    /// @dev Mapping to store productions
    mapping(uint256 => uint256) private _energyProductions; // producer => energy production
    /// @dev Mapping to store consumption
    mapping(address => mapping(uint256 => uint256)) private _energyConsumptionDebtsInUSD; // consumer => supplierId => id => energy consumption debt

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

    function recordSupplierPrice(
        uint256 supplierId,
        uint256 supplierECTPrice
    ) external onlyRole(ENERGY_ORACLE_PROVIDER_ROLE) {
        require(
            IToken(main.tokens().electricityConsumerToken).ownerOf(supplierId) != address(0),
            IncorrectSupplier(supplierId)
        );
        _supplierEnergyPrice[supplierId] = supplierECTPrice;

        // TODO: Uncomment if used not smart meters
        IToken(main.tokens().microgridGovernanceToken).mint(msg.sender, main.MGT_TO_ORACLE_PROVIDER());

        emit EnergyPriceRecorded(msg.sender, supplierId, supplierECTPrice, block.timestamp);
    }

    /**
     * @notice Records the energy production by the producer at a specific timestamp.
     * @dev Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
     * - `producer` must have `producerId`
     *
     * @param producerId The producer ID
     * @param production The energy production value
     */
    function recordEnergyProductions(
        uint256 producerId,
        uint256 production
    ) external onlyRole(ENERGY_ORACLE_PROVIDER_ROLE) whenNotPaused {
        address producer = IToken(main.tokens().energyProducerToken).ownerOf(producerId);
        require(producer != address(0), IncorrectProducer(producerId));

        _energyProductions[producerId] = production;

        IToken(main.tokens().energyCreditToken).mint(producer, production);

        //TODO: change msg.sender to oracle provider
        IToken(main.tokens().microgridGovernanceToken).mint(producer, production);
        // TODO: Uncomment if used not smart meters
        // IToken(main.tokens().microgridGovernanceToken).mint(msg.sender, MGT_TO_ORACLE_PROVIDER);

        emit EnergyProductionRecorded(msg.sender, producer, producerId, production, block.timestamp);
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
        address supplier = IToken(main.tokens().electricityConsumerToken).ownerOf(supplierId);
        require(supplier != address(0), IncorrectSupplier(supplierId));
        if (IToken(main.tokens().electricityConsumerToken).balanceOf(consumer, supplierId) == 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }

        uint256 rewardToSupplier = (main.MGT_PER_ECT_CONSUMED() * consumption) / 1e18;

        _energyConsumptionDebtsInUSD[consumer][supplierId] += consumption * _supplierEnergyPrice[supplierId];

        IToken(main.tokens().energyCreditToken).burn(supplier, consumption);
        IToken(main.tokens().microgridGovernanceToken).mint(supplier, rewardToSupplier);
        // TODO: Uncomment if used not smart meters
        // IToken(main.tokens().microgridGovernanceToken).mint(msg.sender, MGT_TO_ORACLE_PROVIDER);

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
        uint256 supplierId,
        uint256 consumptionToAdd,
        uint256 consumptionToRemove
    ) public onlyRole(ESCROW) whenNotPaused zeroAddressCheck(consumer) {
        address supplier = IToken(main.tokens().electricityConsumerToken).ownerOf(supplierId);
        require(supplier != address(0), IncorrectSupplier(supplierId));
        if (IToken(main.tokens().electricityConsumerToken).balanceOf(consumer, supplierId) == 0) {
            revert IncorrectConsumer(consumer, supplierId);
        }

        _energyConsumptionDebtsInUSD[consumer][supplierId] += consumptionToAdd;
        _energyConsumptionDebtsInUSD[consumer][supplierId] -= consumptionToRemove;

        emit EnergyConsumptionUpdated(
            msg.sender,
            consumer,
            supplierId,
            consumptionToAdd,
            consumptionToRemove,
            block.timestamp
        );
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
     * @dev Retrieves the price per energy consumption.
     * @param supplierId The id of the supplier.
     * @return price The price of the energy consumption.
     */
    function supplierEnergyPrice(uint256 supplierId) public view returns (uint256 price) {
        price = _supplierEnergyPrice[supplierId];
    }

    /**
     * @dev Retrieves the consumption value for a specific energy consumption record.
     * @param consumer The address of the consumer.
     * @param supplierId The ID of the supplier.
     * @return consumption The consumption value of the energy consumption record.
     */
    function energyConsumptionDebtsInUSD(
        address consumer,
        uint256 supplierId
    ) public view returns (uint256 consumption) {
        consumption = _energyConsumptionDebtsInUSD[consumer][supplierId];
    }

    /**
     * @dev Retrieves the production value for a specific energy production record.
     * @param producerId The ID of the producer.
     * @return production The production value of the energy production record.
     */
    function energyProductions(uint256 producerId) public view returns (uint256 production) {
        production = _energyProductions[producerId];
    }
}

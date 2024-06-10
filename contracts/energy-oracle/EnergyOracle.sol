// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/Pausable.sol";

import "../Parent.sol";

struct EnergyConsumption {
    uint256 timestamp;
    uint256 consumption;
}

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
    event EnergyConsumptionSent(
        address indexed sender,
        address indexed whoseConsumption,
        uint256 indexed supplierId,
        uint256 consumption,
        uint256 timestamp
    );

    /// @dev Keccak256 hashed `ENERGY_ORACLE_MANAGER_ROLE` string
    bytes32 public constant ENERGY_ORACLE_MANAGER_ROLE = keccak256(bytes("ENERGY_ORACLE_MANAGER_ROLE"));
    /// @dev Keccak256 hashed `ENERGY_ORACLE_PROVIDER_ROLE` string
    bytes32 public constant ENERGY_ORACLE_PROVIDER_ROLE = keccak256(bytes("ENERGY_ORACLE_PROVIDER_ROLE"));
    /// @dev Keccak256 hashed `ESCROW` string
    bytes32 public constant ESCROW = keccak256(bytes("ESCROW"));

    /// @dev Mapping to store consumption
    mapping(address => mapping(uint256 => EnergyConsumption[])) private _energyConsumptions; // user => supplierId => id => EnergyConsumptions
    mapping(address => mapping(uint => mapping(uint256 => bool))) private consumedTimestamps;

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
     * @notice Records the energy consumption for a user and token at a specific timestamp.
     * @dev
     * Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
     * - `user` must have token with `supplierId`
     * - `timestamp` must be equal to 21:00
     *
     * @param user The user address
     * @param supplierId The token ID
     * @param timestamp The timestamp for the energy consumption
     * @param consumption The energy consumption value
     */
    function recordEnergyConsumption(
        address user,
        uint supplierId,
        uint256 timestamp,
        uint256 consumption
    )
        external
        onlyRole(ENERGY_ORACLE_PROVIDER_ROLE)
        whenNotPaused
        zeroAddressCheck(user)
        isCorrectUser(user, supplierId)
    {
        require(timestamp <= block.timestamp, "EnergyOracle: timestamp has not yet arrived");

        EnergyConsumption[] storage consumptions = _energyConsumptions[user][supplierId];

        // Check if the previous value is within the acceptable range
        if (consumptions.length > 0) {
            EnergyConsumption storage previousValue = consumptions[consumptions.length - 1];
            require(
                isWithinAcceptableRange(previousValue.consumption, consumption),
                "EnergyOracle: Previous value is not within acceptable range"
            );
        }

        // Add the new consumption to the array
        consumptions.push(EnergyConsumption(timestamp, consumption));

        // Sort the array
        sortEnergyConsumptions(consumptions);

        // Calculate the median
        uint256 median = calculateMedian(consumptions);

        // Clear the array
        delete _energyConsumptions[user][supplierId];

        // Update the median value in the storage
        consumptions.push(EnergyConsumption(timestamp, median));
        _energyConsumptions[user][supplierId] = consumptions;

        manager.MCGR().mint(msg.sender, manager.rewardAmount() * 2);

        emit EnergyConsumptionRecorded(msg.sender, user, supplierId, timestamp, consumption);
    }

    /// @notice Gets the energy consumption for a user, token
    /// Requirements: `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
    /// @param user The user address
    /// @param supplierId The token ID
    /// @return consumption The energy consumption value
    function updateEnergyConsumptionsAndGetResult(
        address user,
        uint256 supplierId
    )
        public
        onlyRole(ESCROW)
        whenNotPaused
        zeroAddressCheck(user)
        isCorrectUser(user, supplierId)
        returns (uint256 consumption)
    {
        EnergyConsumption[] memory userTokenConsumptions = _energyConsumptions[user][supplierId];

        if (userTokenConsumptions.length == 0) {
            return 0;
        }
        // Get the consumption value at the closest index
        consumption = userTokenConsumptions[0].consumption;

        // Clear the energy consumption array
        delete _energyConsumptions[user][supplierId];

        emit EnergyConsumptionSent(msg.sender, user, supplierId, block.timestamp, consumption);

        return consumption;
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
     * @param id The index of the energy consumption record.
     * @return timestamp The timestamp of the energy consumption record.
     * @return consumption The consumption value of the energy consumption record.
     */
    function energyConsumptions(
        address user,
        uint256 supplierId,
        uint256 id
    ) public view returns (uint timestamp, uint consumption) {
        EnergyConsumption memory energyConsumption = _energyConsumptions[user][supplierId][id];
        timestamp = energyConsumption.timestamp;
        consumption = energyConsumption.consumption;
    }

    function sortEnergyConsumptions(EnergyConsumption[] memory arr) private pure {
        // Perform sorting logic here
        // Replace this with your own sorting implementation
        // For example, you can use a simple sorting algorithm like bubble sort:
        uint256 n = arr.length;
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (arr[j].timestamp > arr[j + 1].timestamp) {
                    // Swap elements
                    EnergyConsumption memory temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    function calculateMedian(EnergyConsumption[] memory arr) private pure returns (uint256) {
        // Perform median calculation logic here
        // Replace this with your own median calculation implementation
        // For example, you can use the middle element if the array length is odd,
        // or calculate the average of the middle two elements if the length is even.
        uint256 length = arr.length;
        if (length % 2 == 0) {
            uint256 index1 = length / 2 - 1;
            uint256 index2 = length / 2;
            return (arr[index1].consumption + arr[index2].consumption) / 2;
        } else {
            uint256 index = length / 2;
            return arr[index].consumption;
        }
    }

    function isWithinAcceptableRange(uint256 previousValue, uint256 newValue) private view returns (bool) {
        uint256 tolerance = manager.tolerance();
        return (newValue >= previousValue - tolerance) && (newValue <= previousValue + tolerance);
    }
}

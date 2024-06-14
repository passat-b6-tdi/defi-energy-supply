// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Interface for energy oracle contract to record indicators of consumed energy from the source
 * @dev This contract allows recording and retrieving energy consumption data for consumers and tokens.
 * The contract is managed by an Energy Oracle Provider who can record energy consumption and an Energy Oracle Manager
 * who can retrieve the consumption data.
 * @author Bohdan
 */
interface IEnergyOracle {
    /// @notice Gets the energy consumption for a consumer to supplier
    /// Requirements: `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
    /// @param consumer The consumer address
    /// @param supplierId The supplier ID
    function updateEnergyConsumptions(address consumer, uint256 supplierId) external;

    /**
     * @notice Records the energy consumption for a consumer to supplier at a specific timestamp.
     * @dev
     * Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
     * - `consumer` must have token with `supplierId`
     * - `timestamp` must be equal to 21:00
     *
     * @param consumer The consumer address
     * @param supplierId The supplier ID
     * @param timestamp The timestamp for the energy consumption
     * @param consumption The energy consumption value
     */
    function recordEnergyConsumption(
        address consumer,
        uint256 supplierId,
        uint256 timestamp,
        uint256 consumption
    ) external;

    /**
     * @dev Retrieves the timestamp and consumption value for a specific energy consumption record.
     * @param consumer The address of the consumer.
     * @param supplierId The ID of the supplier.
     * @return consumption The consumption value of the energy consumption record.
     */
    function energyConsumptions(address consumer, uint256 supplierId) external view returns (uint256 consumption);
}

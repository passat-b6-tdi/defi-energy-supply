// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";

import { Main } from "./Main.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/// @dev Error to indicate that the caller is not the correct producer owner
/// @param producer The address of the producer
/// @param producerId The ID of the producer token
error IncorrectProducer(address producer, uint256 producerId);

/// @dev Error to indicate that the producer has not entered staking
/// @param producer The address of the producer
error ProducerNotEnteredStaking(address producer);

/**
 * @title StakingReward contract for reward management for energy producers
 * @dev This contract manages staking and reward distribution for energy producers.
 * @notice Producers call enterStakingProducer, getProducerRewards, exitStakingProducer to manage their MGT rewards.
 * @custom:security-contact security@example.com
 */
contract StakingReward is Ownable, EnumerableRoles {
    /// @dev Emitted when a producer enters staking
    /// @param producer The address of the producer
    /// @param timestamp The timestamp of entering staking
    event EnterStakingProducer(address indexed producer, uint256 timestamp);

    /// @dev Emitted when a producer exits staking
    /// @param producer The address of the producer
    /// @param timestamp The timestamp of exiting staking
    event ExitStakingProducer(address indexed producer, uint256 timestamp);

    /// @dev Emitted when a producer withdraws reward
    /// @param producer The address of the producer
    /// @param amount The amount of rewards sent
    event RewardSentProducer(address indexed producer, uint256 amount);

    /// @dev Structure to hold producer staking info
    struct ProducerInfo {
        uint256 updatedAt;
        uint256 pendingReward;
    }

    /// @dev Keccak256 hashed `STAKING_MANAGER_ROLE` string
    uint256 public constant STAKING_MANAGER_ROLE = uint256(keccak256(bytes("STAKING_MANAGER_ROLE")));

    /// @notice Reference to Main contract for parameters and contract addresses
    Main public main;

    /// @notice Total number of producers currently staking
    uint256 public totalProducers;

    /// @notice Mapping of producer address to tokenId to staking info
    mapping(address => mapping(uint256 => ProducerInfo)) public producers;

    /// @dev Modifier to check producer ownership of tokenId
    modifier isCorrectOwner(address producer, uint256 producerId) {
        if (main.tokens().energyProducerToken.ownerOf(producerId) != producer) {
            revert IncorrectProducer(producer, producerId);
        }
        _;
    }

    /// @dev Modifier to ensure address is not zero
    modifier zeroAddressCheck(address account) {
        if (account == address(0)) {
            revert ZeroAddressPassed();
        }
        _;
    }

    /**
     * @notice Constructor initializes StakingReward with Main reference
     * @param _main The address of the Main contract
     */
    constructor(Main _main) {
        _setOwner(msg.sender);
        _setRole(msg.sender, STAKING_MANAGER_ROLE, true);

        main = _main;
    }

    /**
     * @notice Update Main contract reference
     * @param _main The new Main contract address
     */
    function changeMain(Main _main) external onlyOwner zeroAddressCheck(address(_main)) {
        main = _main;
    }

    /**
     * @notice Producer enters staking to start accumulating MGT rewards
     * @param producerId The ID of the producer token
     */
    function enterStakingProducer(uint256 producerId) external isCorrectOwner(msg.sender, producerId) {
        totalProducers++;
        producers[msg.sender][producerId] = ProducerInfo({
            updatedAt: block.timestamp,
            pendingReward: _calculateReward(block.timestamp)
        });
        emit EnterStakingProducer(msg.sender, block.timestamp);
    }

    /**
     * @notice Producer claims accumulated rewards without exiting staking
     * @param producerId The ID of the producer token
     */
    function getProducerRewards(uint256 producerId) external isCorrectOwner(msg.sender, producerId) {
        ProducerInfo memory info = _updateInfo(msg.sender, producerId);
        producers[msg.sender][producerId].pendingReward = 0;
        producers[msg.sender][producerId].updatedAt = block.timestamp;

        main.tokens().microgridGovernanceToken.mint(msg.sender, info.pendingReward);
        emit RewardSentProducer(msg.sender, info.pendingReward);
    }

    /**
     * @notice Producer exits staking and claims rewards
     * @param producerId The ID of the producer token
     */
    function exitStakingProducer(uint256 producerId) external isCorrectOwner(msg.sender, producerId) {
        ProducerInfo memory info = _updateInfo(msg.sender, producerId);

        totalProducers--;
        delete producers[msg.sender][producerId];

        main.tokens().microgridGovernanceToken.mint(msg.sender, info.pendingReward);
        emit ExitStakingProducer(msg.sender, block.timestamp);
    }

    /**
     * @notice Update and return current ProducerInfo
     * @param producer The address of the producer
     * @param producerId The ID of the producer token
     * @return ProducerInfo The updated producer staking info
     */
    function updateProducerInfo(
        address producer,
        uint256 producerId
    ) public zeroAddressCheck(producer) isCorrectOwner(producer, producerId) returns (ProducerInfo memory) {
        return _updateInfo(producer, producerId);
    }

    /// @dev Internal: accumulate new pendingReward and update timestamp
    function _updateInfo(address producer, uint256 producerId) private returns (ProducerInfo memory) {
        ProducerInfo storage entry = producers[producer][producerId];
        if (entry.updatedAt == 0) {
            revert ProducerNotEnteredStaking(producer);
        }

        entry.pendingReward = _calculateReward(entry.updatedAt);
        entry.updatedAt = block.timestamp;
        return entry;
    }

    /// @dev Internal: compute reward since `fromTimestamp`
    function _calculateReward(uint256 fromTimestamp) private view returns (uint256) {
        uint256 elapsed = block.timestamp - fromTimestamp;
        return (main.MGT_TO_ORACLE_PROVIDER() * elapsed) / totalProducers;
    }
}

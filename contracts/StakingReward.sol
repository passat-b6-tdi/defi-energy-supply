// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "solady/src/auth/Ownable.sol";

import { ContractsBase } from "./base/ContractsBase.sol";
import { Main } from "./Main.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/// @dev Error to indicate that the caller is not the correct producer owner
/// @param producerId The ID of the producer token
error IncorrectProducerId(uint256 producerId);

/// @dev Error to indicate that the caller is not the correct producer owner
/// @param producer The address of the producer
/// @param producerId The ID of the producer token
error IncorrectProducer(address producer, uint256 producerId);

/// @dev Error to indicate that the producer has not entered staking
/// @param producerId The id of the producer
error ProducerNotEnteredStaking(uint256 producerId);

error OnlyRegister();

/**
 * @title StakingReward contract for reward management for energy producers
 * @dev This contract manages staking and reward distribution for energy producers.
 * @notice Producers call enterStakingProducer, getProducerRewards, exitStakingProducer to manage their MGT rewards.
 * @custom:security-contact security@example.com
 */
contract StakingReward is Ownable, ContractsBase {
    /// @dev Emitted when a producer enters staking
    /// @param producer The address of the producer
    /// @param producerId The address of the producerId
    /// @param timestamp The timestamp of entering staking
    event EnterStakingProducer(address indexed producer, uint256 indexed producerId, uint256 timestamp);

    /// @dev Emitted when a producer exits staking
    /// @param producer The address of the producer
    /// @param producerId The address of the producerId
    /// @param timestamp The timestamp of exiting staking
    event ExitStakingProducer(address indexed producer, uint256 indexed producerId, uint256 timestamp);

    /// @dev Emitted when a producer withdraws reward
    /// @param producer The address of the producer
    /// @param amount The amount of rewards sent
    event RewardSentProducer(address indexed producer, uint256 amount);

    /// @dev Structure to hold producer staking info
    struct ProducerInfo {
        uint256 updatedAt;
        uint256 pendingReward;
    }

    /// @notice Total number of producers currently staking
    uint256 public totalProducers;

    /// @notice Mapping of producerId to staking info
    mapping(uint256 => ProducerInfo) public producers;

    /// @dev Modifier to that the caller is the Register contract
    modifier onlyRegister() {
        require(address(main().contracts().register) == msg.sender, OnlyRegister());
        _;
    }

    /// @dev Modifier to check producer ownership of tokenId
    modifier isCorrectOwner(address producer, uint256 producerId) {
        if (main().tokens().energyProducerToken.ownerOf(producerId) != producer) {
            revert IncorrectProducer(producer, producerId);
        }
        _;
    }

    /**
     * @notice Constructor initializes StakingReward with Main reference
     * @param main_ The address of the Main contract
     */
    constructor(address main_) ContractsBase(main_) {
        _setOwner(msg.sender);
    }

    /// @notice Update Main contract address
    /// @param main_ New Main contract address
    function changeMain(address main_) public override onlyOwner {
        super.changeMain(main_);
    }

    /**
     * @notice Producer enters staking to start accumulating MGT rewards
     * @param producerId The ID of the producer token
     */
    function enterStakingProducer(uint256 producerId) external onlyRegister {
        address producer = main().tokens().energyProducerToken.ownerOf(producerId);

        totalProducers++;
        producers[producerId] = ProducerInfo({
            updatedAt: block.timestamp,
            pendingReward: _calculateReward(block.timestamp)
        });
        emit EnterStakingProducer(producer, producerId, block.timestamp);
    }

    /**
     * @notice Producer exits staking and claims rewards
     * @param producerId The ID of the producer token
     */
    function exitStakingProducer(uint256 producerId) external onlyRegister {
        ProducerInfo memory info = _updateInfo(producerId);

        address producer = main().tokens().energyProducerToken.ownerOf(producerId);

        totalProducers--;
        delete producers[producerId];

        main().tokens().microgridGovernanceToken.mint(producer, info.pendingReward);
        emit ExitStakingProducer(producer, producerId, block.timestamp);
    }

    /**
     * @notice Producer claims accumulated rewards without exiting staking
     * @param producerId The ID of the producer token
     */
    function getProducerRewards(uint256 producerId) external isCorrectOwner(msg.sender, producerId) {
        ProducerInfo memory info = _updateInfo(producerId);
        producers[producerId].pendingReward = 0;
        producers[producerId].updatedAt = block.timestamp;

        main().tokens().microgridGovernanceToken.mint(msg.sender, info.pendingReward);
        emit RewardSentProducer(msg.sender, info.pendingReward);
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
        return _updateInfo(producerId);
    }

    /// @dev Internal: accumulate new pendingReward and update timestamp
    function _updateInfo(uint256 producerId) private returns (ProducerInfo memory) {
        ProducerInfo storage entry = producers[producerId];
        if (entry.updatedAt == 0) {
            revert ProducerNotEnteredStaking(producerId);
        }

        entry.pendingReward = _calculateReward(entry.updatedAt);
        entry.updatedAt = block.timestamp;
        return entry;
    }

    /// @dev Internal: compute reward since `fromTimestamp`
    function _calculateReward(uint256 fromTimestamp) private view returns (uint256) {
        uint256 elapsed = block.timestamp - fromTimestamp;
        return (main().MGT_TO_ORACLE_PROVIDER() * elapsed) / totalProducers;
    }

    function main() public view returns (Main) {
        return Main(_main);
    }
}

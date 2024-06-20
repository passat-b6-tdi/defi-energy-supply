// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Manager } from "./Manager.sol";

/// @dev Error to indicate that a zero address was passed as a parameter
error ZeroAddressPassed();

/// @dev Error to indicate that the supplier address is incorrect
/// @param incorrectSupplier The incorrect supplier address
/// @param supplierId The ID of the supplier
error IncorrectSupplier(address incorrectSupplier, uint256 supplierId);

/// @dev Error to indicate that the supplier has not entered staking
/// @param supplier The address of the supplier
error SupplierNotEnteredStaking(address supplier);

/**
 * @title StakingReward contract for rewards management
 * @dev This contract manages the staking and reward distribution for energy suppliers.
 * @notice This contract allows for entering and exiting staking, updating rewards, and sending rewards to suppliers.
 * @custom:security-contact security@example.com
 */
contract StakingReward is AccessControl {
    /// @dev Emitted when a user registers as an Energy supplier
    /// @param sender The address of the sender
    /// @param supplier The address of the supplier
    /// @param timestamp The timestamp of entering staking
    event EnterStaking(address indexed sender, address indexed supplier, uint256 timestamp);

    /// @dev Emitted when a user unregisters as an Energy supplier
    /// @param sender The address of the sender
    /// @param supplier The address of the supplier
    /// @param timestamp The timestamp of exiting staking
    event ExitStaking(address indexed sender, address indexed supplier, uint256 timestamp);

    /// @dev Emitted when a supplier withdraws some amount of rewards from `StakingReward`
    /// @param sender The address of the sender
    /// @param to The address of the recipient
    /// @param amount The amount of rewards sent
    event RewardSent(address indexed sender, address indexed to, uint256 amount);

    /// @dev Structure to hold supplier information
    struct Supplier {
        uint256 updatedAt;
        uint256 pendingReward;
    }

    /// @dev Keccak256 hashed `STAKING_MANAGER_ROLE` string
    bytes32 public constant STAKING_MANAGER_ROLE = keccak256(bytes("STAKING_MANAGER_ROLE"));

    /// @dev Manager contract
    Manager public manager;

    /// @dev Total suppliers
    uint256 public totalSuppliers;

    /// @dev Mapping from address to supplier ID to supplier information
    mapping(address => mapping(uint256 => Supplier)) public suppliers;

    /// @dev Modifier to check if the caller is the correct owner of the supplier ID
    /// @param supplier The address of the supplier
    /// @param tokenId The ID of the supplier
    modifier isCorrectOwner(address supplier, uint256 tokenId) {
        if (manager.tokens().nrgs.ownerOf(tokenId) != supplier) {
            revert IncorrectSupplier(supplier, tokenId);
        }
        _;
    }

    /// @dev Modifier to check if the address is not zero
    /// @param account The address to check
    modifier zeroAddressCheck(address account) {
        if (account == address(0)) {
            revert ZeroAddressPassed();
        }
        _;
    }

    /**
     * @notice Constructor to initialize StakingReward contract
     * @param _manager The address of the Manager contract
     * @dev Grants `DEFAULT_ADMIN_ROLE` and `STAKING_MANAGER_ROLE` roles to `msg.sender`
     */
    constructor(Manager _manager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STAKING_MANAGER_ROLE, msg.sender);
        manager = _manager;
    }

    /// @dev Changes `manager` address to the `_newManager` address
    /// @param _newManager The address of the new manager contract
    function changeManager(
        Manager _newManager
    ) external onlyRole(DEFAULT_ADMIN_ROLE) zeroAddressCheck(address(_newManager)) {
        manager = _newManager;
    }

    /**
     * @notice Enters staking process
     * @dev Requirements:
     * - `msg.sender` must have STAKING_MANAGER_ROLE
     * - `supplier` must not be address 0
     * - `supplier` must have NRGS token
     * @param supplier The address of the supplier
     * @param tokenId The ID of the supplier
     */
    function enterStaking(
        address supplier,
        uint256 tokenId
    ) external onlyRole(STAKING_MANAGER_ROLE) zeroAddressCheck(supplier) isCorrectOwner(supplier, tokenId) {
        totalSuppliers++;
        suppliers[supplier][tokenId] = Supplier({
            updatedAt: block.timestamp,
            pendingReward: _updateRewardRate(block.timestamp)
        });
        emit EnterStaking(msg.sender, supplier, block.timestamp);
    }

    /**
     * @notice Sends rewards to suppliers
     * @dev Requirements:
     * - `msg.sender` must have STAKING_MANAGER_ROLE
     * - `supplier` must be in staking
     * @param supplier The address of the supplier
     * @param tokenId The ID of the supplier
     */
    function sendRewards(
        address supplier,
        uint256 tokenId
    ) external onlyRole(STAKING_MANAGER_ROLE) zeroAddressCheck(supplier) isCorrectOwner(supplier, tokenId) {
        _sendRewards(supplier, tokenId);
        emit RewardSent(msg.sender, supplier, block.timestamp);
    }

    /**
     * @notice Exits staking
     * @dev Requirements:
     * - `msg.sender` must have STAKING_MANAGER_ROLE
     * - `supplier` must be in staking
     * @param supplier The address of the supplier
     * @param tokenId The ID of the supplier
     */
    function exitStaking(
        address supplier,
        uint256 tokenId
    ) external onlyRole(STAKING_MANAGER_ROLE) zeroAddressCheck(supplier) {
        _sendRewards(supplier, tokenId);
        totalSuppliers--;
        delete suppliers[supplier][tokenId];
        emit ExitStaking(msg.sender, supplier, block.timestamp);
    }

    /**
     * @notice Updates rewards for `supplier`
     * @dev Requirements:
     * - `supplier` must be in staking
     * @param supplier The address of the supplier
     * @param tokenId The ID of the supplier
     * @return Supplier The updated supplier information
     */
    function updateRewards(
        address supplier,
        uint256 tokenId
    ) public zeroAddressCheck(supplier) isCorrectOwner(supplier, tokenId) returns (Supplier memory) {
        return _updateRewards(supplier, tokenId);
    }

    /// @dev Internal function to update rewards for a supplier
    /// @param supplier The address of the supplier
    /// @param tokenId The ID of the supplier
    /// @return Supplier The updated supplier information
    function _updateRewards(address supplier, uint256 tokenId) private returns (Supplier memory) {
        Supplier storage _supplier = suppliers[supplier][tokenId];
        if (_supplier.updatedAt == 0) {
            revert SupplierNotEnteredStaking(supplier);
        }
        assert(_supplier.updatedAt <= block.timestamp);
        _supplier.pendingReward = _updateRewardRate(_supplier.updatedAt);
        _supplier.updatedAt = block.timestamp;
        return _supplier;
    }

    /// @dev Internal function to send rewards to a supplier
    /// @param supplier The address of the supplier
    /// @param tokenId The ID of the supplier
    function _sendRewards(address supplier, uint256 tokenId) private {
        Supplier memory _supplier = _updateRewards(supplier, tokenId);
        suppliers[supplier][tokenId].pendingReward = 0;
        suppliers[supplier][tokenId].updatedAt = block.timestamp;
        manager.tokens().mgt.mint(supplier, _supplier.pendingReward);
    }

    /// @dev Internal function to update reward rate
    /// @param _updatedAt The timestamp when the rewards were last updated
    /// @return rewardToUser The calculated reward for the user
    function _updateRewardRate(uint256 _updatedAt) private view returns (uint256 rewardToUser) {
        uint256 timePassed = block.timestamp - _updatedAt;
        rewardToUser = (manager.values().rewardAmount * timePassed) / totalSuppliers;
    }
}

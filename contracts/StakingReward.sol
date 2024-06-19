// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Manager } from "./Manager.sol";

error ZeroAddressPassed();
error IncorrectSupplier(address incorrectSupplier, uint256 supplierId);
error SupplierNotEnteredStaking(address supplier);

/**
 * @title StakingReward contract for rewards management
 * @author Bohdan
 */
contract StakingReward is AccessControl {
    ///@dev Emmited when a user registers as an Energy supplier
    event EnterStaking(address indexed sender, address indexed supplier, uint256 timestamp);
    ///@dev Emmited when a user unregisters as an Energy supplier
    event ExitStaking(address indexed sender, address indexed supplier, uint256 timestamp);

    /// @dev Emitted when a supplier withdraws some amount of rewards from `StakingReward`
    event RewardSent(address indexed sender, address indexed to, uint256 amount);

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

    /// @dev Address to supplier
    mapping(address => mapping(uint256 => Supplier)) public suppliers;

    /// @dev Throws if passed not correct owner of tokenId
    modifier isCorrectOwner(address supplier, uint256 tokenId) {
        if (manager.tokens().nrgs.ownerOf(tokenId) != supplier) {
            revert IncorrectSupplier(supplier, tokenId);
        }

        _;
    }

    /// @dev Throws if passed address 0 as parameter
    modifier zeroAddressCheck(address account) {
        if (account == address(0)) {
            revert ZeroAddressPassed();
        }

        _;
    }

    /// @notice Constructor to initialize StakingReward contract
    /// @dev Grants `DEFAULT_ADMIN_ROLE` and `STAKING_MANAGER_ROLE` roles to `msg.sender`
    constructor(Manager _manager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STAKING_MANAGER_ROLE, msg.sender);

        manager = _manager;
    }

    /// @dev Changes `manager` address to the `_newManager` address.
    /// @param _newManager The address of the new manger contract
    function changeManager(
        Manager _newManager
    ) external onlyRole(DEFAULT_ADMIN_ROLE) zeroAddressCheck(address(_newManager)) {
        manager = _newManager;
    }

    /**
     * @notice Enters staking process.
     * Requirements:
     * - `msg.sender` must have STAKING_MANAGER_ROLE
     * - `supplier` must not be address 0
     * - `supplier` must have NRGS token
     *
     * @param supplier address
     * @param tokenId uint256
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
     * @notice Sends rewards to suppliers.
     * Requirements:
     * - `msg.sender` must have STAKING_MANAGER_ROLE
     * - `supplier` must be in staking
     *
     * @param supplier address
     * @param tokenId uint256
     */
    function sendRewards(
        address supplier,
        uint256 tokenId
    ) external onlyRole(STAKING_MANAGER_ROLE) zeroAddressCheck(supplier) isCorrectOwner(supplier, tokenId) {
        _sendRewards(supplier, tokenId);
        emit RewardSent(msg.sender, supplier, block.timestamp);
    }

    /**
     * @notice Exits staking.
     * Requirements:
     * - `msg.sender` must have STAKING_MANAGER_ROLE
     * - `supplier` must be in staking
     *
     * @param supplier address
     * @param tokenId uint256
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
     * @notice Updates rewards for `supplier`.
     * Requirements:
     * - `supplier` must be in staking
     *
     * @param supplier address
     * @param tokenId uint256
     * @return Supplier memory
     */
    function updateRewards(
        address supplier,
        uint256 tokenId
    ) public zeroAddressCheck(supplier) isCorrectOwner(supplier, tokenId) returns (Supplier memory) {
        return _updateRewards(supplier, tokenId);
    }

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

    function _sendRewards(address supplier, uint256 tokenId) private {
        Supplier memory _supplier = _updateRewards(supplier, tokenId);

        suppliers[supplier][tokenId].pendingReward = 0;
        suppliers[supplier][tokenId].updatedAt = block.timestamp;

        manager.tokens().mgt.mint(supplier, _supplier.pendingReward);
    }

    function _updateRewardRate(uint256 _updatedAt) private view returns (uint256 rewardToUser) {
        uint256 timePassed = block.timestamp - _updatedAt;

        rewardToUser = (manager.values().rewardAmount * timePassed) / totalSuppliers;
    }
}

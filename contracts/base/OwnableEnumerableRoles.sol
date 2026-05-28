// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";

/// @title OwnableEnumerableRoles
/// @notice Convenience base composing Solady's `Ownable` and `EnumerableRoles` access controls.
/// @dev Sets the deployer as the initial owner.
/// @author Bohdan
contract OwnableEnumerableRoles is Ownable, EnumerableRoles {
    /// @notice Sets `msg.sender` as the contract owner
    constructor() {
        _setOwner(msg.sender);
    }
}

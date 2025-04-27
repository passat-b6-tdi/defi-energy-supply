// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";

/**
 * @title Solady Token Base contract
 * @author Bohdan
 */
contract SoladyBaseToken is Ownable, EnumerableRoles {
    string internal NAME;
    string internal SYMBOL;

    /// @notice Constructor to initialize token contract
    /// @dev Grants owner role to `msg.sender`
    /// @dev Sets `name` and `symbol` of the token
    constructor(string memory _name, string memory _symbol) {
        _setOwner(msg.sender);

        NAME = _name;
        SYMBOL = _symbol;
    }

    /// @dev Returns the name of the token.
    function name() public view virtual returns (string memory) {
        return NAME;
    }

    /// @dev Returns the symbol of the token.
    function symbol() public view virtual returns (string memory) {
        return SYMBOL;
    }
}

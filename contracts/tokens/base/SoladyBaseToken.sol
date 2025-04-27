// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";

/**
 * @title Solady Token Base contract
 * @author Bohdan
 */
contract SoladyBaseToken is Ownable, EnumerableRoles {
    /// @dev Keccak256 hashed `MINTER_ROLE` string
    uint256 public constant MINTER_ROLE = uint256(keccak256(bytes("MINTER_ROLE")));
    /// @dev Keccak256 hashed `BURNER_ROLE` string
    uint256 public constant BURNER_ROLE = uint256(keccak256(bytes("BURNER_ROLE")));

    string internal NAME;
    string internal SYMBOL;

    /// @notice Constructor to initialize token contract
    /// @dev Grants owner role to `msg.sender`
    /// @dev Sets `name` and `symbol` of the token
    constructor(string memory _name, string memory _symbol) {
        _setOwner(msg.sender);
        _setRole(msg.sender, MINTER_ROLE, true);
        _setRole(msg.sender, BURNER_ROLE, true);

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

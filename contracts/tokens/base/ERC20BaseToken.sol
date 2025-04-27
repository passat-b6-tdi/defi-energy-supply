// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20 } from "solady/src/tokens/ERC20.sol";
import { SoladyBaseToken } from "./SoladyBaseToken.sol";

/**
 * @title ERC20 Base Token contract
 * @author Bohdan
 */
contract ERC20BaseToken is ERC20, SoladyBaseToken {
    /// @notice Constructor to initialize ERC20 token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC20 token
    constructor(string memory _name, string memory _symbol) SoladyBaseToken(_name, _symbol) {}

    /// @dev Returns the name of the token.
    function name() public view override(ERC20, SoladyBaseToken) returns (string memory) {
        return SoladyBaseToken.name();
    }

    /// @dev Returns the symbol of the token.
    function symbol() public view override(ERC20, SoladyBaseToken) returns (string memory) {
        return SoladyBaseToken.symbol();
    }

    /**
     * @dev Mints `to` address some `amount` of tokens
     * Requirements:
     * - only `MINTER_ROLE`
     *
     * @param to address to mint
     * @param amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Burns `from` address some `amount` of tokens
     * Requirements:
     * - only `BURNER_ROLE`
     *
     * @param from address to mint
     * @param amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }
}

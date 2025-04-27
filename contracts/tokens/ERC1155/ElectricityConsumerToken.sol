// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC1155 } from "solady/src/tokens/ERC1155.sol";
import { SoladyBaseToken } from "../base/SoladyBaseToken.sol";

/**
 * @title Electricity Consumer Token contract (ERC1155 standard).
 * @author Bohdan
 */
contract ElectricityConsumerToken is ERC1155, SoladyBaseToken {
    /**
     * @notice Constructor to initialize ECU contract.
     * @dev Grants each role to `msg.sender`.
     * Sets `name` and `symbol` of this token.
     */
    constructor() SoladyBaseToken("Electricity Consumer Token", "ELCT") {}

    /// @dev Returns the name of the token.
    function name() public view override returns (string memory) {
        return super.name();
    }

    /// @dev Returns the symbol of the token.
    function symbol() public view override returns (string memory) {
        return super.symbol();
    }

    function uri(uint256 /*id*/) public pure override returns (string memory) {
        return "ElectricityConsumerToken";
    }

    /// @dev Mints `to` address ECU token
    /// @param to The address to mint the token to
    /// @param tokenId The ID of the token to mint
    /// @param amount The amount of users for the token being minted
    function mint(address to, uint256 tokenId, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, tokenId, amount, "");
    }

    /// @dev Burns `from` address ECU token
    /// @param from The address to burn the token from
    /// @param tokenId The ID of the token to burn
    /// @param amount The amount of tokens to burn
    function burn(address from, uint256 tokenId, uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(from, tokenId, amount);
    }
}

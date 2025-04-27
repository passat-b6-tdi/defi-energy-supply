// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC1155 } from "solady/src/tokens/ERC1155.sol";
import { SoladyBaseToken } from "../base/SoladyBaseToken.sol";

/**
 * @title Electricity Consumer Token contract (ERC1155 standard).
 * @author Bohdan
 */
contract ElectricityConsumerToken is ERC1155, SoladyBaseToken {
    /// @dev Keccak256 hashed `REGISTER_ROLE` string
    uint256 public constant REGISTER_ROLE = uint256(keccak256(bytes("REGISTER_ROLE")));

    string internal _uri;

    /**
     * @notice Constructor to initialize ECU contract.
     * @dev Grants each role to `msg.sender`.
     * Sets `name` and `symbol` of this token.
     */
    constructor(string memory uri_) SoladyBaseToken("Electricity Consumer Token", "ELCT") {
        _setRole(msg.sender, REGISTER_ROLE, true);
        _uri = uri_;
    }

    /// @dev Returns the name of the token.
    function name() public view override returns (string memory) {
        return super.name();
    }

    /// @dev Returns the symbol of the token.
    function symbol() public view override returns (string memory) {
        return super.symbol();
    }

    function uri(uint256 /*id*/) public view override returns (string memory) {
        return _uri;
    }

    /// @dev Mints `to` address ECU token
    /// @param to The address to mint the token to
    /// @param tokenId The ID of the token to mint
    /// @param amountOfUsers The amount of users for the token being minted
    function mint(address to, uint256 tokenId, uint256 amountOfUsers) external onlyRole(REGISTER_ROLE) {
        _mint(to, tokenId, amountOfUsers, "");
    }

    /// @dev Burns `from` address ECU token
    /// @param from The address to burn the token from
    /// @param tokenId The ID of the token to burn
    /// @param amount The amount of tokens to burn
    function burn(address from, uint256 tokenId, uint256 amount) public onlyRole(REGISTER_ROLE) {
        _burn(from, tokenId, amount);
    }
}

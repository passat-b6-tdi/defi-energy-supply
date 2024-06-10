// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Electricity Users Token contract (ERC1155 standard).
 * @author Bohdan
 */
contract ELU is ERC1155, AccessControl {
    /// @dev Keccak256 hashed `REGISTER_ROLE` string
    bytes32 public constant REGISTER_ROLE = keccak256(bytes("REGISTER_ROLE"));

    /// @dev Name of this token
    string public name;
    /// @dev Symbol of this token
    string public symbol;

    /**
     * @notice Constructor to initialize ELU contract.
     * @dev Grants each role to `msg.sender`.
     * Sets `name` and `symbol` of this token.
     */
    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTER_ROLE, msg.sender);

        name = "Electricity Users Token";
        symbol = "ELU";
    }

    /// @dev Mints `to` address ELU token
    /// @param to The address to mint the token to
    /// @param tokenId The ID of the token to mint
    /// @param amountOfUsers The amount of users for the token being minted
    function mint(address to, uint256 tokenId, uint256 amountOfUsers) external onlyRole(REGISTER_ROLE) {
        _mint(to, tokenId, amountOfUsers, "");
    }

    /// @dev Burns `from` address ELU token
    /// @param from The address to burn the token from
    /// @param tokenId The ID of the token to burn
    /// @param amount The amount of tokens to burn
    function burn(address from, uint256 tokenId, uint256 amount) public onlyRole(REGISTER_ROLE) {
        _burn(from, tokenId, amount);
    }

    /// @inheritdoc AccessControl
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

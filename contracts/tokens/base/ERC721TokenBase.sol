// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC721 } from "solady/src/tokens/ERC721.sol";
import { SoladyBaseToken } from "./SoladyBaseToken.sol";

/**
 * @title ERC721 Token Base contract (ERC721 standard)
 * @author Bohdan
 */
contract ERC721TokenBase is ERC721, SoladyBaseToken {
    string internal _uri;

    /// @notice Constructor to initialize NFT token contract
    /// @dev Grants owner and MINTER/BURNER roles to `msg.sender`, sets `name`/`symbol`, and stores the metadata URI.
    /// @param _name The token name
    /// @param _symbol The token symbol
    /// @param uri The static metadata URI returned by `tokenURI` for any tokenId
    constructor(string memory _name, string memory _symbol, string memory uri) SoladyBaseToken(_name, _symbol) {
        _uri = uri;
    }

    /// @dev Returns the name of the token.
    function name() public view override(ERC721, SoladyBaseToken) returns (string memory) {
        return SoladyBaseToken.name();
    }

    /// @dev Returns the symbol of the token.
    function symbol() public view override(ERC721, SoladyBaseToken) returns (string memory) {
        return SoladyBaseToken.symbol();
    }

    /// @notice Returns the static metadata URI used for every token id
    /// @return The metadata URI shared by all tokens
    function tokenURI(uint256 /*id*/) public view override returns (string memory) {
        return _uri;
    }

    /// @dev Mints a token to `to`
    /// @param to The address receiving the minted token
    /// @param tokenId The id of the token to mint
    function mint(address to, uint256 tokenId) external onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
    }

    /// @dev Burns the token with the given `tokenId`
    /// @param tokenId The id of the token to burn
    function burn(uint256 tokenId) public onlyRole(BURNER_ROLE) {
        _burn(tokenId);
    }
}

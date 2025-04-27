// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC721 } from "solady/src/tokens/ERC721.sol";
import { SoladyBaseToken } from "./SoladyBaseToken.sol";

/**
 * @title ERC721 Token Base contract (ERC721 standard)
 * @author Bohdan
 */
abstract contract ERC721TokenBase is ERC721, SoladyBaseToken {
    /// @dev Keccak256 hashed `REGISTER_ROLE` string
    uint256 public constant REGISTER_ROLE = uint256(keccak256(bytes("REGISTER_ROLE")));

    string internal _uri;

    /// @notice Constructor to initialize NFT token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC721 token
    constructor(string memory _name, string memory _symbol, string memory uri) SoladyBaseToken(_name, _symbol) {
        _setRole(msg.sender, REGISTER_ROLE, true);
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

    function tokenURI(uint256 /*id*/) public view override returns (string memory) {
        return _uri;
    }

    /// @dev Mints `to` address NRGOP token
    /// @param to address to mint
    function mint(address to, uint256 tokenId) external onlyRole(REGISTER_ROLE) {
        _safeMint(to, tokenId);
    }

    /// @dev Burns `from` address NRGOP token
    /// @param tokenId uint256
    function burn(uint256 tokenId) public onlyRole(REGISTER_ROLE) {
        _burn(tokenId);
    }
}

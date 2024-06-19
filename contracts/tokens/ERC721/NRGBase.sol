// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Energy Token Base contract (ERC721 standard)
 * @author Bohdan
 */
abstract contract NRGBase is ERC721, AccessControl {
    /// @dev Keccak256 hashed `REGISTER_ROLE` string
    bytes32 public constant REGISTER_ROLE = keccak256(bytes("REGISTER_ROLE"));

    /// @notice Constructor to initialize NFT token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC721 token
    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTER_ROLE, msg.sender);
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

    /// @inheritdoc AccessControl
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

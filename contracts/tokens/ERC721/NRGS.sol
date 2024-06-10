// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Energy Supplier Token contract (ERC721 standard)
 * @author Bohdan
 */
contract NRGS is ERC721, AccessControl {
    /// @dev Keccak256 hashed `REGISTER_ROLE` string
    bytes32 public constant REGISTER_ROLE = keccak256(bytes("REGISTER_ROLE"));

    /// @notice Constructor to initialize NFT token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC721 token
    constructor() ERC721("Energy Supplier Token", "NRGS") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTER_ROLE, msg.sender);
    }

    /// @dev Mints `to` address NRGS token
    /// @param to address to mint
    function mint(address to, uint256 tokenId) external onlyRole(REGISTER_ROLE) {
        _safeMint(to, tokenId);
    }

    /// @dev Burns `from` address NRGS token
    /// @param tokenId uint256
    function burn(uint256 tokenId) public onlyRole(REGISTER_ROLE) {
        _burn(tokenId);
    }

    /// @inheritdoc AccessControl
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

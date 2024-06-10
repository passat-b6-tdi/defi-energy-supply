// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Interface for Energy Supplier Token contract (ERC721 standard)
 * @author Bohdan
 */
interface INRGS {
    /// @dev Total amount of tokens
    function totalTokens() external view returns (uint256);

    /// @dev Mints `to` address NRGS token
    /// @param to address to mint
    function mint(address to, uint256 tokenId) external;

    /// @dev Burns `from` address NRGS token
    /// @param tokenId uint256
    function burn(uint256 tokenId) external;

    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner) external view returns (uint256);

    /**
     * @dev See {IERC721-ownerOf}.
     */
    function ownerOf(uint256 tokenId) external view returns (address);
}

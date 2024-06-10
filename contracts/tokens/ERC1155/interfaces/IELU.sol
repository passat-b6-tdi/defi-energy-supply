// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Interface for Electricity Users Token contract (ERC1155 standard).
 * @author Bohdan
 */
interface IELU {
    /// @dev Mints `to` address ELU token
    /// @param to The address to mint the token to
    /// @param tokenId The ID of the token to mint
    /// @param amountOfUsers The amount of users for the token being minted
    function mint(address to, uint256 tokenId, uint256 amountOfUsers) external;

    /// @dev Burns `from` address ELU token
    /// @param from The address to burn the token from
    /// @param tokenId The ID of the token to burn
    /// @param amount The amount of tokens to burn
    function burn(address from, uint256 tokenId, uint256 amount) external;

    /// @dev See {IERC1155-safeTransferFrom}.
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) external;

    /**
     * @dev See {IERC1155-balanceOf}.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

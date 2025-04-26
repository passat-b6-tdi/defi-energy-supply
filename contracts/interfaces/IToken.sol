// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IToken {
    function balanceOf(address owner, uint256 tokenId) external view returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function mint(address to, uint256 tokenId) external;
    function mint(address to, uint256 tokenId, uint256 amountOfUsers) external;
    function burn(uint256 tokenId) external;
    function burn(address from, uint256 tokenId, uint256 amount) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC721TokenBase } from "../base/ERC721TokenBase.sol";

/**
 * @title Energy Oracle Provider Token contract (ERC721 standard)
 * @author Bohdan
 */
contract EnergyOracleProviderToken is ERC721TokenBase {
    /// @notice Constructor to initialize NFT token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC721 token
    constructor() ERC721TokenBase("Energy Oracle Provider Token", "NRGOPT", "") {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721TokenBase } from "../base/ERC721TokenBase.sol";

/**
 * @title Energy Supplier Token contract (ERC721 standard)
 * @author Bohdan
 */
contract EnergySupplierToken is ERC721TokenBase {
    /// @notice Constructor to initialize NFT token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC721 token
    constructor() ERC721TokenBase("Energy Supplier Token", "NRGST", "") {}
}

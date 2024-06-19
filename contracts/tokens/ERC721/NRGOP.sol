// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { NRGBase } from "./NRGBase.sol";

/**
 * @title Energy Oracle Provider Token contract (ERC721 standard)
 * @author Bohdan
 */
contract NRGOP is NRGBase {
    /// @notice Constructor to initialize NFT token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC721 token
    constructor() NRGBase("Energy Oracle Provider Token", "NRGOP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTER_ROLE, msg.sender);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20TokenBase } from "../tokens/base/ERC20TokenBase.sol";

/**
 * @title Energy Credit Token contract
 * Representing 1 kW.
 * @author Bohdan
 */
contract ERC20Mock is ERC20TokenBase {
    /// @notice Constructor to initialize ERC20 token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC20 token
    constructor() ERC20TokenBase("ERC20Mock", "ERC20Mock") {
        _mint(msg.sender, 100000 * 1e18);
    }
}

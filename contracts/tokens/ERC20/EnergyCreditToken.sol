// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20TokenBase } from "../base/ERC20TokenBase.sol";

/**
 * @title Energy Credit Token contract
 * Representing 1 kW.
 * @author Bohdan
 */
contract EnergyCreditToken is ERC20TokenBase {
    /// @notice Constructor to initialize ERC20 token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC20 token
    constructor() ERC20TokenBase("Energy Credit Token", "NRGCT") {}
}

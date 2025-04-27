// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20BaseToken } from "../base/ERC20BaseToken.sol";

/**
 * @title Energy Credit Token contract
 * Representing 1 kW.
 * @author Bohdan
 */
contract EnergyCreditToken is ERC20BaseToken {
    /// @notice Constructor to initialize ERC20 token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC20 token
    constructor() ERC20BaseToken("Energy Credit Token", "ECT") {}
}

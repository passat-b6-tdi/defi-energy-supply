// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20BaseToken } from "../base/ERC20BaseToken.sol";

/**
 * @title Microgrid Governance Token contract
 * Can be used as staking reward token, or rewards for Energy Oracle makers.
 * Equals to 1 kW.
 * @author Bohdan
 */
contract MicrogridGovernanceToken is ERC20BaseToken {
    /// @notice Constructor to initialize ERC20 token contract
    /// @dev Grants each roles to `msg.sender`
    /// @dev Sets `name` and `symbol` of ERC20 token
    constructor() ERC20BaseToken("Microgrid Governance Token", "MGT") {}
}

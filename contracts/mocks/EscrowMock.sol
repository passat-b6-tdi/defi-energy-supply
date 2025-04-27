// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { EnergyOracle } from "../EnergyOracle.sol";

contract EscrowMock {
    EnergyOracle public energyOracle;

    uint256 public consumption;

    constructor(EnergyOracle _energyOracle) {
        energyOracle = _energyOracle;
    }
    function read(address consumer, uint256 tokenId) public {
        consumption = energyOracle.energyConsumptions(consumer, tokenId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../energy-oracle/interfaces/IEnergyOracle.sol";

contract EscrowMock {
    IEnergyOracle public energyOracle;

    uint256 public consumption;

    constructor(IEnergyOracle _energyOracle) {
        energyOracle = _energyOracle;
    }
    function read(address consumer, uint256 tokenId) public {
        consumption = energyOracle.energyConsumptions(consumer, tokenId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../energy-oracle/interfaces/IEnergyOracle.sol";

contract EscrowMock {
    IEnergyOracle public energyOracle;

    uint public consumption;

    constructor(IEnergyOracle _energyOracle) {
        energyOracle = _energyOracle;
    }
    function read(address user, uint tokenId) public {
        consumption = energyOracle.updateEnergyConsumptionsAndGetResult(user, tokenId);
    }
}

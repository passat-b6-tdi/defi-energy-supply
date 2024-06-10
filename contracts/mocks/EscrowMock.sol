// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../energy-oracle/interfaces/IEnergyOracle.sol";

contract EscrowMock {
    IEnergyOracle public oracle;

    uint public consumption;

    constructor(IEnergyOracle _oracle) {
        oracle = _oracle;
    }
    function read(address user, uint tokenId) public {
        consumption = oracle.updateEnergyConsumptionsAndGetResult(user, tokenId);
    }
}

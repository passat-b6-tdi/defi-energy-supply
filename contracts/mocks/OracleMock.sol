// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract OracleMock {
    function energyConsumptions(address consumer, uint256 tokenId) external view returns (uint256 consumption) {
        return 555;
    }

    function updateEnergyConsumptions(address consumer, uint256 supplierId) external returns (uint256 consumption) {}
}

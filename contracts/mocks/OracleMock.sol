// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract OracleMock {
    function energyConsumptions(address user, uint256 tokenId) external view returns (uint256 consumption) {
        return 555;
    }

    function updateEnergyConsumptions(address user, uint256 supplierId) external returns (uint256 consumption) {}
}

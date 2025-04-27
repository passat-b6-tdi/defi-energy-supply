// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IContract {
    function energyConsumptions(address consumer, uint256 supplierId) external view returns (uint256 consumption);
    function enterStaking(address supplier, uint256 tokenId) external;
    function exitStaking(address supplier, uint256 tokenId) external;
    function registerSupplier(address supplier) external;
    function registerElectricityConsumer(address consumer, uint256 supplierId) external;
    function registerOracleProvider(address oracleProvider) external;
    function unregisterSupplier(uint256 supplierId) external;
    function unregisterElectricityConsumer(address consumer, uint256 supplierId) external;
    function unregisterOracleProvider(uint256 oracleProviderId) external;
    function recordEnergyProductions(uint256 producerId, uint256 production) external;
    function recordConsumerConsumptions(address consumer, uint256 supplierId, uint256 consumption) external;
    function sendFundsToSupplier(address from, uint256 supplierId) external;
    function sendRewards(address supplier, uint256 tokenId) external;
    function payForElectricity(uint256 supplierId) external;
    function updateEnergyConsumptions(address consumer, uint256 supplierId) external;
}

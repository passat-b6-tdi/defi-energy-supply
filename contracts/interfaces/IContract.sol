// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IContract {
    function energyConsumptions(address consumer, uint256 supplierId) external view returns (uint256 consumption);
    function enterStaking(address supplier, uint256 tokenId) external;
    function exitStaking(address supplier, uint256 tokenId) external;
    function registerSupplier(address supplier) external;
    function registerElectricityConsumer(address consumer, uint256 supplierId) external;
    function registerOracleProvider(address oracleProvider) external;
    function unRegisterSupplier(uint256 supplierId) external;
    function unRegisterElectricityConsumer(address consumer, uint256 supplierId) external;
    function unRegisterOracleProvider(uint256 oracleProviderId) external;
    function recordEnergyProductions(address supplier, uint256 supplierId, uint256 production) external;
    function recordConsumerConsumptions(address consumer, uint256 supplierId, uint256 consumption) external;
    function sendFundsToSupplier(address from, uint256 supplierId) external;
    function sendRewards(address supplier, uint256 tokenId) external;
    function payForElectricity(uint256 supplierId) external;
    function updateEnergyConsumptions(address consumer, uint256 supplierId) external;
}

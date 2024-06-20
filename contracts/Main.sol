// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Manager } from "./Manager.sol";

error ZeroAddressPassed();
error OnlyEnergySupplier();
error OnlyEnergyOracleProvider();

/**
 * @title Main
 * @dev A main contract for managing Microgrid ecosystem.
 * @author Bohdan
 */
contract Main is AccessControl {
    /// @dev Keccak256 hashed `MAIN_MANAGER_ROLE` string
    bytes32 public constant MAIN_MANAGER_ROLE = keccak256(bytes("MAIN_MANAGER_ROLE"));

    /// @dev Manager contract
    Manager public manager;

    modifier onlySupplier(uint256 supplierId) {
        if (manager.tokens().nrgs.ownerOf(supplierId) != msg.sender) {
            revert OnlyEnergySupplier();
        }

        _;
    }

    modifier onlyOracleProvider() {
        if (manager.tokens().nrgop.balanceOf(msg.sender) == 0) {
            revert OnlyEnergyOracleProvider();
        }

        _;
    }

    /**
     * @notice Constructor to initialize the Main contract.
     * @param _manager The address of the Manager contract.
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MAIN_MANAGER_ROLE`,`SUPPLIER_ROLE` and `USER_ROLE` roles to the contract deployer.
     */
    constructor(Manager _manager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MAIN_MANAGER_ROLE, msg.sender);

        manager = _manager;
    }

    /// @dev Changes `manager` address to the `_newManager` address.
    /// @param _newManager The address of the new manger contract
    function changeManager(Manager _newManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (address(_newManager) == address(0)) {
            revert ZeroAddressPassed();
        }

        manager = _newManager;
    }

    /**
     * @notice Registers an Energy supplier.
     * Requirements:
     * - `msg.sender` must have `MAIN_MANAGER_ROLE`.
     *
     * @param supplier The address of the supplier.
     */
    function registerSupplier(address supplier) external onlyRole(MAIN_MANAGER_ROLE) {
        manager.contracts().register.registerSupplier(supplier);
    }

    /**
     * @notice Registers an Electricity consumer.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a supplier.
     *
     * @param supplierId The ID of the supplier for the consumer.
     */
    function registerElectricityConsumer(address consumer, uint256 supplierId) external onlySupplier(supplierId) {
        manager.contracts().register.registerElectricityConsumer(consumer, supplierId);
    }

    /**
     * @notice Registers an Energy oracle provider.
     * Requirements:
     * - `msg.sender` must have `MAIN_MANAGER_ROLE`.
     *
     * @param oracleProvider The address of the oracle provider.
     */
    function registerOracleProvider(address oracleProvider) external onlyRole(MAIN_MANAGER_ROLE) {
        manager.contracts().register.registerOracleProvider(oracleProvider);
    }

    /**
     * @notice Unregisters an Energy supplier.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must have `MAIN_MANAGER_ROLE`.
     *
     * @param supplierId The ID of the supplier.
     */
    function unRegisterSupplier(uint256 supplierId) external onlyRole(MAIN_MANAGER_ROLE) {
        manager.contracts().register.unRegisterSupplier(supplierId);
    }

    /**
     * @notice Unregisters an Electricity consumer.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a supplier.
     *
     * @param supplierId The ID of the supplier for the consumer.
     */
    function unRegisterElectricityConsumer(address consumer, uint256 supplierId) external onlySupplier(supplierId) {
        manager.contracts().register.unRegisterElectricityConsumer(consumer, supplierId);
    }

    /**
     * @notice Unregisters an Energy oracle provider.
     * Requirements:
     * - `oracleProviderId` must be greater than 0.
     * - `msg.sender` must have `MAIN_MANAGER_ROLE`.
     *
     * @param oracleProviderId The ID of the oracle provider.
     */
    function unRegisterOracleProvider(uint256 oracleProviderId) external onlyRole(MAIN_MANAGER_ROLE) {
        manager.contracts().register.unRegisterOracleProvider(oracleProviderId);
    }

    /**
     * @notice Records the energy production by the supplier at a specific timestamp.
     * @dev
     * Requirements:
     * - `msg.sender` must have ENERGY_ORACLE_PROVIDER_ROLE
     * - `supplier` must have `supplierId`
     *
     * @param supplier The supplier address
     * @param supplierId The supplier ID
     * @param production The energy production value
     */
    function recordEnergyProductions(
        address supplier,
        uint256 supplierId,
        uint256 production
    ) external onlyOracleProvider {
        manager.contracts().oracle.recordEnergyProductions(supplier, supplierId, production);
    }

    /**
     * @notice Records the energy consumption for a consumer and supplier at a specific timestamp.
     * @dev
     * Requirements:
     * - `msg.sender` must be the Energy oracle provider
     * - `consumer` must have supplier with `supplierId`
     *
     * @param consumer The consumer address
     * @param supplierId The supplier ID
     * @param consumption The energy consumption value
     */
    function recordConsumerConsumptions(
        address consumer,
        uint256 supplierId,
        uint256 consumption
    ) external onlyOracleProvider {
        manager.contracts().oracle.recordConsumerConsumptions(consumer, supplierId, consumption);
    }

    /**
     * @notice Pays for electricity.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a consumer.
     *
     * @param supplierId The ID of the supplier for the consumer.
     */
    function payForElectricity(uint256 supplierId) external {
        manager.contracts().escrow.sendFundsToSupplier(msg.sender, supplierId);
    }

    /**
     * @notice Gets the rewards for a supplier.
     * Requirements:
     * - `supplierId` must be greater than 0.
     * - `msg.sender` must be a supplier.
     *
     * @param supplierId The ID of the supplier.
     */
    function getRewards(uint256 supplierId) external onlySupplier(supplierId) {
        manager.contracts().staking.sendRewards(msg.sender, supplierId);
    }
}

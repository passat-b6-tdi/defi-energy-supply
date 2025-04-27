import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  ElectricityConsumerToken,
  EnergyCreditToken,
  EnergyOracle,
  EnergyOracleProviderToken,
  EnergyProducerToken,
  EnergySupplierToken,
  EscrowMock,
  ERC20Mock,
  Main,
  MicrogridGovernanceToken,
} from '../typechain';

describe.only('EnergyOracle', function () {
  let minter_role: BigNumber, burner_role: BigNumber, energy_oracle_manager: BigNumber, escrow_role: BigNumber;
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [deployer, otherAcc] = await ethers.getSigners();

    const EnergyCreditToken: ContractFactory = await ethers.getContractFactory('EnergyCreditToken');
    const nrgct: EnergyCreditToken = (await EnergyCreditToken.deploy()) as EnergyCreditToken;
    await nrgct.deployed();

    const MicrogridGovernanceToken: ContractFactory = await ethers.getContractFactory('MicrogridGovernanceToken');
    const mgt: MicrogridGovernanceToken = (await MicrogridGovernanceToken.deploy()) as MicrogridGovernanceToken;
    await mgt.deployed();

    const EnergyProducerToken: ContractFactory = await ethers.getContractFactory('EnergyProducerToken');
    const nrgpt: EnergyProducerToken = (await EnergyProducerToken.deploy()) as EnergyProducerToken;
    await nrgpt.deployed();

    const EnergySupplierToken: ContractFactory = await ethers.getContractFactory('EnergySupplierToken');
    const nrgst: EnergySupplierToken = (await EnergySupplierToken.deploy()) as EnergySupplierToken;
    await nrgst.deployed();

    const EnergyOracleProviderToken: ContractFactory = await ethers.getContractFactory('EnergyOracleProviderToken');
    const nrgopt: EnergyOracleProviderToken = (await EnergyOracleProviderToken.deploy()) as EnergyOracleProviderToken;
    await nrgopt.deployed();

    const ElectricityConsumerToken: ContractFactory = await ethers.getContractFactory('ElectricityConsumerToken');
    const elct: ElectricityConsumerToken = (await ElectricityConsumerToken.deploy()) as ElectricityConsumerToken;
    await elct.deployed();

    const ERC20Mock: ContractFactory = await ethers.getContractFactory('ERC20Mock');
    const usdc: ERC20Mock = (await ERC20Mock.deploy()) as ERC20Mock;
    await usdc.deployed();
    const usdt: ERC20Mock = (await ERC20Mock.deploy()) as ERC20Mock;
    await usdt.deployed();
    const dai: ERC20Mock = (await ERC20Mock.deploy()) as ERC20Mock;
    await dai.deployed();

    const Tokens: Main.TokensStruct = {
      energyCreditToken: nrgct.address,
      microgridGovernanceToken: mgt.address,
      electricityConsumerToken: elct.address,
      energyProducerToken: nrgpt.address,
      energySupplierToken: nrgst.address,
      energyOracleProviderToken: nrgopt.address,
    };

    const Fees: Main.FeesStruct = {
      receiver: deployer.address,
      amount: 10,
    };

    const Main: ContractFactory = await ethers.getContractFactory('Main');
    const main: Main = (await Main.deploy(Tokens, Fees, usdc.address, dai.address, usdt.address)) as Main;
    await main.deployed();

    const EnergyOracle: ContractFactory = await ethers.getContractFactory('EnergyOracle');
    const energyOracle: EnergyOracle = (await EnergyOracle.deploy(main.address)) as EnergyOracle;
    await energyOracle.deployed();

    const EscrowMock: ContractFactory = await ethers.getContractFactory('EscrowMock');
    const escrow: EscrowMock = (await EscrowMock.deploy(energyOracle.address)) as EscrowMock;
    await escrow.deployed();

    minter_role = await mgt.MINTER_ROLE();
    burner_role = await mgt.BURNER_ROLE();

    energy_oracle_manager = await energyOracle.ENERGY_ORACLE_MANAGER_ROLE();
    escrow_role = await energyOracle.ESCROW();

    // Required for deployment
    await energyOracle.setRole(escrow.address, escrow_role, true);
    await mgt.setRole(energyOracle.address, minter_role, true);
    await nrgct.setRole(energyOracle.address, minter_role, true);
    await nrgct.setRole(energyOracle.address, burner_role, true);

    return {
      nrgct,
      mgt,
      nrgpt,
      nrgst,
      nrgopt,
      elct,
      main,
      energyOracle,
      EnergyOracle,
      escrow,
      deployer,
      otherAcc,
    };
  }

  it('Deployed correctly', async () => {
    const { nrgct, mgt, nrgpt, nrgst, nrgopt, elct, main, energyOracle, deployer } = await loadFixture(deployFixture);

    expect(nrgct.address).to.be.properAddress;
    expect(mgt.address).to.be.properAddress;
    expect(nrgpt.address).to.be.properAddress;
    expect(nrgst.address).to.be.properAddress;
    expect(nrgopt.address).to.be.properAddress;
    expect(elct.address).to.be.properAddress;
    expect(main.address).to.be.properAddress;
    expect(energyOracle.address).to.be.properAddress;
  });

  describe('Registers', function () {
    it('recordSupplierPrice', async () => {
      const { energyOracle, nrgst, nrgopt, mgt, deployer, otherAcc } = await loadFixture(deployFixture);

      const tokenId = 10;
      const user = deployer.address;
      const energyPrice = 22;

      await nrgst.mint(user, tokenId);
      await nrgopt.mint(user, tokenId);

      await energyOracle.pause();
      await expect(energyOracle.recordSupplierPrice(tokenId, energyPrice)).to.be.revertedWith('Pausable: paused');
      await energyOracle.unpause();

      await expect(
        energyOracle.connect(otherAcc).recordSupplierPrice(tokenId, energyPrice),
      ).to.be.revertedWithCustomError(energyOracle, 'OnlyEnergyOracleProvider');
      await expect(energyOracle.recordSupplierPrice(tokenId + 1, energyPrice)).to.be.reverted;

      const record = await energyOracle.recordSupplierPrice(tokenId, energyPrice);

      const supplierEnergyPrice = await energyOracle.supplierEnergyPrice(tokenId);

      expect(record).to.emit(energyOracle, 'EnergyPriceRecorded');
      expect(await mgt.balanceOf(user)).to.eq(50000000000000000n);
      expect(supplierEnergyPrice).to.equal(energyPrice);
    });

    it('recordEnergyProductions', async () => {
      const { energyOracle, nrgpt, nrgopt, nrgct, mgt, deployer, otherAcc } = await loadFixture(deployFixture);

      const tokenId = 10;
      const user = deployer.address;
      const production = 22;

      await nrgpt.mint(user, tokenId);
      await nrgopt.mint(user, tokenId);

      await energyOracle.pause();
      await expect(energyOracle.recordEnergyProductions(tokenId, production)).to.be.revertedWith('Pausable: paused');
      await energyOracle.unpause();

      await expect(
        energyOracle.connect(otherAcc).recordEnergyProductions(tokenId, production),
      ).to.be.revertedWithCustomError(energyOracle, 'OnlyEnergyOracleProvider');

      await expect(energyOracle.recordEnergyProductions(tokenId + 1, production)).to.be.revertedWithCustomError(
        nrgpt,
        'TokenDoesNotExist',
      );

      const record = await energyOracle.recordEnergyProductions(tokenId, production);

      const energyProductions = await energyOracle.energyProductions(tokenId);

      expect(record).to.emit(energyOracle, 'EnergyProductionRecorded');
      expect(await nrgct.balanceOf(user)).to.eq(production);
      expect(await mgt.balanceOf(user)).to.eq(50000000000000000n);
      expect(energyProductions).to.equal(production);
    });

    it('recordConsumerConsumptions', async () => {
      const { energyOracle, nrgopt, nrgct, nrgst, elct, mgt, deployer, otherAcc } = await loadFixture(deployFixture);

      const tokenId = 10;
      const user = deployer.address;
      const consumption = 20;
      const energyPrice = 1;

      await nrgopt.mint(user, tokenId);
      await nrgct.mint(user, consumption);
      await nrgst.mint(user, tokenId);
      await elct.mint(user, tokenId, 1);

      await energyOracle.recordSupplierPrice(tokenId, energyPrice);

      await energyOracle.pause();
      await expect(energyOracle.recordConsumerConsumptions(user, tokenId, consumption)).to.be.revertedWith(
        'Pausable: paused',
      );
      await energyOracle.unpause();

      await expect(
        energyOracle.connect(otherAcc).recordConsumerConsumptions(user, tokenId, consumption),
      ).to.be.revertedWithCustomError(energyOracle, 'OnlyEnergyOracleProvider');
      await expect(
        energyOracle.recordConsumerConsumptions(user, tokenId + 1, consumption),
      ).to.be.revertedWithCustomError(nrgst, 'TokenDoesNotExist');
      await expect(energyOracle.recordConsumerConsumptions(otherAcc.address, tokenId, consumption))
        .to.be.revertedWithCustomError(energyOracle, 'IncorrectConsumer')
        .withArgs(otherAcc.address, tokenId);

      const record = await energyOracle.recordConsumerConsumptions(user, tokenId, consumption);
      const debtsUSD = await energyOracle.debtsUSD(user, tokenId);

      expect(record).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(await nrgct.balanceOf(user)).to.eq(0);
      expect(await mgt.balanceOf(user)).to.eq(50000000000000000n);
      expect(debtsUSD).to.equal(consumption);
    });

    it('updateEnergyConsumptions', async () => {
      const { energyOracle, nrgopt, nrgct, nrgst, elct, mgt, deployer, otherAcc } = await loadFixture(deployFixture);

      const tokenId = 10;
      const user = deployer.address;
      const consumptionToAdd = 21;
      const consumptionToRemove = 5;
      const energyPrice = 1;

      await nrgopt.mint(user, tokenId);
      await nrgct.mint(user, consumptionToAdd);
      await nrgst.mint(user, tokenId);
      await elct.mint(user, tokenId, 1);

      await energyOracle.recordSupplierPrice(tokenId, energyPrice);

      await expect(
        energyOracle.connect(otherAcc).updateEnergyConsumptions(user, tokenId, consumptionToAdd, consumptionToRemove),
      ).to.be.revertedWithCustomError(energyOracle, 'EnumerableRolesUnauthorized');
      await energyOracle.pause();
      await expect(
        energyOracle.updateEnergyConsumptions(user, tokenId, consumptionToAdd, consumptionToRemove),
      ).to.be.revertedWith('Pausable: paused');
      await energyOracle.unpause();
      await expect(
        energyOracle.updateEnergyConsumptions(
          ethers.constants.AddressZero,
          tokenId,
          consumptionToAdd,
          consumptionToRemove,
        ),
      ).to.be.revertedWithCustomError(energyOracle, 'ZeroAddressPassed');
      await expect(
        energyOracle.updateEnergyConsumptions(user, tokenId + 1, consumptionToAdd, consumptionToRemove),
      ).to.be.revertedWithCustomError(nrgst, 'TokenDoesNotExist');
      await expect(
        energyOracle.updateEnergyConsumptions(otherAcc.address, tokenId, consumptionToAdd, consumptionToRemove),
      )
        .to.be.revertedWithCustomError(energyOracle, 'IncorrectConsumer')
        .withArgs(otherAcc.address, tokenId);

      const record = await energyOracle.updateEnergyConsumptions(user, tokenId, consumptionToAdd, consumptionToRemove);
      const debtsUSD = await energyOracle.debtsUSD(user, tokenId);

      expect(record).to.emit(energyOracle, 'EnergyConsumptionUpdated');
      expect(debtsUSD).to.equal(0 + consumptionToAdd - consumptionToRemove);
    });
  });
});

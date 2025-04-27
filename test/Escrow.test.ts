import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  Escrow,
  ElectricityConsumerToken,
  EnergyCreditToken,
  EnergyOracle,
  EnergyOracleProviderToken,
  EnergyProducerToken,
  EnergySupplierToken,
  ERC20Mock,
  Main,
  MicrogridGovernanceToken,
} from '../typechain';

describe('Escrow', function () {
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

    const Escrow: ContractFactory = await ethers.getContractFactory('Escrow');
    const escrow: Escrow = (await Escrow.deploy(main.address)) as Escrow;
    await escrow.deployed();

    minter_role = await mgt.MINTER_ROLE();
    burner_role = await mgt.BURNER_ROLE();

    energy_oracle_manager = await energyOracle.ENERGY_ORACLE_MANAGER_ROLE();
    escrow_role = await energyOracle.ESCROW();

    const Contracts: Main.ContractsStruct = {
      staking: energyOracle.address,
      oracle: energyOracle.address,
      escrow: escrow.address,
      register: energyOracle.address,
    };

    // Required for deployment
    await main.changeContracts(Contracts);
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
      escrow,
      usdc,
      deployer,
      otherAcc,
    };
  }

  it('Deployed correctly', async () => {
    const { nrgct, mgt, nrgpt, nrgst, nrgopt, elct, main, energyOracle, escrow } = await loadFixture(deployFixture);

    expect(nrgct.address).to.be.properAddress;
    expect(mgt.address).to.be.properAddress;
    expect(nrgpt.address).to.be.properAddress;
    expect(nrgst.address).to.be.properAddress;
    expect(nrgopt.address).to.be.properAddress;
    expect(elct.address).to.be.properAddress;
    expect(main.address).to.be.properAddress;
    expect(energyOracle.address).to.be.properAddress;
    expect(escrow.address).to.be.properAddress;
  });

  it('payForElectricity', async () => {
    const { escrow, energyOracle, nrgopt, nrgct, nrgst, usdc, elct, deployer, otherAcc, main } = await loadFixture(
      deployFixture,
    );

    const consumer = deployer.address;
    const supplier = otherAcc.address;
    const tokenId = 10;
    const energyPrice = 1;
    const consumption = 25;

    await nrgst.mint(supplier, tokenId);
    await elct.mint(consumer, tokenId, 1);

    await energyOracle.updateEnergyConsumptions(consumer, tokenId, ethers.utils.parseEther(consumption.toString()), 0);

    await expect(escrow.connect(otherAcc).payForElectricity(tokenId, usdc.address))
      .to.be.revertedWithCustomError(escrow, 'IncorrectConsumer')
      .withArgs(otherAcc.address, tokenId);

    const balanceBefore = await usdc.balanceOf(consumer);
    const debtsUSD = await energyOracle.debtsUSD(consumer, tokenId);
    const fees = (await main.fees()).amount;
    const toPay = debtsUSD.add(fees);
    await usdc.approve(escrow.address, toPay);

    const payment = await escrow.payForElectricity(tokenId, usdc.address);
    const balanceNow = await usdc.balanceOf(consumer);
    expect(payment).to.emit(escrow, 'PaidForEnergy');
    expect(payment).to.emit(energyOracle, 'EnergyConsumptionUpdated');
    expect(balanceBefore).to.eq(balanceNow.add(debtsUSD));
    expect(await usdc.balanceOf(supplier)).to.eq(debtsUSD);
  });
});

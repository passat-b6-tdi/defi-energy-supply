import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
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

describe('Register', function () {
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
    const { mgt, ecu, nrgs, stakingReward, register, manager, deployer } = await loadFixture(deployFixture);

    expect(mgt.address).to.be.properAddress;
    expect(nrgs.address).to.be.properAddress;
    expect(ecu.address).to.be.properAddress;
    expect(stakingReward.address).to.be.properAddress;
    expect(register.address).to.be.properAddress;

    expect(await mgt.name()).to.be.eq('Mictrogrid Token');
    expect(await mgt.symbol()).to.be.eq('MGT');
    expect(await nrgs.name()).to.be.eq('Energy Supplier Token');
    expect(await nrgs.symbol()).to.be.eq('NRGS');

    expect(await mgt.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await mgt.hasRole(minter_role, deployer.address)).to.be.true;
    expect(await mgt.hasRole(minter_role, stakingReward.address)).to.be.true;

    expect(await nrgs.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await nrgs.hasRole(register_role, deployer.address)).to.be.true;
    expect(await nrgs.hasRole(register_role, register.address)).to.be.true;
    expect(await ecu.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await ecu.hasRole(register_role, deployer.address)).to.be.true;
    expect(await ecu.hasRole(register_role, register.address)).to.be.true;

    expect(await stakingReward.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await stakingReward.hasRole(staking_role, deployer.address)).to.be.true;
    expect(await stakingReward.hasRole(staking_role, register.address)).to.be.true;
    expect(await register.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await register.hasRole(register_manager_role, deployer.address)).to.be.true;

    expect(await stakingReward.manager()).to.be.eq(manager.address);
    expect(await register.manager()).to.be.eq(manager.address);
  });

  describe('Registers', function () {
    it('Manager can register supllier', async () => {
      const { register, stakingReward, nrgs, ecu, deployer } = await loadFixture(deployFixture);
      const registration = await register.registerSupplier(deployer.address);

      const ownerOf5 = await nrgs.ownerOf(1);
      const now = await time.latest();

      const sup = await stakingReward.suppliers(deployer.address, 1);

      expect(registration).to.emit(register, 'SupplierRegistered');
      expect(registration).to.emit(nrgs, 'Transfer');
      expect(registration).to.emit(stakingReward, 'EnterStaking');
      expect(ownerOf5).to.be.eq(deployer.address);
      expect(sup.updatedAt).to.be.eq(now);
      expect(sup.pendingReward).to.be.eq(0);
    });

    it('Manager can unregister supllier', async () => {
      const { register, stakingReward, nrgs, ecu, deployer } = await loadFixture(deployFixture);
      const registration = await register.registerSupplier(deployer.address);

      const ownerOf5 = await nrgs.ownerOf(1);
      let now = await time.latest();

      let sup = await stakingReward.suppliers(deployer.address, 1);

      expect(registration).to.emit(register, 'SupplierRegistered');
      expect(registration).to.emit(nrgs, 'Transfer');
      expect(registration).to.emit(stakingReward, 'EnterStaking');
      expect(ownerOf5).to.be.eq(deployer.address);
      expect(sup.updatedAt).to.be.eq(now);
      expect(sup.pendingReward).to.be.eq(0);

      const unRegistration = await register.unRegisterSupplier(1);

      now = await time.latest();

      sup = await stakingReward.suppliers(deployer.address, 1);

      expect(unRegistration).to.emit(register, 'SupplierUnregistered');
      expect(unRegistration).to.emit(nrgs, 'Transfer');
      expect(unRegistration).to.emit(stakingReward, 'ExitStaking');
      expect(sup.updatedAt).to.be.eq(0);
      expect(sup.pendingReward).to.be.eq(0);
    });

    it('Manager can register oracle provider', async () => {
      const { register, nrgop, deployer } = await loadFixture(deployFixture);
      const registration = await register.registerOracleProvider(deployer.address);

      const ownerOf = await nrgop.ownerOf(1);

      expect(registration).to.emit(register, 'OracleProviderRegistered');
      expect(registration).to.emit(nrgop, 'Transfer');
      expect(ownerOf).to.be.eq(deployer.address);
    });

    it('Manager can unregister oracle provider', async () => {
      const { register, nrgop, deployer } = await loadFixture(deployFixture);
      const registration = await register.registerOracleProvider(deployer.address);

      const ownerOf = await nrgop.ownerOf(1);

      expect(registration).to.emit(register, 'OracleProviderRegistered');
      expect(registration).to.emit(nrgop, 'Transfer');
      expect(ownerOf).to.be.eq(deployer.address);

      const unRegistration = await register.unRegisterOracleProvider(1);

      expect(unRegistration).to.emit(register, 'OracleProviderUnregistered');
      expect(unRegistration).to.emit(nrgop, 'Transfer');
    });

    it('Manager can register users', async () => {
      const { register, ecu, deployer, otherAcc } = await loadFixture(deployFixture);
      const registrationSupplier = await register.registerSupplier(deployer.address);

      const registrationUser = await register.registerElectricityConsumer(otherAcc.address, 1);

      expect(registrationUser).to.emit(register, 'ConsumerRegistered');
      expect(registrationUser).to.emit(ecu, 'Transfer');
      expect(await ecu.balanceOf(otherAcc.address, 1)).to.be.eq(1);
    });

    it('Manager can unregister users', async () => {
      const { register, ecu, deployer, otherAcc } = await loadFixture(deployFixture);
      const registrationSupplier = await register.registerSupplier(deployer.address);

      const registrationUser = await register.registerElectricityConsumer(otherAcc.address, 1);

      expect(registrationUser).to.emit(register, 'ConsumerRegistered');
      expect(registrationUser).to.emit(ecu, 'Transfer');
      expect(await ecu.balanceOf(otherAcc.address, 1)).to.be.eq(1);

      const unRegistration = await register.unRegisterElectricityConsumer(otherAcc.address, 1);

      expect(unRegistration).to.emit(register, 'SupplierUnregistered');
      expect(unRegistration).to.emit(ecu, 'Transfer');
      expect(await ecu.balanceOf(otherAcc.address, 1)).to.be.eq(0);
    });
  });

  describe('Errors', function () {
    it('Only REGISTER_MANAGER_ROLE', async () => {
      const { register, otherAcc, deployer } = await loadFixture(deployFixture);

      const errorMsg = `AccessControl: account ${otherAccAddress} is missing role ${register_manager_role}`;

      await expect(register.connect(otherAcc).registerSupplier(deployer.address)).to.be.revertedWith(errorMsg);
      await expect(register.connect(otherAcc).registerOracleProvider(deployer.address)).to.be.revertedWith(errorMsg);
      await expect(register.connect(otherAcc).registerElectricityConsumer(otherAcc.address, 10)).to.be.revertedWith(
        errorMsg,
      );
      await expect(register.connect(otherAcc).unRegisterSupplier(10)).to.be.revertedWith(errorMsg);
      await expect(register.connect(otherAcc).unRegisterOracleProvider(10)).to.be.revertedWith(errorMsg);
      await expect(register.connect(otherAcc).unRegisterElectricityConsumer(otherAcc.address, 10)).to.be.revertedWith(
        errorMsg,
      );
    });

    it('Zero Address Check', async () => {
      const { register } = await loadFixture(deployFixture);
      const addressZero = ethers.constants.AddressZero;
      const errorMsg = 'ZeroAddressPassed';

      await expect(register.registerSupplier(addressZero)).to.be.revertedWithCustomError(register, errorMsg);
      await expect(register.registerOracleProvider(addressZero)).to.be.revertedWithCustomError(register, errorMsg);
      await expect(register.registerElectricityConsumer(addressZero, 10)).to.be.revertedWithCustomError(
        register,
        errorMsg,
      );
      await expect(register.unRegisterSupplier(10)).to.be.revertedWith('ERC721: invalid token ID');
      await expect(register.unRegisterOracleProvider(10)).to.be.revertedWith('ERC721: invalid token ID');
      await expect(register.unRegisterElectricityConsumer(addressZero, 10)).to.be.revertedWithCustomError(
        register,
        errorMsg,
      );
    });

    it('Requires valid token id', async () => {
      const { register, deployer } = await loadFixture(deployFixture);
      const errorMsg = 'ERC721: invalid token ID';
      const errorMsgForUser = 'IncorrectConsumer';

      await expect(register.unRegisterSupplier(10)).to.be.revertedWith(errorMsg);
      await expect(register.unRegisterOracleProvider(10)).to.be.revertedWith(errorMsg);
      await expect(register.unRegisterElectricityConsumer(deployer.address, 10)).to.be.revertedWithCustomError(
        register,
        errorMsgForUser,
      );
    });
  });
});

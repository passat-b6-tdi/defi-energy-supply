import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  ElectricityConsumerToken,
  EnergyCreditToken,
  EnergyOracleProviderToken,
  EnergyProducerToken,
  EnergySupplierToken,
  ERC20Mock,
  Main,
  MicrogridGovernanceToken,
  Register,
  StakingReward,
} from '../typechain';

describe('Register', function () {
  let minter_role: BigNumber, burner_role: BigNumber;
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

    const Register: ContractFactory = await ethers.getContractFactory('Register');
    const register: Register = (await Register.deploy(main.address)) as Register;
    await register.deployed();

    const StakingReward: ContractFactory = await ethers.getContractFactory('StakingReward');
    const staking: StakingReward = (await StakingReward.deploy(main.address)) as StakingReward;
    await staking.deployed();

    minter_role = await mgt.MINTER_ROLE();
    burner_role = await mgt.BURNER_ROLE();

    const Contracts: Main.ContractsStruct = {
      staking: staking.address,
      oracle: register.address,
      escrow: register.address,
      register: register.address,
    };

    // Required for deployment
    await main.changeContracts(Contracts);
    await nrgpt.setRole(register.address, minter_role, true);
    await nrgst.setRole(register.address, minter_role, true);
    await elct.setRole(register.address, minter_role, true);
    await nrgopt.setRole(register.address, minter_role, true);
    await mgt.setRole(staking.address, minter_role, true);
    await nrgpt.setRole(register.address, burner_role, true);
    await nrgst.setRole(register.address, burner_role, true);
    await elct.setRole(register.address, burner_role, true);
    await nrgopt.setRole(register.address, burner_role, true);

    return {
      nrgct,
      mgt,
      nrgpt,
      nrgst,
      nrgopt,
      elct,
      main,
      register,
      staking,
      usdc,
      deployer,
      otherAcc,
    };
  }

  it('Deployed correctly', async () => {
    const { nrgct, mgt, nrgpt, nrgst, nrgopt, elct, main } = await loadFixture(deployFixture);

    expect(nrgct.address).to.be.properAddress;
    expect(mgt.address).to.be.properAddress;
    expect(nrgpt.address).to.be.properAddress;
    expect(nrgst.address).to.be.properAddress;
    expect(nrgopt.address).to.be.properAddress;
    expect(elct.address).to.be.properAddress;
    expect(main.address).to.be.properAddress;
  });

  describe('Registers', function () {
    it('registerProducer', async () => {
      const { register, staking, nrgpt, deployer, otherAcc } = await loadFixture(deployFixture);

      const producerId = await register.currentProducerId();

      await expect(register.connect(otherAcc).registerProducer(deployer.address)).to.be.revertedWithCustomError(
        register,
        'EnumerableRolesUnauthorized',
      );
      await expect(register.registerProducer(ethers.constants.AddressZero)).to.be.revertedWithCustomError(
        register,
        'ZeroAddressPassed',
      );

      const registration = await register.registerProducer(deployer.address);

      await expect(register.registerProducer(deployer.address))
        .to.be.revertedWithCustomError(register, 'ProducerAlreadyRegistered')
        .withArgs(deployer.address);

      expect(registration).to.emit(register, 'ProducerRegistered');
      expect(registration).to.emit(staking, 'EnterStakingProducer');
      expect(await nrgpt.ownerOf(producerId)).to.eq(deployer.address);
      expect(await register.currentProducerId()).to.eq(producerId.add(1));
      expect(await staking.totalProducers()).to.eq(1);
      expect((await staking.producers(producerId)).updatedAt).to.be.gt(0);
    });

    it('registerSupplier', async () => {
      const { register, nrgst, deployer, otherAcc } = await loadFixture(deployFixture);

      const supplierId = await register.currentSupplierId();

      await expect(register.connect(otherAcc).registerSupplier(deployer.address)).to.be.revertedWithCustomError(
        register,
        'EnumerableRolesUnauthorized',
      );
      await expect(register.registerSupplier(ethers.constants.AddressZero)).to.be.revertedWithCustomError(
        register,
        'ZeroAddressPassed',
      );

      const registration = await register.registerSupplier(deployer.address);

      await expect(register.registerSupplier(deployer.address))
        .to.be.revertedWithCustomError(register, 'SupplierAlreadyRegistered')
        .withArgs(deployer.address);

      expect(registration).to.emit(register, 'SupplierRegistered');
      expect(await nrgst.ownerOf(supplierId)).to.eq(deployer.address);
      expect(await register.currentSupplierId()).to.eq(supplierId.add(1));
    });

    it('registerOracleProvider', async () => {
      const { register, nrgopt, deployer, otherAcc } = await loadFixture(deployFixture);

      const opId = await register.currentOracleProviderId();

      await expect(register.connect(otherAcc).registerSupplier(deployer.address)).to.be.revertedWithCustomError(
        register,
        'EnumerableRolesUnauthorized',
      );
      await expect(register.registerSupplier(ethers.constants.AddressZero)).to.be.revertedWithCustomError(
        register,
        'ZeroAddressPassed',
      );

      const registration = await register.registerOracleProvider(deployer.address);

      await expect(register.registerOracleProvider(deployer.address))
        .to.be.revertedWithCustomError(register, 'OracleProviderAlreadyRegistered')
        .withArgs(deployer.address);

      expect(registration).to.emit(register, 'OracleProviderRegistered');
      expect(await nrgopt.ownerOf(opId)).to.eq(deployer.address);
      expect(await register.currentOracleProviderId()).to.eq(opId.add(1));
    });

    it('registerElectricityConsumer', async () => {
      const { register, elct, deployer, otherAcc } = await loadFixture(deployFixture);

      const supplierId = await register.currentSupplierId();
      await register.registerSupplier(deployer.address);

      await expect(
        register.connect(otherAcc).registerElectricityConsumer(otherAcc.address, supplierId),
      ).to.be.revertedWithCustomError(register, 'OnlyEnergySupplier');
      await expect(
        register.registerElectricityConsumer(ethers.constants.AddressZero, supplierId),
      ).to.be.revertedWithCustomError(register, 'ZeroAddressPassed');

      const registration = await register.registerElectricityConsumer(otherAcc.address, supplierId);

      await expect(register.registerElectricityConsumer(otherAcc.address, supplierId))
        .to.be.revertedWithCustomError(register, 'IncorrectConsumer')
        .withArgs(otherAcc.address, supplierId);

      expect(registration).to.emit(register, 'ConsumerRegistered');
      expect(await elct.balanceOf(otherAcc.address, supplierId)).to.eq(1);
    });
  });

  describe('Unregisters', function () {
    it('unregisterProducer', async () => {
      const { register, staking, nrgpt, mgt, deployer, otherAcc } = await loadFixture(deployFixture);

      const producerId = await register.currentProducerId();

      await register.registerProducer(deployer.address);

      await expect(register.connect(otherAcc).unregisterProducer(producerId)).to.be.revertedWithCustomError(
        register,
        'EnumerableRolesUnauthorized',
      );

      expect(await mgt.balanceOf(deployer.address)).to.be.eq(0);

      await time.increase(10000);
      const unregistration = await register.unregisterProducer(producerId);

      await expect(register.unregisterProducer(producerId)).to.be.revertedWithCustomError(nrgpt, 'TokenDoesNotExist');

      expect(unregistration).to.emit(register, 'ProducerUnregistered');
      expect(unregistration).to.emit(staking, 'ExitStakingProducer');

      await expect(nrgpt.ownerOf(producerId)).to.be.reverted;
      expect(await mgt.balanceOf(deployer.address)).to.be.gt(0);

      expect(await staking.totalProducers()).to.eq(0);
      expect((await staking.producers(producerId)).updatedAt).to.be.eq(0);
    });

    it('unregisterSupplier', async () => {
      const { register, nrgopt, deployer, otherAcc } = await loadFixture(deployFixture);

      const supplierId = await register.currentSupplierId();

      await register.registerSupplier(deployer.address);

      await expect(register.connect(otherAcc).unregisterSupplier(supplierId)).to.be.revertedWithCustomError(
        register,
        'EnumerableRolesUnauthorized',
      );

      const unregistration = await register.unregisterSupplier(supplierId);

      await expect(register.unregisterSupplier(supplierId)).to.be.revertedWithCustomError(nrgopt, 'TokenDoesNotExist');

      expect(unregistration).to.emit(register, 'SupplierUnregistered');
    });

    it('unregisterOracleProvider', async () => {
      const { register, nrgopt, deployer, otherAcc } = await loadFixture(deployFixture);

      const opId = await register.currentOracleProviderId();

      await register.registerOracleProvider(deployer.address);

      await expect(register.connect(otherAcc).unregisterOracleProvider(opId)).to.be.revertedWithCustomError(
        register,
        'EnumerableRolesUnauthorized',
      );

      const unregistration = await register.unregisterOracleProvider(opId);

      await expect(register.unregisterOracleProvider(opId)).to.be.revertedWithCustomError(nrgopt, 'TokenDoesNotExist');

      expect(unregistration).to.emit(register, 'OracleProviderUnregistered');
    });

    it('unregisterElectricityConsumer', async () => {
      const { register, elct, deployer, otherAcc } = await loadFixture(deployFixture);

      const supplierId = await register.currentSupplierId();
      await register.registerSupplier(deployer.address);

      await register.registerElectricityConsumer(otherAcc.address, supplierId);

      await expect(
        register.connect(otherAcc).unregisterElectricityConsumer(otherAcc.address, supplierId),
      ).to.be.revertedWithCustomError(register, 'OnlyEnergySupplier');
      await expect(
        register.unregisterElectricityConsumer(ethers.constants.AddressZero, supplierId),
      ).to.be.revertedWithCustomError(register, 'ZeroAddressPassed');
      await expect(register.unregisterElectricityConsumer(deployer.address, supplierId))
        .to.be.revertedWithCustomError(register, 'IncorrectConsumer')
        .withArgs(deployer.address, supplierId);

      const unregistration = await register.unregisterElectricityConsumer(otherAcc.address, supplierId);
      expect(unregistration).to.emit(register, 'ConsumerUnregistered');
      expect(await elct.balanceOf(otherAcc.address, supplierId)).to.be.eq(0);
    });
  });
});

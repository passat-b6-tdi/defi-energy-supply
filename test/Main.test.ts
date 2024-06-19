import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Escrow, MGT, Manager, EnergyOracle, StakingReward, Register, Main, NRGOP } from '../typechain';
import { ECU } from '../typechain/contracts/tokens/ERC1155/ECU';
import { NRGS } from '../typechain/contracts/tokens/ERC721/NRGS';
import { escrow, manager } from '../typechain/contracts';

describe('Main', function () {
  let otherAccAddress: string;
  let admin_role: string,
    minter_role: string,
    escrow_manager: string,
    register_role: string,
    energy_oracle_manager_role: string,
    energy_oracle_provider_role: string,
    _escrow_: string,
    register_manger_role: string,
    staking_manager_role: string,
    main_manager_role: string;
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [deployer, otherAcc, anotherAcc] = await ethers.getSigners();

    otherAccAddress = otherAcc.address.toLowerCase();

    const MGT_Factory: ContractFactory = await ethers.getContractFactory('MGT');
    const mgt: MGT = (await MGT_Factory.deploy()) as MGT;
    await mgt.deployed();

    const NRGS_Factory: ContractFactory = await ethers.getContractFactory('NRGS');
    const nrgs: NRGS = (await NRGS_Factory.deploy()) as NRGS;
    await nrgs.deployed();

    const ECU_Factory: ContractFactory = await ethers.getContractFactory('ECU');
    const ecu: ECU = (await ECU_Factory.deploy()) as ECU;
    await ecu.deployed();

    const NRGOP_Factory: ContractFactory = await ethers.getContractFactory('NRGOP');
    const nrgop: NRGOP = (await NRGOP_Factory.deploy()) as NRGOP;
    await nrgop.deployed();

    const Tokens: Manager.TokensStruct = {
      mgt: mgt.address,
      ecu: ecu.address,
      nrgs: nrgs.address,
      nrgop: nrgop.address,
    }

    const Values: Manager.ValuesStruct = {
      rewardAmount: 10,
      fees: 10,
    }

    const Manager: ContractFactory = await ethers.getContractFactory('Manager');
    const manager: Manager = (await Manager.deploy(
      Tokens,
      deployer.address,
      Values,
    )) as Manager;
    await manager.deployed();

    const EnergyOracle: ContractFactory = await ethers.getContractFactory('EnergyOracle');
    const energyOracle: EnergyOracle = (await EnergyOracle.deploy(manager.address)) as EnergyOracle;
    await energyOracle.deployed();

    const StakingReward: ContractFactory = await ethers.getContractFactory('StakingReward');
    const stakingReward: StakingReward = (await StakingReward.deploy(manager.address)) as StakingReward;
    await stakingReward.deployed();

    const Escrow: ContractFactory = await ethers.getContractFactory('Escrow');
    const escrow: Escrow = (await Escrow.deploy(manager.address)) as Escrow;
    await escrow.deployed();

    const Register: ContractFactory = await ethers.getContractFactory('Register');
    const register: Register = (await Register.deploy(manager.address)) as Register;
    await register.deployed();

    const Main: ContractFactory = await ethers.getContractFactory('Main');
    const main: Main = (await Main.deploy(manager.address)) as Main;
    await main.deployed();

    const Contracts: Manager.ContractsStruct = {
      oracle: energyOracle.address,
      staking: stakingReward.address,
      register: register.address,
      escrow: escrow.address,
    }

    await manager.changeContracts(Contracts);

    admin_role = await mgt.DEFAULT_ADMIN_ROLE();
    minter_role = await mgt.MINTER_BURNER_ROLE();

    register_role = await nrgs.REGISTER_ROLE();

    escrow_manager = await escrow.ESCROW_MANAGER_ROLE();

    energy_oracle_manager_role = await energyOracle.ENERGY_ORACLE_MANAGER_ROLE();
    energy_oracle_provider_role = await energyOracle.ENERGY_ORACLE_PROVIDER_ROLE();
    _escrow_ = await energyOracle.ESCROW();

    register_manger_role = await register.REGISTER_MANAGER_ROLE();

    staking_manager_role = await stakingReward.STAKING_MANAGER_ROLE();

    main_manager_role = await main.MAIN_MANAGER_ROLE();

    await register.grantRole(register_manger_role, main.address);
    await escrow.grantRole(escrow_manager, main.address);
    await stakingReward.grantRole(staking_manager_role, main.address);
    await stakingReward.grantRole(staking_manager_role, register.address);
    await energyOracle.grantRole(energy_oracle_provider_role, main.address);
    await energyOracle.grantRole(_escrow_, escrow.address);

    await ecu.grantRole(register_role, register.address);
    await nrgs.grantRole(register_role, register.address);
    await mgt.grantRole(minter_role, stakingReward.address);
    await mgt.grantRole(minter_role, energyOracle.address);

    await mgt.connect(otherAcc).approve(escrow.address, ethers.constants.MaxUint256);
    await ecu.connect(otherAcc).setApprovalForAll(register.address, true);

    return {
      mgt,
      ecu,
      nrgs,
      register,
      stakingReward,
      manager,
      escrow,
      main,
      energyOracle,
      deployer,
      otherAcc,
      anotherAcc,
    };
  }

  it('Deployed correctly', async () => {
    const { mgt, ecu, nrgs, register, stakingReward, manager, escrow, main, energyOracle, deployer } =
      await loadFixture(deployFixture);

    expect(mgt.address).to.be.properAddress;
    expect(nrgs.address).to.be.properAddress;
    expect(ecu.address).to.be.properAddress;
    expect(register.address).to.be.properAddress;
    expect(stakingReward.address).to.be.properAddress;
    expect(manager.address).to.be.properAddress;
    expect(energyOracle.address).to.be.properAddress;

    expect(await register.hasRole(register_manger_role, main.address)).to.be.true;
    expect(await escrow.hasRole(escrow_manager, main.address)).to.be.true;
    expect(await stakingReward.hasRole(staking_manager_role, main.address)).to.be.true;
    expect(await stakingReward.hasRole(staking_manager_role, register.address)).to.be.true;
    expect(await energyOracle.hasRole(energy_oracle_provider_role, main.address)).to.be.true;
    expect(await energyOracle.hasRole(_escrow_, escrow.address)).to.be.true;

    expect(await ecu.hasRole(register_role, register.address)).to.be.true;
    expect(await nrgs.hasRole(register_role, register.address)).to.be.true;
    expect(await mgt.hasRole(minter_role, stakingReward.address)).to.be.true;
    expect(await mgt.hasRole(minter_role, energyOracle.address)).to.be.true;
  });

  describe('Register', function () {
    it('Can register supplier in register contract', async () => {
      const { main, register, stakingReward, nrgs, ecu, anotherAcc } = await loadFixture(deployFixture);

      const supplierId = 1;
      const buildingNumber = 555;

      const registerSupplier = await main.registerSupplier(anotherAcc.address);

      expect(registerSupplier).to.emit(register, 'SupplierRegistered');
      expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
      expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
      expect(registerSupplier).to.changeTokenBalance(ecu, register, buildingNumber);
      expect(await stakingReward.totalSuppliers()).to.eq(1);
    });

    it('Can register Electricity consumer in register contract', async () => {
      const { main, register, stakingReward, nrgs, ecu, otherAcc, anotherAcc } = await loadFixture(deployFixture);

      const supplierId = 1;
      const buildingNumber = 555;

      const registerSupplier = await main.registerSupplier(anotherAcc.address);

      expect(registerSupplier).to.emit(register, 'SupplierRegistered');
      expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
      expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
      expect(registerSupplier).to.changeTokenBalance(ecu, register, buildingNumber);
      expect(await stakingReward.totalSuppliers()).to.eq(1);

      const registerUser = await main.connect(anotherAcc).registerElectricityConsumer(otherAcc.address, supplierId);

      expect(registerUser).to.emit(register, 'ConsumerRegistered');
      expect(registerUser).to.changeTokenBalances(ecu, [register, otherAcc], [-1, 1]);
      expect(await ecu.balanceOf(otherAcc.address, supplierId)).to.eq(1);
    });

    it('Can unregister supplier in register contract', async () => {
      const { main, register, stakingReward, nrgs, ecu, mgt, anotherAcc } = await loadFixture(deployFixture);

      const supplierId = 1;
      const buildingNumber = 555;

      const registerSupplier = await main.registerSupplier(anotherAcc.address);

      expect(registerSupplier).to.emit(register, 'SupplierRegistered');
      expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
      expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
      expect(registerSupplier).to.changeTokenBalance(ecu, register, buildingNumber);
      expect(await stakingReward.totalSuppliers()).to.eq(1);

      const seconds = 3000;
      await time.increase(seconds);

      const unRegisterSupplier = await main.unRegisterSupplier(supplierId);

      expect(unRegisterSupplier).to.emit(register, 'SupplierUnregistered');
      expect(unRegisterSupplier).to.emit(stakingReward, 'ExitStaking');
      expect(unRegisterSupplier).to.changeTokenBalance(nrgs, anotherAcc, -1);
      expect(unRegisterSupplier).to.changeTokenBalance(ecu, register, -buildingNumber);
      expect(await stakingReward.totalSuppliers()).to.eq(0);

      expect(await mgt.balanceOf(anotherAcc.address)).to.be.approximately(seconds * 10, 10);
    });

    it('Can unregister Electricity consumer in register contract', async () => {
      const { main, register, stakingReward, nrgs, ecu, anotherAcc, otherAcc } = await loadFixture(deployFixture);

      const supplierId = 1;
      const buildingNumber = 555;

      const registerSupplier = await main.registerSupplier(anotherAcc.address);

      expect(registerSupplier).to.emit(register, 'SupplierRegistered');
      expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
      expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
      expect(registerSupplier).to.changeTokenBalance(ecu, register, buildingNumber);
      expect(await stakingReward.totalSuppliers()).to.eq(1);

      const registerUser = await main.connect(anotherAcc).registerElectricityConsumer(otherAcc.address, supplierId);

      expect(registerUser).to.emit(register, 'ConsumerRegistered');
      expect(registerUser).to.changeTokenBalances(ecu, [register, otherAcc], [-1, 1]);
      expect(await ecu.balanceOf(otherAcc.address, supplierId)).to.eq(1);

      const unRegisterUser = await main.connect(anotherAcc).unRegisterElectricityConsumer(otherAcc.address, supplierId);

      expect(unRegisterUser).to.emit(register, 'ConsumerUnregistered');
      expect(unRegisterUser).to.changeTokenBalance(ecu, otherAcc, -1);
      expect(await ecu.balanceOf(otherAcc.address, supplierId)).to.eq(0);
    });
  });

  it('Can pay for electricity from Electricity consumer', async () => {
    const { main, register, stakingReward, energyOracle, escrow, nrgs, ecu, mgt, anotherAcc, otherAcc, deployer } =
      await loadFixture(deployFixture);

    await mgt.mint(otherAcc.address, 10000);

    const supplierId = 1;
    const buildingNumber = 555;

    const registerSupplier = await main.registerSupplier(anotherAcc.address);

    expect(registerSupplier).to.emit(register, 'SupplierRegistered');
    expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
    expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
    expect(registerSupplier).to.changeTokenBalance(ecu, register, buildingNumber);
    expect(await stakingReward.totalSuppliers()).to.eq(1);

    const registerUser = await main.connect(anotherAcc).registerElectricityConsumer(otherAcc.address, supplierId);

    expect(registerUser).to.emit(register, 'ConsumerRegistered');
    expect(registerUser).to.changeTokenBalances(ecu, [register, otherAcc], [-1, 1]);
    expect(await ecu.balanceOf(otherAcc.address, supplierId)).to.eq(1);

    const now = await time.latest();
    const consumption = 20;

    const recordConsumption = await energyOracle.recordEnergyConsumption(
      otherAcc.address,
      supplierId,
      consumption,
    );
    const recordedConsumption = await energyOracle.energyConsumptions(otherAcc.address, supplierId);

    expect(recordConsumption).to.emit(energyOracle, 'EnergyConsumptionRecorded');
    expect(recordConsumption).to.changeTokenBalance(mgt, deployer, 20);
    expect(await mgt.balanceOf(deployer.address)).to.eq(20);
    expect(recordedConsumption).to.be.eq(consumption);

    const amountToPay = recordedConsumption.add(10);

    const pay = await main.connect(otherAcc).payForElectricity(supplierId);
    expect(pay).to.emit(escrow, 'PaidForEnergy');
    expect(pay).to.changeTokenBalances(mgt, [otherAcc, anotherAcc], [-amountToPay, amountToPay]);
    expect(await mgt.balanceOf(anotherAcc.address)).to.eq(recordedConsumption);
    expect(await mgt.balanceOf(otherAcc.address)).to.eq(BigNumber.from(10000).sub(amountToPay));
  });

  it('Can get rewards from staking to supplier', async () => {
    const { main, register, stakingReward, nrgs, ecu, mgt, anotherAcc } = await loadFixture(deployFixture);

    const supplierId = 1;
    const buildingNumber = 555;

    const registerSupplier = await main.registerSupplier(anotherAcc.address);

    expect(registerSupplier).to.emit(register, 'SupplierRegistered');
    expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
    expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
    expect(registerSupplier).to.changeTokenBalance(ecu, register, buildingNumber);
    expect(await stakingReward.totalSuppliers()).to.eq(1);

    const seconds = 3000;
    await time.increase(seconds);

    const getRewards = await main.connect(anotherAcc).getRewards(supplierId);

    expect(getRewards).to.emit(stakingReward, 'RewardSent');
    expect(await mgt.balanceOf(anotherAcc.address)).to.be.approximately(seconds * 10, 10);
  });

  it('OnlyRole MAIN_MANAGER_ROLE modifier', async () => {
    const { main, otherAcc } = await loadFixture(deployFixture);

    const errorMsg = `AccessControl: account ${otherAccAddress} is missing role ${main_manager_role}`;

    await expect(main.connect(otherAcc).registerSupplier(otherAccAddress)).to.revertedWith(errorMsg);
    await expect(main.connect(otherAcc).unRegisterSupplier(0)).to.revertedWith(errorMsg);
  });

  it('OnlyRole Energy Supplier modifier', async () => {
    const { main, otherAcc } = await loadFixture(deployFixture);

    const errorMsg = `ERC721: invalid token ID`;

    await expect(main.connect(otherAcc).registerElectricityConsumer(otherAccAddress, 10)).to.revertedWith(errorMsg);
    await expect(main.connect(otherAcc).unRegisterElectricityConsumer(otherAccAddress, 0)).to.revertedWith(errorMsg);
    await expect(main.connect(otherAcc).getRewards(0)).to.revertedWith(errorMsg);
  });

  it('OnlyRole USER_ROLE modifier', async () => {
    const { main, escrow, otherAcc } = await loadFixture(deployFixture);

    const errorMsg = `IncorrectConsumer`;

    await expect(main.connect(otherAcc).payForElectricity(10)).to.revertedWithCustomError(escrow, errorMsg);
  });
});

import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Escrow, MCGR, Manager, EnergyOracle, StakingReward, Register, Main } from '../typechain';
import { ELU } from '../typechain/contracts/tokens/ERC1155/ELU';
import { NRGS } from '../typechain/contracts/tokens/ERC721/NRGS';

describe('Main', function () {
  let otherAccAddress: string;
  let admin_role: string,
    minter_role: string,
    escrow_manager: string,
    register_role: string,
    energy_oracle_manager_role: string,
    oracle_provider_role: string,
    _escrow_: string,
    register_manger_role: string,
    staking_manager_role: string,
    main_manager_role: string,
    supplier_role: string,
    user_role: string;
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [deployer, otherAcc, anotherAcc] = await ethers.getSigners();

    otherAccAddress = otherAcc.address.toLowerCase();

    const MCGR: ContractFactory = await ethers.getContractFactory('MCGR');
    const mcgr: MCGR = (await MCGR.deploy()) as MCGR;
    await mcgr.deployed();

    const NRGS: ContractFactory = await ethers.getContractFactory('NRGS');
    const nrgs: NRGS = (await NRGS.deploy()) as NRGS;
    await nrgs.deployed();

    const ELU: ContractFactory = await ethers.getContractFactory('ELU');
    const elu: ELU = (await ELU.deploy()) as ELU;
    await elu.deployed();

    const Manager: ContractFactory = await ethers.getContractFactory('Manager');
    const manager: Manager = (await Manager.deploy(
      mcgr.address,
      elu.address,
      nrgs.address,
      deployer.address,
      10,
      5,
      10,
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

    await manager.changeEnergyOracle(energyOracle.address);
    await manager.changeRegister(register.address);
    await manager.changeEscrow(escrow.address);
    await manager.changeStakingContract(stakingReward.address);

    admin_role = await mcgr.DEFAULT_ADMIN_ROLE();
    minter_role = await mcgr.MINTER_BURNER_ROLE();

    register_role = await nrgs.REGISTER_ROLE();

    escrow_manager = await escrow.ESCROW_MANAGER_ROLE();

    energy_oracle_manager_role = await energyOracle.ENERGY_ORACLE_MANAGER_ROLE();
    oracle_provider_role = await energyOracle.ORACLE_PROVIDER_ROLE();
    _escrow_ = await energyOracle.ESCROW();

    register_manger_role = await register.REGISTER_MANAGER_ROLE();

    staking_manager_role = await stakingReward.STAKING_MANAGER_ROLE();

    main_manager_role = await main.MAIN_MANAGER_ROLE();
    supplier_role = await main.SUPPLIER_ROLE();
    user_role = await main.USER_ROLE();

    await register.grantRole(register_manger_role, main.address);
    await escrow.grantRole(escrow_manager, main.address);
    await stakingReward.grantRole(staking_manager_role, main.address);
    await stakingReward.grantRole(staking_manager_role, register.address);
    await energyOracle.grantRole(oracle_provider_role, main.address);
    await energyOracle.grantRole(_escrow_, escrow.address);

    await elu.grantRole(register_role, register.address);
    await nrgs.grantRole(register_role, register.address);
    await mcgr.grantRole(minter_role, stakingReward.address);
    await mcgr.grantRole(minter_role, energyOracle.address);

    await mcgr.connect(otherAcc).approve(main.address, ethers.constants.MaxUint256);
    await elu.connect(otherAcc).setApprovalForAll(register.address, true);

    return { mcgr, elu, nrgs, register, stakingReward, manager, escrow, main, energyOracle, deployer, otherAcc, anotherAcc };
  }

  it('Deployed correctly', async () => {
    const { mcgr, elu, nrgs, register, stakingReward, manager, escrow, main, energyOracle, deployer } = await loadFixture(
      deployFixture,
    );

    expect(mcgr.address).to.be.properAddress;
    expect(nrgs.address).to.be.properAddress;
    expect(elu.address).to.be.properAddress;
    expect(register.address).to.be.properAddress;
    expect(stakingReward.address).to.be.properAddress;
    expect(manager.address).to.be.properAddress;
    expect(energyOracle.address).to.be.properAddress;

    expect(await register.hasRole(register_manger_role, main.address)).to.be.true;
    expect(await escrow.hasRole(escrow_manager, main.address)).to.be.true;
    expect(await stakingReward.hasRole(staking_manager_role, main.address)).to.be.true;
    expect(await stakingReward.hasRole(staking_manager_role, register.address)).to.be.true;
    expect(await energyOracle.hasRole(oracle_provider_role, main.address)).to.be.true;
    expect(await energyOracle.hasRole(_escrow_, escrow.address)).to.be.true;

    expect(await elu.hasRole(register_role, register.address)).to.be.true;
    expect(await nrgs.hasRole(register_role, register.address)).to.be.true;
    expect(await mcgr.hasRole(minter_role, stakingReward.address)).to.be.true;
    expect(await mcgr.hasRole(minter_role, energyOracle.address)).to.be.true;
  });

  describe('Register', function () {
    it('Can register supplier in register contract', async () => {
      const { main, register, stakingReward, nrgs, elu, anotherAcc } = await loadFixture(deployFixture);

      const supplierId = 1010;
      const buildingNumber = 555;

      const registerSupplier = await main.registerSupplier(anotherAcc.address, supplierId, buildingNumber);

      expect(registerSupplier).to.emit(register, 'SupplierRegistered');
      expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
      expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
      expect(registerSupplier).to.changeTokenBalance(elu, register, buildingNumber);
      expect(await stakingReward.totalSuppliers()).to.eq(1);
    });

    it('Can register electricity user in register contract', async () => {
      const { main, register, stakingReward, nrgs, elu, otherAcc, anotherAcc } = await loadFixture(deployFixture);

      const supplierId = 1010;
      const buildingNumber = 555;

      const registerSupplier = await main.registerSupplier(anotherAcc.address, supplierId, buildingNumber);

      expect(registerSupplier).to.emit(register, 'SupplierRegistered');
      expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
      expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
      expect(registerSupplier).to.changeTokenBalance(elu, register, buildingNumber);
      expect(await stakingReward.totalSuppliers()).to.eq(1);

      const registerUser = await main.connect(anotherAcc).registerElectricityUser(otherAcc.address, supplierId);

      expect(registerUser).to.emit(register, 'UserRegistered');
      expect(registerUser).to.changeTokenBalances(elu, [register, otherAcc], [-1, 1]);
      expect(await elu.balanceOf(otherAcc.address, supplierId)).to.eq(1);
    });

    it('Can unregister supplier in register contract', async () => {
      const { main, register, stakingReward, nrgs, elu, mcgr, anotherAcc } = await loadFixture(deployFixture);

      const supplierId = 1010;
      const buildingNumber = 555;

      const registerSupplier = await main.registerSupplier(anotherAcc.address, supplierId, buildingNumber);

      expect(registerSupplier).to.emit(register, 'SupplierRegistered');
      expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
      expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
      expect(registerSupplier).to.changeTokenBalance(elu, register, buildingNumber);
      expect(await stakingReward.totalSuppliers()).to.eq(1);

      const seconds = 3000;
      await time.increase(seconds);

      const unRegisterSupplier = await main.unRegisterSupplier(supplierId);

      expect(unRegisterSupplier).to.emit(register, 'SupplierUnregistered');
      expect(unRegisterSupplier).to.emit(stakingReward, 'ExitStaking');
      expect(unRegisterSupplier).to.changeTokenBalance(nrgs, anotherAcc, -1);
      expect(unRegisterSupplier).to.changeTokenBalance(elu, register, -buildingNumber);
      expect(await stakingReward.totalSuppliers()).to.eq(0);

      expect(await mcgr.balanceOf(anotherAcc.address)).to.be.approximately(seconds * 10, 10);
    });

    it('Can unregister electricity user in register contract', async () => {
      const { main, register, stakingReward, nrgs, elu, anotherAcc, otherAcc } = await loadFixture(deployFixture);

      const supplierId = 1010;
      const buildingNumber = 555;

      const registerSupplier = await main.registerSupplier(anotherAcc.address, supplierId, buildingNumber);

      expect(registerSupplier).to.emit(register, 'SupplierRegistered');
      expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
      expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
      expect(registerSupplier).to.changeTokenBalance(elu, register, buildingNumber);
      expect(await stakingReward.totalSuppliers()).to.eq(1);

      const registerUser = await main.connect(anotherAcc).registerElectricityUser(otherAcc.address, supplierId);

      expect(registerUser).to.emit(register, 'UserRegistered');
      expect(registerUser).to.changeTokenBalances(elu, [register, otherAcc], [-1, 1]);
      expect(await elu.balanceOf(otherAcc.address, supplierId)).to.eq(1);

      const unRegisterUser = await main.connect(anotherAcc).unRegisterElectricityUser(otherAcc.address, supplierId);

      expect(unRegisterUser).to.emit(register, 'UserUnregistered');
      expect(unRegisterUser).to.changeTokenBalance(elu, otherAcc, -1);
      expect(await elu.balanceOf(otherAcc.address, supplierId)).to.eq(0);
    });
  });

  it('Can pay for electricity from electricity user', async () => {
    const { main, register, stakingReward, energyOracle, escrow, nrgs, elu, mcgr, anotherAcc, otherAcc, deployer } =
      await loadFixture(deployFixture);

    await mcgr.mint(otherAcc.address, 10000);

    const supplierId = 1010;
    const buildingNumber = 555;

    const registerSupplier = await main.registerSupplier(anotherAcc.address, supplierId, buildingNumber);

    expect(registerSupplier).to.emit(register, 'SupplierRegistered');
    expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
    expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
    expect(registerSupplier).to.changeTokenBalance(elu, register, buildingNumber);
    expect(await stakingReward.totalSuppliers()).to.eq(1);

    const registerUser = await main.connect(anotherAcc).registerElectricityUser(otherAcc.address, supplierId);

    expect(registerUser).to.emit(register, 'UserRegistered');
    expect(registerUser).to.changeTokenBalances(elu, [register, otherAcc], [-1, 1]);
    expect(await elu.balanceOf(otherAcc.address, supplierId)).to.eq(1);

    const now = await time.latest();
    const consumption = 20;

    const recordConsumption = await energyOracle.recordEnergyConsumption(otherAcc.address, supplierId, now, consumption);
    const recordedConsumption = await energyOracle.energyConsumptions(otherAcc.address, supplierId, 0);

    expect(recordConsumption).to.emit(energyOracle, 'EnergyConsumptionRecorded');
    expect(recordConsumption).to.changeTokenBalance(mcgr, deployer, 20);
    expect(await mcgr.balanceOf(deployer.address)).to.eq(20);
    expect(recordedConsumption.consumption).to.be.eq(consumption);

    const amountToPay = recordedConsumption.consumption.add(10);

    const pay = await main.connect(otherAcc).payForElectricity(supplierId, amountToPay);
    expect(pay).to.emit(escrow, 'PaidForEnergy');
    expect(pay).to.changeTokenBalances(mcgr, [otherAcc, anotherAcc], [-amountToPay, amountToPay]);
    expect(await mcgr.balanceOf(anotherAcc.address)).to.eq(recordedConsumption.consumption);
    expect(await mcgr.balanceOf(otherAcc.address)).to.eq(BigNumber.from(10000).sub(amountToPay.add(10)));
  });

  it('Can get rewards from staking to supplier', async () => {
    const { main, register, stakingReward, nrgs, elu, mcgr, anotherAcc } = await loadFixture(deployFixture);

    const supplierId = 1010;
    const buildingNumber = 555;

    const registerSupplier = await main.registerSupplier(anotherAcc.address, supplierId, buildingNumber);

    expect(registerSupplier).to.emit(register, 'SupplierRegistered');
    expect(registerSupplier).to.emit(stakingReward, 'EnterStaking');
    expect(registerSupplier).to.changeTokenBalance(nrgs, anotherAcc, 1);
    expect(registerSupplier).to.changeTokenBalance(elu, register, buildingNumber);
    expect(await stakingReward.totalSuppliers()).to.eq(1);

    const seconds = 3000;
    await time.increase(seconds);

    const getRewards = await main.connect(anotherAcc).getRewards(supplierId);

    expect(getRewards).to.emit(stakingReward, 'RewardSent');
    expect(await mcgr.balanceOf(anotherAcc.address)).to.be.approximately(seconds * 10, 10);
  });

  it('Greater than zero modifier', async () => {
    const { main, anotherAcc } = await loadFixture(deployFixture);

    const errorMsg = 'Parent: passed value is <= 0';
    await expect(main.registerSupplier(anotherAcc.address, 10, 0)).to.revertedWith(errorMsg);
    await expect(main.payForElectricity(10, 0)).to.revertedWith(errorMsg);
  });

  it('OnlyRole MAIN_MANAGER_ROLE modifier', async () => {
    const { main, otherAcc } = await loadFixture(deployFixture);

    const errorMsg = `AccessControl: account ${otherAccAddress} is missing role ${main_manager_role}`;

    await expect(main.connect(otherAcc).registerSupplier(otherAccAddress, 10, 0)).to.revertedWith(errorMsg);
    await expect(main.connect(otherAcc).unRegisterSupplier(0)).to.revertedWith(errorMsg);
  });

  it('OnlyRole SUPPLIER_ROLE modifier', async () => {
    const { main, otherAcc } = await loadFixture(deployFixture);

    const errorMsg = `AccessControl: account ${otherAccAddress} is missing role ${supplier_role}`;

    await expect(main.connect(otherAcc).registerElectricityUser(otherAccAddress, 10)).to.revertedWith(errorMsg);
    await expect(main.connect(otherAcc).unRegisterElectricityUser(otherAccAddress, 0)).to.revertedWith(errorMsg);
    await expect(main.connect(otherAcc).getRewards(0)).to.revertedWith(errorMsg);
  });

  it('OnlyRole USER_ROLE modifier', async () => {
    const { main, otherAcc } = await loadFixture(deployFixture);

    const errorMsg = `AccessControl: account ${otherAccAddress} is missing role ${user_role}`;

    await expect(main.connect(otherAcc).payForElectricity(10, 0)).to.revertedWith(errorMsg);
  });
});

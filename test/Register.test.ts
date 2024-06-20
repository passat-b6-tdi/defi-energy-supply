import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { MGT, Manager, NRGOP, Register, StakingReward, ECU, NRGS } from '../typechain';

describe('Register', function () {
  let otherAccAddress: string;
  let admin_role: string,
    minter_role: string,
    staking_role: string,
    register_manager_role: string,
    register_role: string;
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [deployer, otherAcc] = await ethers.getSigners();

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

    const StakingReward: ContractFactory = await ethers.getContractFactory('StakingReward');
    const stakingReward: StakingReward = (await StakingReward.deploy(manager.address)) as StakingReward;
    await stakingReward.deployed();

    const Register: ContractFactory = await ethers.getContractFactory('Register');
    const register: Register = (await Register.deploy(manager.address)) as Register;
    await register.deployed();

    admin_role = await mgt.DEFAULT_ADMIN_ROLE();
    minter_role = await mgt.MINTER_BURNER_ROLE();

    staking_role = await stakingReward.STAKING_MANAGER_ROLE();
    register_role = await nrgs.REGISTER_ROLE();
    register_manager_role = await register.REGISTER_MANAGER_ROLE();

    const Contracts: Manager.ContractsStruct = {
      oracle: ethers.constants.AddressZero,
      staking: stakingReward.address,
      register: register.address,
      escrow: ethers.constants.AddressZero,
    }

    await manager.changeContracts(Contracts);

    await mgt.grantRole(minter_role, stakingReward.address);

    await nrgs.grantRole(register_role, register.address);
    await nrgop.grantRole(register_role, register.address);
    await ecu.grantRole(register_role, register.address);

    await stakingReward.grantRole(staking_role, register.address);

    await ecu.connect(otherAcc).setApprovalForAll(register.address, true);

    return { mgt, ecu, ECU_Factory, nrgs, NRGS_Factory, nrgop, NRGOP_Factory, manager, stakingReward, StakingReward, register, deployer, otherAcc };
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
      await expect(register.registerElectricityConsumer(addressZero, 10)).to.be.revertedWithCustomError(register, errorMsg);
      await expect(register.unRegisterSupplier(10)).to.be.revertedWith('ERC721: invalid token ID');
      await expect(register.unRegisterOracleProvider(10)).to.be.revertedWith('ERC721: invalid token ID');
      await expect(register.unRegisterElectricityConsumer(addressZero, 10)).to.be.revertedWithCustomError(register, errorMsg);
    });

    it('Requires valid token id', async () => {
      const { register, deployer } = await loadFixture(deployFixture);
      const errorMsg = 'ERC721: invalid token ID';
      const errorMsgForUser = 'IncorrectConsumer';

      await expect(register.unRegisterSupplier(10)).to.be.revertedWith(errorMsg);
      await expect(register.unRegisterOracleProvider(10)).to.be.revertedWith(errorMsg);
      await expect(register.unRegisterElectricityConsumer(deployer.address, 10)).to.be.revertedWithCustomError(register, errorMsgForUser);
    });
  });
});

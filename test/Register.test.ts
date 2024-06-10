import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { MCGR, Manager, Register, StakingReward } from '../typechain';
import { ELU } from '../typechain/contracts/tokens/ERC1155/ELU';
import { NRGS } from '../typechain/contracts/tokens/ERC721/NRGS';
import { staking } from '../typechain/contracts';

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

    const StakingReward: ContractFactory = await ethers.getContractFactory('StakingReward');
    const stakingReward: StakingReward = (await StakingReward.deploy(manager.address)) as StakingReward;
    await stakingReward.deployed();

    const Register: ContractFactory = await ethers.getContractFactory('Register');
    const register: Register = (await Register.deploy(manager.address)) as Register;
    await register.deployed();

    admin_role = await mcgr.DEFAULT_ADMIN_ROLE();
    minter_role = await mcgr.MINTER_BURNER_ROLE();

    staking_role = await stakingReward.STAKING_MANAGER_ROLE();
    register_role = await nrgs.REGISTER_ROLE();
    register_manager_role = await register.REGISTER_MANAGER_ROLE();

    await manager.changeRewardAmount(10);
    await manager.changeStakingContract(stakingReward.address);

    await mcgr.grantRole(minter_role, stakingReward.address);

    await nrgs.grantRole(register_role, register.address);
    await elu.grantRole(register_role, register.address);

    await stakingReward.grantRole(staking_role, register.address);

    await elu.connect(otherAcc).setApprovalForAll(register.address, true);

    return { mcgr, elu, ELU, nrgs, NRGS, manager, stakingReward, StakingReward, register, deployer, otherAcc };
  }

  it('Deployed correctly', async () => {
    const { mcgr, elu, nrgs, stakingReward, register, manager, deployer } = await loadFixture(deployFixture);

    expect(mcgr.address).to.be.properAddress;
    expect(nrgs.address).to.be.properAddress;
    expect(elu.address).to.be.properAddress;
    expect(stakingReward.address).to.be.properAddress;
    expect(register.address).to.be.properAddress;

    expect(await mcgr.name()).to.be.eq('Mictrogrid Reward Token');
    expect(await mcgr.symbol()).to.be.eq('MCGR');
    expect(await nrgs.name()).to.be.eq('Energy Supplier Token');
    expect(await nrgs.symbol()).to.be.eq('NRGS');

    expect(await mcgr.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await mcgr.hasRole(minter_role, deployer.address)).to.be.true;
    expect(await mcgr.hasRole(minter_role, stakingReward.address)).to.be.true;

    expect(await nrgs.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await nrgs.hasRole(register_role, deployer.address)).to.be.true;
    expect(await nrgs.hasRole(register_role, register.address)).to.be.true;
    expect(await elu.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await elu.hasRole(register_role, deployer.address)).to.be.true;
    expect(await elu.hasRole(register_role, register.address)).to.be.true;

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
      const { register, stakingReward, nrgs, elu, deployer } = await loadFixture(deployFixture);
      const registration = await register.registerSupplier(deployer.address, 5, 10);

      const ownerOf5 = await nrgs.ownerOf(5);
      const now = await time.latest();
      const suppliers = await elu.balanceOf(register.address, 5);

      const sup = await stakingReward.suppliers(deployer.address, 5);

      expect(registration).to.emit(register, 'SupplierRegistered');
      expect(registration).to.emit(nrgs, 'Transfer');
      expect(registration).to.emit(stakingReward, 'EnterStaking');
      expect(ownerOf5).to.be.eq(deployer.address);
      expect(sup.updatedAt).to.be.eq(now);
      expect(sup.pendingReward).to.be.eq(0);
      expect(suppliers).to.eq(10);
    });

    it('Manager can un register supllier', async () => {
      const { register, stakingReward, nrgs, elu, deployer } = await loadFixture(deployFixture);
      const registration = await register.registerSupplier(deployer.address, 5, 10);

      const ownerOf5 = await nrgs.ownerOf(5);
      const suppliers = await elu.balanceOf(register.address, 5);
      let now = await time.latest();

      let sup = await stakingReward.suppliers(deployer.address, 5);

      expect(registration).to.emit(register, 'SupplierRegistered');
      expect(registration).to.emit(nrgs, 'Transfer');
      expect(registration).to.emit(stakingReward, 'EnterStaking');
      expect(ownerOf5).to.be.eq(deployer.address);
      expect(sup.updatedAt).to.be.eq(now);
      expect(sup.pendingReward).to.be.eq(0);
      expect(suppliers).to.eq(10);

      const unRegistration = await register.unRegisterSupplier(5);

      now = await time.latest();

      sup = await stakingReward.suppliers(deployer.address, 5);

      expect(unRegistration).to.emit(register, 'SupplierUnregistered');
      expect(unRegistration).to.emit(nrgs, 'Transfer');
      expect(unRegistration).to.emit(stakingReward, 'ExitStaking');
      expect(sup.updatedAt).to.be.eq(0);
      expect(sup.pendingReward).to.be.eq(0);
    });

    it('Manager can register users', async () => {
      const { register, elu, deployer, otherAcc } = await loadFixture(deployFixture);
      const registrationSupplier = await register.registerSupplier(deployer.address, 5, 10);

      const registrationUser = await register.registerElectricityUser(otherAcc.address, 5);

      expect(registrationUser).to.emit(register, 'UserRegistered');
      expect(registrationUser).to.emit(elu, 'Transfer');
      expect(await elu.balanceOf(otherAcc.address, 5)).to.be.eq(1);
    });

    it('Manager can un register users', async () => {
      const { register, elu, deployer, otherAcc } = await loadFixture(deployFixture);
      const registrationSupplier = await register.registerSupplier(deployer.address, 5, 10);

      const registrationUser = await register.registerElectricityUser(otherAcc.address, 5);

      expect(registrationUser).to.emit(register, 'UserRegistered');
      expect(registrationUser).to.emit(elu, 'Transfer');
      expect(await elu.balanceOf(otherAcc.address, 5)).to.be.eq(1);

      const unRegistration = await register.unRegisterElectricityUser(otherAcc.address, 5);

      expect(unRegistration).to.emit(register, 'SupplierUnregistered');
      expect(unRegistration).to.emit(elu, 'Transfer');
      expect(await elu.balanceOf(otherAcc.address, 5)).to.be.eq(0);
    });
  });

  describe('Errors', function () {
    it('Only REGISTER_MANAGER_ROLE', async () => {
      const { register, otherAcc, deployer } = await loadFixture(deployFixture);

      const errorMsg = `AccessControl: account ${otherAccAddress} is missing role ${register_manager_role}`;

      await expect(register.connect(otherAcc).registerSupplier(deployer.address, 5, 10)).to.be.revertedWith(errorMsg);
      await expect(register.connect(otherAcc).registerElectricityUser(otherAcc.address, 10)).to.be.revertedWith(
        errorMsg,
      );
      await expect(register.connect(otherAcc).unRegisterSupplier(10)).to.be.revertedWith(errorMsg);
      await expect(register.connect(otherAcc).unRegisterElectricityUser(otherAcc.address, 10)).to.be.revertedWith(
        errorMsg,
      );
    });

    it('Zero Address Check', async () => {
      const { register } = await loadFixture(deployFixture);
      const addressZero = ethers.constants.AddressZero;
      const errorMsg = 'Parent: account is address 0';

      await expect(register.registerSupplier(addressZero, 10, 5)).to.be.revertedWith(errorMsg);
      await expect(register.registerElectricityUser(addressZero, 10)).to.be.revertedWith(errorMsg);
      await expect(register.unRegisterSupplier(10)).to.be.revertedWith('ERC721: invalid token ID');
      await expect(register.unRegisterElectricityUser(addressZero, 10)).to.be.revertedWith(errorMsg);
    });

    it('Requires valid token id', async () => {
      const { register, deployer } = await loadFixture(deployFixture);
      const errorMsgForSupplier = 'ERC721: invalid token ID';
      const errorMsgForUser = 'Register: supplier is not correct';

      await expect(register.unRegisterSupplier(10)).to.be.revertedWith(errorMsgForSupplier);
      await expect(register.unRegisterElectricityUser(deployer.address, 10)).to.be.revertedWith(errorMsgForUser);
    });
  });
});

import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { MGT, Manager, Register, StakingReward, EnergyOracle, Escrow } from '../typechain';
import { ECU } from '../typechain/contracts/tokens/ERC1155/ECU';
import { NRGS } from '../typechain/contracts/tokens/ERC721/NRGS';

describe('Manager', function () {
  let otherAccAddress: string;
  let admin_role: string,
    minter_role: string,
    staking_role: string,
    register_manager_role: string,
    manager_role: string,
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

    const Manager: ContractFactory = await ethers.getContractFactory('Manager');
    const manager: Manager = (await Manager.deploy(
      mgt.address,
      ecu.address,
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

    const EnergyOracle: ContractFactory = await ethers.getContractFactory('EnergyOracle');
    const energyOracle: EnergyOracle = (await EnergyOracle.deploy(manager.address)) as EnergyOracle;
    await energyOracle.deployed();

    const Escrow: ContractFactory = await ethers.getContractFactory('Escrow');
    const escrow: Escrow = (await Escrow.deploy(manager.address)) as Escrow;
    await escrow.deployed();

    admin_role = await mgt.DEFAULT_ADMIN_ROLE();
    minter_role = await mgt.MINTER_BURNER_ROLE();

    staking_role = await stakingReward.STAKING_MANAGER_ROLE();
    register_manager_role = await register.REGISTER_MANAGER_ROLE();
    register_role = await nrgs.REGISTER_ROLE();
    manager_role = await manager.MANAGER_ROLE();

    await manager.changeRewardAmount(10);
    await manager.changeStakingContract(stakingReward.address);

    await mgt.grantRole(minter_role, stakingReward.address);

    await nrgs.grantRole(register_role, register.address);
    await ecu.grantRole(register_role, register.address);

    await stakingReward.grantRole(staking_role, register.address);

    return {
      manager,
      mgt,
      MGT_Factory,
      ecu,
      ECU_Factory,
      nrgs,
      NRGS_Factory,
      stakingReward,
      StakingReward,
      energyOracle,
      register,
      escrow,
      deployer,
      otherAcc,
    };
  }

  it('Deployed correctly', async () => {
    const { mgt, ecu, nrgs, stakingReward, register, manager, escrow, deployer } = await loadFixture(deployFixture);

    expect(mgt.address).to.be.properAddress;
    expect(nrgs.address).to.be.properAddress;
    expect(ecu.address).to.be.properAddress;
    expect(stakingReward.address).to.be.properAddress;
    expect(register.address).to.be.properAddress;
    expect(escrow.address).to.be.properAddress;

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

  describe('Manage', function () {
    it('Manager can change mgt', async () => {
      const { manager, MGT_Factory, mgt } = await loadFixture(deployFixture);

      const mgt2: MGT = (await MGT_Factory.deploy()) as MGT;
      await mgt2.deployed();

      const prevMGT = await manager.MGT();

      const changes = await manager.changeMGT(mgt2.address);
      const currMGT = await manager.MGT();

      expect(prevMGT).to.be.eq(mgt.address);
      expect(currMGT).to.be.eq(mgt2.address);

      expect(changes).to.emit(manager, 'MGTchanged');
    });

    it('Manager can change ECU_Factory', async () => {
      const { manager, ECU_Factory, ecu } = await loadFixture(deployFixture);

      const ecu2: ECU = (await ECU_Factory.deploy()) as ECU;
      await ecu2.deployed();

      const prevElu = await manager.ECU();

      const changes = await manager.changeECU(ecu2.address);
      const currElu = await manager.ECU();

      expect(prevElu).to.be.eq(ecu.address);
      expect(currElu).to.be.eq(ecu2.address);

      expect(changes).to.emit(manager, 'ECUchanged');
    });

    it('Manager can change NRGS_Factory', async () => {
      const { manager, NRGS_Factory, nrgs } = await loadFixture(deployFixture);

      const nrgs2: NRGS = (await NRGS_Factory.deploy()) as NRGS;
      await nrgs2.deployed();

      const prevNrgs = await manager.NRGS();

      const changes = await manager.changeNRGS(nrgs2.address);
      const currNrgs = await manager.NRGS();

      expect(prevNrgs).to.be.eq(nrgs.address);
      expect(currNrgs).to.be.eq(nrgs2.address);

      expect(changes).to.emit(manager, 'NRGSchanged');
    });

    it('Manager can change Staking', async () => {
      const { manager, stakingReward, StakingReward } = await loadFixture(deployFixture);

      const staking2: StakingReward = (await StakingReward.deploy(manager.address)) as StakingReward;
      await staking2.deployed();

      const prevStaking = await manager.staking();

      const changes = await manager.changeStakingContract(staking2.address);
      const currStaking = await manager.staking();

      expect(prevStaking).to.be.eq(stakingReward.address);
      expect(currStaking).to.be.eq(staking2.address);

      expect(changes).to.emit(manager, 'StakingChanged');
    });

    it('Manager can change Register', async () => {
      const { manager, register } = await loadFixture(deployFixture);

      const changes = await manager.changeRegister(register.address);

      expect(await manager.register()).to.be.eq(register.address);
      expect(changes).to.emit(manager, 'RegisterChanged');
    });

    it('Manager can change EnergyOracle', async () => {
      const { manager, energyOracle } = await loadFixture(deployFixture);

      const changes = await manager.changeEnergyOracle(energyOracle.address);

      expect(await manager.energyOracle()).to.be.eq(energyOracle.address);
      expect(changes).to.emit(manager, 'OracleChanged');
    });

    it('Manager can change Escrow', async () => {
      const { manager, escrow } = await loadFixture(deployFixture);

      const changes = await manager.changeEscrow(escrow.address);

      expect(await manager.escrow()).to.be.eq(escrow.address);
      expect(changes).to.emit(manager, 'EscrowChanged');
    });

    it('Manager can change feeReceiver', async () => {
      const { manager, deployer, otherAcc } = await loadFixture(deployFixture);

      const prev = await manager.feeReceiver();

      const changes = await manager.changeFeeReceiver(otherAccAddress);
      const curr = await manager.feeReceiver();

      expect(prev).to.be.eq(deployer.address);
      expect(curr).to.be.eq(otherAcc.address);

      expect(changes).to.emit(manager, 'FeeReceiverChanged');
    });

    it('Manager can change RewardAmount', async () => {
      const { manager } = await loadFixture(deployFixture);

      const prevReward = await manager.rewardAmount();

      const changes = await manager.changeRewardAmount(20);
      const currReward = await manager.rewardAmount();

      expect(prevReward).to.be.eq(10);
      expect(currReward).to.be.eq(20);

      expect(changes).to.emit(manager, 'RewardAmountChanged');
    });

    it('Manager can change fees amount', async () => {
      const { manager } = await loadFixture(deployFixture);

      const prev = await manager.fees();

      const changes = await manager.changeFees(20);
      const curr = await manager.fees();

      expect(prev).to.be.eq(10);
      expect(curr).to.be.eq(20);

      expect(changes).to.emit(manager, 'FeesChanged');
    });

    it('Manager can change Tolerance', async () => {
      const { manager } = await loadFixture(deployFixture);

      const prev = await manager.tolerance();

      const changes = await manager.changeTolerance(40);
      const curr = await manager.tolerance();

      expect(prev).to.be.eq(5);
      expect(curr).to.be.eq(40);

      expect(changes).to.emit(manager, 'ToleranceChanged');
    });
  });

  describe('Errors', function () {
    it('Only MANAGER_ROLE', async () => {
      const { manager, otherAcc } = await loadFixture(deployFixture);

      const errorMsg = `AccessControl: account ${otherAccAddress} is missing role ${manager_role}`;

      await expect(manager.connect(otherAcc).changeMGT(otherAcc.address)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeNRGS(otherAcc.address)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeECU(otherAcc.address)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeStakingContract(otherAcc.address)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeRegister(otherAcc.address)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeEnergyOracle(otherAcc.address)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeEscrow(otherAcc.address)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeRewardAmount(20)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeTolerance(20)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeFeeReceiver(otherAcc.address)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeFees(20)).to.be.revertedWith(errorMsg);
    });

    it('Zero Address Check', async () => {
      const { manager } = await loadFixture(deployFixture);
      const addressZero = ethers.constants.AddressZero;
      const errorMsg = 'Manager: passed address is address 0';

      await expect(manager.changeMGT(addressZero)).to.be.revertedWith(errorMsg);
      await expect(manager.changeNRGS(addressZero)).to.be.revertedWith(errorMsg);
      await expect(manager.changeECU(addressZero)).to.be.revertedWith(errorMsg);
      await expect(manager.changeStakingContract(addressZero)).to.be.revertedWith(errorMsg);
      await expect(manager.changeRegister(addressZero)).to.be.revertedWith(errorMsg);
      await expect(manager.changeEnergyOracle(addressZero)).to.be.revertedWith(errorMsg);
      await expect(manager.changeEscrow(addressZero)).to.be.revertedWith(errorMsg);
      await expect(manager.changeFeeReceiver(addressZero)).to.be.revertedWith(errorMsg);
    });

    it('Greater than zero Check', async () => {
      const { manager } = await loadFixture(deployFixture);
      const errorMsg = 'Manager: passed value is <= 0';

      await expect(manager.changeRewardAmount(0)).to.be.revertedWith(errorMsg);
      await expect(manager.changeTolerance(0)).to.be.revertedWith(errorMsg);
      await expect(manager.changeFees(0)).to.be.revertedWith(errorMsg);
    });
  });
});

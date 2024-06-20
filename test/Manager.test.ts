import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { MGT, Manager, Register, StakingReward, EnergyOracle, Escrow, NRGOP, ECU, NRGS } from '../typechain';

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

    await manager.changeValues(Values);

    const Contracts: Manager.ContractsStruct = {
      oracle: energyOracle.address,
      staking: stakingReward.address,
      register: register.address,
      escrow: escrow.address,
    }

    await manager.changeContracts(Contracts);

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
      nrgop,
      NRGOP_Factory,
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

      const prevMGT = (await manager.tokens()).mgt;

      const Tokens: Manager.TokensStruct = {
        mgt: mgt2.address,
        ecu: ethers.constants.AddressZero,
        nrgs: ethers.constants.AddressZero,
        nrgop: ethers.constants.AddressZero,
      }

      const changes = await manager.changeTokensAddresses(Tokens);
      const currMGT = (await manager.tokens()).mgt;

      expect(prevMGT).to.be.eq(mgt.address);
      expect(currMGT).to.be.eq(mgt2.address);

      expect(changes).to.emit(manager, 'MGTchanged');
    });

    it('Manager can change ECU_Factory', async () => {
      const { manager, ECU_Factory, ecu } = await loadFixture(deployFixture);

      const ecu2: ECU = (await ECU_Factory.deploy()) as ECU;
      await ecu2.deployed();

      const prevECU = (await manager.tokens()).ecu;

      const Tokens: Manager.TokensStruct = {
        mgt: ethers.constants.AddressZero,
        ecu: ecu2.address,
        nrgs: ethers.constants.AddressZero,
        nrgop: ethers.constants.AddressZero,
      }

      const changes = await manager.changeTokensAddresses(Tokens);
      const currECU = (await manager.tokens()).ecu;

      expect(prevECU).to.be.eq(ecu.address);
      expect(currECU).to.be.eq(ecu2.address);

      expect(changes).to.emit(manager, 'ECUchanged');
    });

    it('Manager can change NRGS_Factory', async () => {
      const { manager, NRGS_Factory, nrgs } = await loadFixture(deployFixture);

      const nrgs2: NRGS = (await NRGS_Factory.deploy()) as NRGS;
      await nrgs2.deployed();

      const prevNrgs = (await manager.tokens()).nrgs;

      const Tokens: Manager.TokensStruct = {
        mgt: ethers.constants.AddressZero,
        ecu: ethers.constants.AddressZero,
        nrgs: nrgs2.address,
        nrgop: ethers.constants.AddressZero,
      }

      const changes = await manager.changeTokensAddresses(Tokens);
      const currNrgs = (await manager.tokens()).nrgs;

      expect(prevNrgs).to.be.eq(nrgs.address);
      expect(currNrgs).to.be.eq(nrgs2.address);

      expect(changes).to.emit(manager, 'NRGSchanged');
    });

    it('Manager can change NRGOP_Factory', async () => {
      const { manager, NRGOP_Factory, nrgop } = await loadFixture(deployFixture);

      const nrgop2: NRGOP = (await NRGOP_Factory.deploy()) as NRGOP;
      await nrgop2.deployed();

      const prevNrgop = (await manager.tokens()).nrgop;

      const Tokens: Manager.TokensStruct = {
        mgt: ethers.constants.AddressZero,
        ecu: ethers.constants.AddressZero,
        nrgs: ethers.constants.AddressZero,
        nrgop: nrgop2.address,
      }

      const changes = await manager.changeTokensAddresses(Tokens);
      const currNrgop = (await manager.tokens()).nrgop;

      expect(prevNrgop).to.be.eq(nrgop.address);
      expect(currNrgop).to.be.eq(nrgop2.address);

      expect(changes).to.emit(manager, 'NRGOPchanged');
    });

    it('Manager can change Staking', async () => {
      const { manager, stakingReward, StakingReward } = await loadFixture(deployFixture);

      const staking2: StakingReward = (await StakingReward.deploy(manager.address)) as StakingReward;
      await staking2.deployed();

      const prevStaking = (await manager.contracts()).staking;

      const Contracts: Manager.ContractsStruct = {
        oracle: ethers.constants.AddressZero,
        staking: staking2.address,
        register: ethers.constants.AddressZero,
        escrow: ethers.constants.AddressZero,
      }

      const changes = await manager.changeContracts(Contracts);
      const currStaking = (await manager.contracts()).staking;

      expect(prevStaking).to.be.eq(stakingReward.address);
      expect(currStaking).to.be.eq(staking2.address);

      expect(changes).to.emit(manager, 'StakingChanged');
    });

    it('Manager can change Register', async () => {
      const { manager, register } = await loadFixture(deployFixture);

      const Contracts: Manager.ContractsStruct = {
        oracle: ethers.constants.AddressZero,
        staking: ethers.constants.AddressZero,
        register: register.address,
        escrow: ethers.constants.AddressZero,
      }

      const changes = await manager.changeContracts(Contracts);

      expect((await manager.contracts()).register).to.be.eq(register.address);
      expect(changes).to.emit(manager, 'RegisterChanged');
    });

    it('Manager can change EnergyOracle', async () => {
      const { manager, energyOracle } = await loadFixture(deployFixture);

      const Contracts: Manager.ContractsStruct = {
        oracle: energyOracle.address,
        staking: ethers.constants.AddressZero,
        register: ethers.constants.AddressZero,
        escrow: ethers.constants.AddressZero,
      }

      const changes = await manager.changeContracts(Contracts);

      expect((await manager.contracts()).oracle).to.be.eq(energyOracle.address);
      expect(changes).to.emit(manager, 'OracleChanged');
    });

    it('Manager can change Escrow', async () => {
      const { manager, escrow } = await loadFixture(deployFixture);

      const Contracts: Manager.ContractsStruct = {
        oracle: ethers.constants.AddressZero,
        staking: ethers.constants.AddressZero,
        register: ethers.constants.AddressZero,
        escrow: escrow.address,
      }

      const changes = await manager.changeContracts(Contracts);

      expect((await manager.contracts()).escrow).to.be.eq(escrow.address);
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

      const prevReward = (await manager.values()).rewardAmount;

      const Values: Manager.ValuesStruct = {
        rewardAmount: 20,
        fees: 0,
      }

      const changes = await manager.changeValues(Values);
      const currReward = (await manager.values()).rewardAmount;

      expect(prevReward).to.be.eq(10);
      expect(currReward).to.be.eq(20);

      expect(changes).to.emit(manager, 'RewardAmountChanged');
    });

    it('Manager can change fees amount', async () => {
      const { manager } = await loadFixture(deployFixture);

      const prev = (await manager.values()).fees;

      const Values: Manager.ValuesStruct = {
        rewardAmount: 0,
        fees: 20,
      }

      const changes = await manager.changeValues(Values);
      const curr = (await manager.values()).fees;

      expect(prev).to.be.eq(10);
      expect(curr).to.be.eq(20);

      expect(changes).to.emit(manager, 'FeesChanged');
    });
  });

  describe('Errors', function () {
    it('Only MANAGER_ROLE', async () => {
      const { manager, otherAcc } = await loadFixture(deployFixture);

      const errorMsg = `AccessControl: account ${otherAccAddress} is missing role ${manager_role}`;

      const Contracts: Manager.ContractsStruct = {
        oracle: ethers.constants.AddressZero,
        staking: ethers.constants.AddressZero,
        register: ethers.constants.AddressZero,
        escrow: ethers.constants.AddressZero,
      }

      const Tokens: Manager.TokensStruct = {
        mgt: ethers.constants.AddressZero,
        ecu: ethers.constants.AddressZero,
        nrgs: ethers.constants.AddressZero,
        nrgop: ethers.constants.AddressZero,
      }

      const Values: Manager.ValuesStruct = {
        rewardAmount: 0,
        fees: 0,
      }

      await expect(manager.connect(otherAcc).changeContracts(Contracts)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeTokensAddresses(Tokens)).to.be.revertedWith(errorMsg);
      await expect(manager.connect(otherAcc).changeValues(Values)).to.be.revertedWith(errorMsg);
    });
  });
});

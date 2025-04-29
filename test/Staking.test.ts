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
  StakingReward,
} from '../typechain';

describe.only('Staking', function () {
  let admin_role: BigNumber,
    minter_role: BigNumber,
    burner_role: BigNumber,
    staking_role: BigNumber,
    register_role: BigNumber;
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

    const StakingReward: ContractFactory = await ethers.getContractFactory('StakingReward');
    const staking: StakingReward = (await StakingReward.deploy(main.address)) as StakingReward;
    await staking.deployed();

    minter_role = await mgt.MINTER_ROLE();
    burner_role = await mgt.BURNER_ROLE();

    const Contracts: Main.ContractsStruct = {
      staking: staking.address,
      oracle: deployer.address,
      escrow: deployer.address,
      register: deployer.address,
    };

    // Required for deployment
    await main.changeContracts(Contracts);
    await mgt.setRole(staking.address, minter_role, true);

    return {
      nrgct,
      mgt,
      nrgpt,
      nrgst,
      nrgopt,
      elct,
      main,
      staking,
      usdc,
      deployer,
      otherAcc,
    };
  }

  it('Deployed correctly', async () => {
    const { nrgct, mgt, nrgpt, nrgst, nrgopt, elct, main, staking } = await loadFixture(deployFixture);

    expect(nrgct.address).to.be.properAddress;
    expect(mgt.address).to.be.properAddress;
    expect(nrgpt.address).to.be.properAddress;
    expect(nrgst.address).to.be.properAddress;
    expect(nrgopt.address).to.be.properAddress;
    expect(elct.address).to.be.properAddress;
    expect(main.address).to.be.properAddress;
    expect(staking.address).to.be.properAddress;
  });

  it('enterStakingProducer', async () => {
    const { staking, nrgpt, otherAcc } = await loadFixture(deployFixture);

    const producerId = 25;

    await nrgpt.mint(otherAcc.address, producerId);

    await expect(staking.connect(otherAcc).enterStakingProducer(producerId)).to.be.revertedWithCustomError(
      staking,
      'OnlyRegister',
    );

    const enter = await staking.enterStakingProducer(producerId);

    expect(enter).to.emit(staking, 'EnterStakingProducer');
    expect(await staking.totalProducers()).to.equal(1);
    expect((await staking.producers(producerId)).updatedAt).to.be.gt(0);
    expect((await staking.producers(producerId)).pendingReward).to.be.eq(0);

    await time.increase(1000);
  });

  it('updateProducerInfo', async () => {
    const { staking, nrgpt, otherAcc, deployer } = await loadFixture(deployFixture);

    const producerId = 25;

    await nrgpt.mint(otherAcc.address, producerId);
    await nrgpt.mint(deployer.address, producerId + 1);

    await staking.enterStakingProducer(producerId);

    const lastUpdatedAt = (await staking.producers(producerId)).updatedAt;

    await expect(staking.updateProducerInfo(ethers.constants.AddressZero, producerId)).to.be.revertedWithCustomError(
      staking,
      'ZeroAddressPassed',
    );
    await expect(staking.updateProducerInfo(deployer.address, producerId))
      .to.be.revertedWithCustomError(staking, 'IncorrectProducer')
      .withArgs(deployer.address, producerId);
    await expect(staking.updateProducerInfo(deployer.address, producerId + 1))
      .to.be.revertedWithCustomError(staking, 'ProducerNotEnteredStaking')
      .withArgs(producerId + 1);

    const increaseTo = (await time.latest()) + 1000;
    await time.increaseTo(increaseTo);

    await staking.updateProducerInfo(otherAcc.address, producerId);

    const currentTime = increaseTo + 1;
    const elapsed = BigNumber.from(currentTime).sub(lastUpdatedAt);
    const reward = elapsed.mul(ethers.utils.parseEther('0.05')).div(1);

    expect((await staking.producers(producerId)).updatedAt).to.equal(currentTime);
    expect((await staking.producers(producerId)).pendingReward).to.equal(reward);
  });

  it('getProducerRewards', async () => {
    const { staking, nrgpt, mgt, otherAcc, deployer } = await loadFixture(deployFixture);

    const producerId = 25;

    await nrgpt.mint(otherAcc.address, producerId);
    await nrgpt.mint(deployer.address, producerId + 1);

    await staking.enterStakingProducer(producerId);

    const lastUpdatedAt = (await staking.producers(producerId)).updatedAt;

    await expect(staking.getProducerRewards(producerId))
      .to.be.revertedWithCustomError(staking, 'IncorrectProducer')
      .withArgs(deployer.address, producerId);
    await expect(staking.getProducerRewards(producerId + 1))
      .to.be.revertedWithCustomError(staking, 'ProducerNotEnteredStaking')
      .withArgs(producerId + 1);

    const increaseTo = (await time.latest()) + 1000;
    await time.increaseTo(increaseTo);

    const getRewards = await staking.connect(otherAcc).getProducerRewards(producerId);

    const currentTime = increaseTo + 1;
    const elapsed = BigNumber.from(currentTime).sub(lastUpdatedAt);
    const reward = elapsed.mul(ethers.utils.parseEther('0.05')).div(1);

    expect(getRewards).to.emit(staking, 'RewardSentProducer').withArgs(otherAcc.address, reward);
    expect((await staking.producers(producerId)).updatedAt).to.equal(currentTime);
    expect((await staking.producers(producerId)).pendingReward).to.equal(0);
    expect(await mgt.balanceOf(otherAcc.address)).to.equal(reward);
  });

  it('exitStakingProducer', async () => {
    const { staking, nrgpt, mgt, otherAcc, deployer } = await loadFixture(deployFixture);

    const producerId = 25;

    await nrgpt.mint(otherAcc.address, producerId);

    await staking.enterStakingProducer(producerId);

    const lastUpdatedAt = (await staking.producers(producerId)).updatedAt;

    await expect(staking.connect(otherAcc).exitStakingProducer(producerId)).to.be.revertedWithCustomError(
      staking,
      'OnlyRegister',
    );

    await expect(staking.exitStakingProducer(producerId + 1))
      .to.be.revertedWithCustomError(staking, 'ProducerNotEnteredStaking')
      .withArgs(producerId + 1);

    const increaseTo = (await time.latest()) + 1000;
    await time.increaseTo(increaseTo);

    const exit = await staking.exitStakingProducer(producerId);

    const currentTime = increaseTo + 1;
    const elapsed = BigNumber.from(currentTime).sub(lastUpdatedAt);
    const reward = elapsed.mul(ethers.utils.parseEther('0.05')).div(1);

    expect(exit).to.emit(staking, 'ExitStakingProducer');
    expect(await staking.totalProducers()).to.equal(0);
    expect((await staking.producers(producerId)).updatedAt).to.equal(0);
    expect((await staking.producers(producerId)).pendingReward).to.equal(0);
    expect(await mgt.balanceOf(otherAcc.address)).to.equal(reward);
  });
});

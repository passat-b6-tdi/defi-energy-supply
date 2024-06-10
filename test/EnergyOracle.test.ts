import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { EnergyOracle, EscrowMock, MCGR, Manager, Register, StakingReward } from '../typechain';
import { ELU } from '../typechain/contracts/tokens/ERC1155/ELU';
import { NRGS } from '../typechain/contracts/tokens/ERC721/NRGS';

describe('EnergyOracle', function () {
  let otherAccAddress: string;
  let admin_role: string,
    minter_role: string,
    burner_role: string,
    energy_oracle_manager: string,
    oracle_provider: string,
    escrow_role: string;
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

    const EnergyOracle: ContractFactory = await ethers.getContractFactory('EnergyOracle');
    const energyOracle: EnergyOracle = (await EnergyOracle.deploy(manager.address)) as EnergyOracle;
    await energyOracle.deployed();

    const EscrowMock: ContractFactory = await ethers.getContractFactory('EscrowMock');
    const escrow: EscrowMock = (await EscrowMock.deploy(energyOracle.address)) as EscrowMock;
    await escrow.deployed();

    admin_role = await mcgr.DEFAULT_ADMIN_ROLE();
    minter_role = await mcgr.MINTER_BURNER_ROLE();

    energy_oracle_manager = await energyOracle.ENERGY_ORACLE_MANAGER_ROLE();
    oracle_provider = await energyOracle.ENERGY_ORACLE_PROVIDER_ROLE();
    escrow_role = await energyOracle.ESCROW();

    await energyOracle.grantRole(escrow_role, deployer.address);
    await energyOracle.grantRole(escrow_role, escrow.address);
    await mcgr.grantRole(minter_role, energyOracle.address);

    return { mcgr, elu, ELU, nrgs, NRGS, manager, energyOracle, EnergyOracle, escrow, deployer, otherAcc };
  }

  it('Deployed correctly', async () => {
    const { mcgr, elu, nrgs, energyOracle, manager, deployer } = await loadFixture(deployFixture);

    expect(mcgr.address).to.be.properAddress;
    expect(nrgs.address).to.be.properAddress;
    expect(elu.address).to.be.properAddress;
    expect(energyOracle.address).to.be.properAddress;
    expect(energyOracle.address).to.be.properAddress;

    expect(await mcgr.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await mcgr.hasRole(minter_role, deployer.address)).to.be.true;
    expect(await mcgr.hasRole(minter_role, energyOracle.address)).to.be.true;

    expect(await energyOracle.hasRole(escrow_role, deployer.address)).to.be.true;
    expect(await energyOracle.hasRole(oracle_provider, deployer.address)).to.be.true;
    expect(await energyOracle.hasRole(energy_oracle_manager, deployer.address)).to.be.true;
  });

  describe('Registers', function () {
    it('ORACLE_PROVIDER can record consumption', async () => {
      const { energyOracle, elu, deployer, mcgr } = await loadFixture(deployFixture);

      await elu.mint(deployer.address, 10, deployer.address);

      const balBefore = await mcgr.balanceOf(deployer.address);
      expect(balBefore).to.eq(0);

      const timestamp = (await time.latest()) - 100;
      const user = deployer.address;
      const tokenId = 10;
      const consumption = 20;

      const record = await energyOracle.recordEnergyConsumption(user, tokenId, timestamp, consumption);
      const userTokenConsumptions = await energyOracle.energyConsumptions(user, tokenId, 0);

      const balAfter = await mcgr.balanceOf(deployer.address);
      expect(balAfter).to.eq(20);

      expect(record).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions.timestamp).to.equal(timestamp);
      expect(userTokenConsumptions.consumption).to.equal(consumption);
    });

    it('ESCROW can read and delete consumption', async () => {
      const { energyOracle, elu, deployer, escrow, mcgr } = await loadFixture(deployFixture);

      await elu.mint(deployer.address, 10, deployer.address);

      const balBefore = await mcgr.balanceOf(deployer.address);
      expect(balBefore).to.eq(0);

      const timestamp = (await time.latest()) - 100;
      const user = deployer.address;
      const tokenId = 10;
      const consumption = 20;

      const record = await energyOracle.recordEnergyConsumption(user, tokenId, timestamp, consumption);
      let userTokenConsumptions = await energyOracle.energyConsumptions(user, tokenId, 0);

      const balAfter = await mcgr.balanceOf(deployer.address);
      expect(balAfter).to.eq(20);

      expect(record).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions.timestamp).to.equal(timestamp);
      expect(userTokenConsumptions.consumption).to.equal(consumption);

      let read = await escrow.read(user, tokenId);

      expect(read).to.emit(energyOracle, 'EnergyConsumptionSent');

      let consumptions = await escrow.consumption();

      expect(consumptions).to.be.eq(consumption);

      await escrow.read(user, tokenId);

      consumptions = await escrow.consumption();

      expect(consumptions).to.be.eq(0);

      await expect(energyOracle.energyConsumptions(user, tokenId, 0)).to.be.reverted;
    });

    it('Multiple ORACLE_PROVIDERs can record consumption', async () => {
      const { energyOracle, elu, deployer, mcgr } = await loadFixture(deployFixture);

      await elu.mint(deployer.address, 10, deployer.address);

      const balBefore = await mcgr.balanceOf(deployer.address);
      expect(balBefore).to.eq(0);

      const timestamp = (await time.latest()) - 100;
      const user = deployer.address;
      const tokenId = 10;
      const consumption = 20;

      const record1 = await energyOracle.recordEnergyConsumption(user, tokenId, timestamp, consumption);
      const userTokenConsumptions1 = await energyOracle.energyConsumptions(user, tokenId, 0);

      let balAfter = await mcgr.balanceOf(deployer.address);
      expect(balAfter).to.eq(20);

      expect(record1).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions1.timestamp).to.equal(timestamp);
      expect(userTokenConsumptions1.consumption).to.equal(consumption);

      const record2 = await energyOracle.recordEnergyConsumption(user, tokenId, timestamp + 50, consumption + 5);
      const userTokenConsumptions2 = await energyOracle.energyConsumptions(user, tokenId, 0);

      balAfter = await mcgr.balanceOf(deployer.address);
      expect(balAfter).to.eq(40);

      expect(record2).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions2.timestamp).to.equal(timestamp + 50);
      expect(userTokenConsumptions2.consumption).to.equal(consumption + 2);

      const record3 = await energyOracle.recordEnergyConsumption(user, tokenId, timestamp + 50, consumption);
      const userTokenConsumptions3 = await energyOracle.energyConsumptions(user, tokenId, 0);

      balAfter = await mcgr.balanceOf(deployer.address);
      expect(balAfter).to.eq(60);

      expect(record3).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions3.timestamp).to.equal(timestamp + 50);
      expect(userTokenConsumptions3.consumption).to.equal(consumption + 1);

      const record4 = await energyOracle.recordEnergyConsumption(user, tokenId, timestamp + 50, consumption - 4);
      const userTokenConsumptions4 = await energyOracle.energyConsumptions(user, tokenId, 0);

      balAfter = await mcgr.balanceOf(deployer.address);
      expect(balAfter).to.eq(80);

      expect(record4).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions4.timestamp).to.equal(timestamp + 50);
      expect(userTokenConsumptions4.consumption).to.equal(consumption - 2);
    });
  });

  describe('Errors', function () {
    it('Multiple ORACLE_PROVIDERs need to record consumprtion within the acceptable range', async () => {
      const { energyOracle, elu, deployer, mcgr } = await loadFixture(deployFixture);

      await elu.mint(deployer.address, 10, deployer.address);

      const balBefore = await mcgr.balanceOf(deployer.address);
      expect(balBefore).to.eq(0);

      const timestamp = (await time.latest()) - 100;
      const user = deployer.address;
      const tokenId = 10;
      const consumption = 20;

      const record1 = await energyOracle.recordEnergyConsumption(user, tokenId, timestamp, consumption);
      const userTokenConsumptions1 = await energyOracle.energyConsumptions(user, tokenId, 0);

      let balAfter = await mcgr.balanceOf(deployer.address);
      expect(balAfter).to.eq(20);

      expect(record1).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions1.timestamp).to.equal(timestamp);
      expect(userTokenConsumptions1.consumption).to.equal(consumption);

      await expect(energyOracle.recordEnergyConsumption(user, tokenId, timestamp + 50, consumption + 10)).to.be.revertedWith(
        'EnergyOracle: Previous value is not within acceptable range',
      );
    });

    it('Only ENERGY_ORACLE_PROVIDER_ROLE can record energy consumption', async () => {
      const { energyOracle, otherAcc } = await loadFixture(deployFixture);
      const error = `AccessControl: account ${otherAccAddress} is missing role ${oracle_provider}`;

      await expect(energyOracle.connect(otherAcc).recordEnergyConsumption(otherAcc.address, 1, 50, 10)).to.be.revertedWith(
        error,
      );
    });

    it('Only ENERGY_ORACLE_MANAGER_ROLE can pause/unpause', async () => {
      const { energyOracle, otherAcc } = await loadFixture(deployFixture);

      const error = `AccessControl: account ${otherAccAddress} is missing role ${energy_oracle_manager}`;

      await expect(energyOracle.connect(otherAcc).pause()).to.be.revertedWith(error);

      await expect(energyOracle.connect(otherAcc).unpause()).to.be.revertedWith(error);
    });

    it('Only ESCROW can get energy consumption', async () => {
      const { energyOracle, otherAcc } = await loadFixture(deployFixture);
      const error = `AccessControl: account ${otherAccAddress} is missing role ${escrow_role}`;

      await expect(
        energyOracle.connect(otherAcc).updateEnergyConsumptionsAndGetResult(otherAcc.address, 1),
      ).to.be.revertedWith(error);
    });

    it('Zero address checks', async () => {
      const { energyOracle } = await loadFixture(deployFixture);
      const error = 'Parent: account is address 0';
      const address0 = ethers.constants.AddressZero;

      await expect(energyOracle.recordEnergyConsumption(address0, 1, 50, 10)).to.be.revertedWith(error);
      await expect(energyOracle.updateEnergyConsumptionsAndGetResult(address0, 1)).to.be.revertedWith(error);
    });

    it('Pausable', async () => {
      const { energyOracle, elu } = await loadFixture(deployFixture);

      await elu.mint(otherAccAddress, 1, otherAccAddress);

      const error = 'Pausable: paused';

      await energyOracle.recordEnergyConsumption(otherAccAddress, 1, 50, 10);
      await energyOracle.updateEnergyConsumptionsAndGetResult(otherAccAddress, 1);

      await energyOracle.pause();

      await expect(energyOracle.recordEnergyConsumption(otherAccAddress, 1, 50, 10)).to.be.revertedWith(error);
      await expect(energyOracle.updateEnergyConsumptionsAndGetResult(otherAccAddress, 1)).to.be.revertedWith(error);

      await energyOracle.unpause();

      await energyOracle.recordEnergyConsumption(otherAccAddress, 1, 50, 10);
      await energyOracle.updateEnergyConsumptionsAndGetResult(otherAccAddress, 1);
    });

    it('Only correct user can be recorded', async () => {
      const { energyOracle, elu } = await loadFixture(deployFixture);

      await elu.mint(otherAccAddress, 1, otherAccAddress);

      const error = 'EnergyOracle: user is not correct';

      await expect(energyOracle.recordEnergyConsumption(otherAccAddress, 2, 50, 10)).to.be.revertedWith(error);
      await expect(energyOracle.updateEnergyConsumptionsAndGetResult(otherAccAddress, 2)).to.be.revertedWith(error);
    });

    it('Only correct timestamp for record accepted', async () => {
      const { energyOracle, elu } = await loadFixture(deployFixture);

      await elu.mint(otherAccAddress, 1, otherAccAddress);

      const error = 'EnergyOracle: timestamp has not yet arrived';

      const timestamp = (await time.latest()) + 100;

      await expect(energyOracle.recordEnergyConsumption(otherAccAddress, 1, timestamp, 10)).to.be.revertedWith(error);
    });
  });
});

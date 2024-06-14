import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { EnergyOracle, EscrowMock, MGT, Manager, Register, StakingReward } from '../typechain';
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

    const MGT: ContractFactory = await ethers.getContractFactory('MGT');
    const MGT: MGT = (await MGT.deploy()) as MGT;
    await MGT.deployed();

    const NRGS: ContractFactory = await ethers.getContractFactory('NRGS');
    const nrgs: NRGS = (await NRGS.deploy()) as NRGS;
    await nrgs.deployed();

    const ELU: ContractFactory = await ethers.getContractFactory('ELU');
    const elu: ELU = (await ELU.deploy()) as ELU;
    await elu.deployed();

    const Manager: ContractFactory = await ethers.getContractFactory('Manager');
    const manager: Manager = (await Manager.deploy(
      MGT.address,
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

    admin_role = await MGT.DEFAULT_ADMIN_ROLE();
    minter_role = await MGT.MINTER_BURNER_ROLE();

    energy_oracle_manager = await energyOracle.ENERGY_ORACLE_MANAGER_ROLE();
    oracle_provider = await energyOracle.ENERGY_ORACLE_PROVIDER_ROLE();
    escrow_role = await energyOracle.ESCROW();

    await energyOracle.grantRole(escrow_role, deployer.address);
    await energyOracle.grantRole(escrow_role, escrow.address);
    await MGT.grantRole(minter_role, energyOracle.address);

    return { MGT, elu, ELU, nrgs, NRGS, manager, energyOracle, EnergyOracle, escrow, deployer, otherAcc };
  }

  it('Deployed correctly', async () => {
    const { MGT, elu, nrgs, energyOracle, manager, deployer } = await loadFixture(deployFixture);

    expect(MGT.address).to.be.properAddress;
    expect(nrgs.address).to.be.properAddress;
    expect(elu.address).to.be.properAddress;
    expect(energyOracle.address).to.be.properAddress;
    expect(energyOracle.address).to.be.properAddress;

    expect(await MGT.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await MGT.hasRole(minter_role, deployer.address)).to.be.true;
    expect(await MGT.hasRole(minter_role, energyOracle.address)).to.be.true;

    expect(await energyOracle.hasRole(escrow_role, deployer.address)).to.be.true;
    expect(await energyOracle.hasRole(oracle_provider, deployer.address)).to.be.true;
    expect(await energyOracle.hasRole(energy_oracle_manager, deployer.address)).to.be.true;
  });

  describe('Registers', function () {
    it('ORACLE_PROVIDER can record consumption', async () => {
      const { energyOracle, elu, deployer, MGT } = await loadFixture(deployFixture);

      await elu.mint(deployer.address, 10, deployer.address);

      const balBefore = await MGT.balanceOf(deployer.address);
      expect(balBefore).to.eq(0);

      const timestamp = (await time.latest()) - 100;
      const user = deployer.address;
      const tokenId = 10;
      const consumption = 20;

      const record = await energyOracle.recordEnergyConsumption(user, tokenId, consumption);
      const userTokenConsumptions = await energyOracle.energyConsumptions(user, tokenId);

      const balAfter = await MGT.balanceOf(deployer.address);
      expect(balAfter).to.eq(20);

      expect(record).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions).to.equal(consumption);
    });

    it('ESCROW can read and delete consumption', async () => {
      const { energyOracle, elu, deployer, escrow, MGT } = await loadFixture(deployFixture);

      await elu.mint(deployer.address, 10, deployer.address);

      const balBefore = await MGT.balanceOf(deployer.address);
      expect(balBefore).to.eq(0);

      const timestamp = (await time.latest()) - 100;
      const user = deployer.address;
      const tokenId = 10;
      const consumption = 20;

      const record = await energyOracle.recordEnergyConsumption(user, tokenId, consumption);
      let userTokenConsumptions = await energyOracle.energyConsumptions(user, tokenId);

      const balAfter = await MGT.balanceOf(deployer.address);
      expect(balAfter).to.eq(20);

      expect(record).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions).to.equal(consumption);

      let read = await escrow.read(user, tokenId);

      expect(read).to.emit(energyOracle, 'EnergyConsumptionSent');

      let consumptions = await escrow.consumption();

      expect(consumptions).to.be.eq(consumption);

      await escrow.read(user, tokenId);

      consumptions = await escrow.consumption();

      expect(consumptions).to.be.eq(consumption);
    });

    it('Multiple ORACLE_PROVIDERs can record consumption', async () => {
      const { energyOracle, elu, deployer, MGT } = await loadFixture(deployFixture);

      await elu.mint(deployer.address, 10, deployer.address);

      const balBefore = await MGT.balanceOf(deployer.address);
      expect(balBefore).to.eq(0);

      const timestamp = (await time.latest()) - 100;
      const user = deployer.address;
      const tokenId = 10;
      const consumption = 20;

      const record1 = await energyOracle.recordEnergyConsumption(user, tokenId, consumption);
      const userTokenConsumptions1 = await energyOracle.energyConsumptions(user, tokenId);

      let balAfter = await MGT.balanceOf(deployer.address);
      expect(balAfter).to.eq(20);

      expect(record1).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions1).to.equal(consumption);

      const record2 = await energyOracle.recordEnergyConsumption(user, tokenId, consumption + 5);
      const userTokenConsumptions2 = await energyOracle.energyConsumptions(user, tokenId);

      balAfter = await MGT.balanceOf(deployer.address);
      expect(balAfter).to.eq(40);

      expect(record2).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions2).to.equal(consumption + 5);

      const record3 = await energyOracle.recordEnergyConsumption(user, tokenId, consumption);
      const userTokenConsumptions3 = await energyOracle.energyConsumptions(user, tokenId);

      balAfter = await MGT.balanceOf(deployer.address);
      expect(balAfter).to.eq(60);

      expect(record3).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions3).to.equal(consumption);

      const record4 = await energyOracle.recordEnergyConsumption(user, tokenId, consumption - 4);
      const userTokenConsumptions4 = await energyOracle.energyConsumptions(user, tokenId);

      balAfter = await MGT.balanceOf(deployer.address);
      expect(balAfter).to.eq(80);

      expect(record4).to.emit(energyOracle, 'EnergyConsumptionRecorded');
      expect(userTokenConsumptions4).to.equal(consumption - 4);
    });
  });

  describe('Errors', function () {
    it('Only ENERGY_ORACLE_PROVIDER_ROLE can record energy consumption', async () => {
      const { energyOracle, otherAcc } = await loadFixture(deployFixture);
      const error = `AccessControl: account ${otherAccAddress} is missing role ${oracle_provider}`;

      await expect(
        energyOracle.connect(otherAcc).recordEnergyConsumption(otherAcc.address, 1, 10),
      ).to.be.revertedWith(error);
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
        energyOracle.connect(otherAcc).updateEnergyConsumptions(otherAcc.address, 1),
      ).to.be.revertedWith(error);
    });

    it('Zero address checks', async () => {
      const { energyOracle } = await loadFixture(deployFixture);
      const error = 'Parent: account is address 0';
      const address0 = ethers.constants.AddressZero;

      await expect(energyOracle.recordEnergyConsumption(address0, 1, 10)).to.be.revertedWith(error);
      await expect(energyOracle.updateEnergyConsumptions(address0, 1)).to.be.revertedWith(error);
    });

    it('Pausable', async () => {
      const { energyOracle, elu } = await loadFixture(deployFixture);

      await elu.mint(otherAccAddress, 1, otherAccAddress);

      const error = 'Pausable: paused';

      await energyOracle.recordEnergyConsumption(otherAccAddress, 1, 10);
      await energyOracle.updateEnergyConsumptions(otherAccAddress, 1);

      await energyOracle.pause();

      await expect(energyOracle.recordEnergyConsumption(otherAccAddress, 1, 10)).to.be.revertedWith(error);
      await expect(energyOracle.updateEnergyConsumptions(otherAccAddress, 1)).to.be.revertedWith(error);

      await energyOracle.unpause();

      await energyOracle.recordEnergyConsumption(otherAccAddress, 1, 10);
      await energyOracle.updateEnergyConsumptions(otherAccAddress, 1);
    });

    it('Only correct user can be recorded', async () => {
      const { energyOracle, elu } = await loadFixture(deployFixture);

      await elu.mint(otherAccAddress, 1, otherAccAddress);

      const error = 'EnergyOracle: user is not correct';

      await expect(energyOracle.recordEnergyConsumption(otherAccAddress, 2, 10)).to.be.revertedWith(error);
      await expect(energyOracle.updateEnergyConsumptions(otherAccAddress, 2)).to.be.revertedWith(error);
    });
  });
});

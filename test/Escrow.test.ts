import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Escrow, MGT, Manager, OracleMock, MainMock, NRGOP, ECU, NRGS } from '../typechain';

describe('Escrow', function () {
  let otherAccAddress: string;
  let admin_role: string, minter_role: string, escrow_manager: string;
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

    const OracleMock: ContractFactory = await ethers.getContractFactory('OracleMock');
    const energyOracle: OracleMock = (await OracleMock.deploy()) as OracleMock;
    await energyOracle.deployed();

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

    const Contracts: Manager.ContractsStruct = {
      oracle: energyOracle.address,
      staking: ethers.constants.AddressZero,
      register: ethers.constants.AddressZero,
      escrow: ethers.constants.AddressZero,
    }

    await manager.changeContracts(Contracts);

    const Escrow: ContractFactory = await ethers.getContractFactory('Escrow');
    const escrow: Escrow = (await Escrow.deploy(manager.address)) as Escrow;
    await escrow.deployed();

    const MainMock: ContractFactory = await ethers.getContractFactory('MainMock');
    const main: MainMock = (await MainMock.deploy(escrow.address, mgt.address)) as MainMock;
    await main.deployed();

    admin_role = await mgt.DEFAULT_ADMIN_ROLE();
    minter_role = await mgt.MINTER_BURNER_ROLE();

    escrow_manager = await escrow.ESCROW_MANAGER_ROLE();

    await escrow.grantRole(escrow_manager, main.address);

    return { mgt, ecu, ECU_Factory, nrgs, NRGS_Factory, manager, escrow, main, energyOracle, deployer, otherAcc };
  }

  it('Deployed correctly', async () => {
    const { mgt, ecu, nrgs, escrow, main, deployer } = await loadFixture(deployFixture);

    expect(mgt.address).to.be.properAddress;
    expect(nrgs.address).to.be.properAddress;
    expect(ecu.address).to.be.properAddress;
    expect(escrow.address).to.be.properAddress;

    expect(await mgt.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await mgt.hasRole(minter_role, deployer.address)).to.be.true;
    expect(await escrow.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await escrow.hasRole(escrow_manager, deployer.address)).to.be.true;
    expect(await escrow.hasRole(escrow_manager, main.address)).to.be.true;
  });

  it('ESCROW_MANAGER_ROLE can send to supplier, feeReceiver funds', async () => {
    const { escrow, ecu, deployer, otherAcc, main, nrgs, mgt } = await loadFixture(deployFixture);

    await nrgs.mint(deployer.address, 10);

    await mgt.mint(otherAcc.address, 1000);
    await mgt.connect(otherAcc).approve(escrow.address, 1000);

    const balBefore = await mgt.balanceOf(otherAcc.address);
    expect(balBefore).to.eq(1000);

    await ecu.mint(otherAcc.address, 10, deployer.address);

    const EnergyConsumption = 555;
    const fees = 10;
    const needToBePaid = EnergyConsumption + fees;

    const sending = await main.send(otherAcc.address, 10, needToBePaid);

    const balAfter = await mgt.balanceOf(otherAcc.address);
    expect(balAfter).to.eq(1000 - (EnergyConsumption + fees));

    expect(sending).to.emit(escrow, 'PaidForEnergy');
    expect(sending).to.changeTokenBalances(mgt, [otherAcc, deployer], [-needToBePaid, needToBePaid]);
  });

  it('Remaining amount will be sent back', async () => {
    const { escrow, ecu, deployer, otherAcc, main, nrgs, mgt } = await loadFixture(deployFixture);

    await nrgs.mint(deployer.address, 10);
    await mgt.mint(otherAcc.address, 1000);
    await mgt.connect(otherAcc).approve(escrow.address, 1000);

    const balBefore = await mgt.balanceOf(otherAcc.address);
    expect(balBefore).to.eq(1000);

    await ecu.mint(otherAcc.address, 10, deployer.address);

    const EnergyConsumption = 555;
    const fees = 10;
    const needToBePaid = EnergyConsumption + fees;

    const sending = await main.send(otherAcc.address, 10, needToBePaid + 10);

    const balAfter = await mgt.balanceOf(otherAcc.address);
    expect(balAfter).to.eq(1000 - (EnergyConsumption + fees));

    expect(sending).to.emit(escrow, 'PaidForEnergy');
    expect(sending).to.changeTokenBalances(mgt, [otherAcc, deployer], [-needToBePaid, needToBePaid]);
  });

  describe('Errors', function () {
    it('Only ESCROW_MANAGER_ROLE', async () => {
      const { escrow, deployer, otherAcc } = await loadFixture(deployFixture);

      const error = `AccessControl: account ${otherAccAddress} is missing role ${escrow_manager}`;
      await expect(escrow.connect(otherAcc).sendFundsToSupplier(otherAcc.address, 10)).to.be.revertedWith(error);
    });

    it('Zero address checks', async () => {
      const { escrow, deployer } = await loadFixture(deployFixture);
      const error = 'ERC1155: address zero is not a valid owner';
      const address0 = ethers.constants.AddressZero;

      await expect(escrow.sendFundsToSupplier(address0, 10)).to.be.revertedWith(error);
    });

    it('User needs to be correctly connected to supplier', async () => {
      const { escrow, deployer, otherAcc, nrgs } = await loadFixture(deployFixture);
      const error = 'IncorrectConsumer';

      await nrgs.mint(deployer.address, 10);

      await expect(escrow.sendFundsToSupplier(deployer.address, 10)).to.be.revertedWithCustomError(escrow, error);
    });
  });
});

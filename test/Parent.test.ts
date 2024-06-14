import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { ParentMock, Manager, MGT } from '../typechain';
import { ELU } from '../typechain/contracts/tokens/ERC1155/ELU';
import { NRGS } from '../typechain/contracts/tokens/ERC721/NRGS';

describe('Parent', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [deployer, otherAcc] = await ethers.getSigners();

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
    const manager1: Manager = (await Manager.deploy(
      MGT.address,
      elu.address,
      nrgs.address,
      deployer.address,
      10,
      5,
      10,
    )) as Manager;
    await manager1.deployed();

    const manager2: Manager = (await Manager.deploy(
      MGT.address,
      elu.address,
      nrgs.address,
      deployer.address,
      10,
      5,
      10,
    )) as Manager;
    await manager2.deployed();

    const ParentMock: ContractFactory = await ethers.getContractFactory('ParentMock');
    const parent: ParentMock = (await ParentMock.deploy(manager1.address)) as ParentMock;
    await parent.deployed();

    return { manager1, manager2, parent, otherAcc };
  }

  it('Works correctly', async () => {
    const { manager1, manager2, parent } = await loadFixture(deployFixture);

    expect(await parent.manager()).to.be.eq(manager1.address);

    await parent.changeManager(manager2.address);

    expect(await parent.manager()).to.be.eq(manager2.address);
  });

  it('Modifiers correct', async () => {
    const { otherAcc, parent, manager2 } = await loadFixture(deployFixture);

    const errorMsg1 = 'Parent: account is address 0';
    const errorMsg2 = `AccessControl: account ${otherAcc.address.toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`;

    await expect(parent.changeManager(ethers.constants.AddressZero)).to.be.revertedWith(errorMsg1);

    await expect(parent.connect(otherAcc).changeManager(manager2.address)).to.be.revertedWith(errorMsg2);
  });
});

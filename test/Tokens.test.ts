import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { MGT } from '../typechain';
import { ELU } from '../typechain/contracts/tokens/ERC1155/ELU';
import { NRGS } from '../typechain/contracts/tokens/ERC721/NRGS';

describe(`Tokens`, function () {
  let otherAccAddress: string;
  let admin_role: string, minter_role: string, register_role: string;
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const [deployer, otherAcc] = await ethers.getSigners();

    otherAccAddress = otherAcc.address.toLowerCase();

    const MGT: ContractFactory = await ethers.getContractFactory(`MGT`);
    const MGT: MGT = (await MGT.deploy()) as MGT;
    await MGT.deployed();

    const ELU: ContractFactory = await ethers.getContractFactory(`ELU`);
    const elu: ELU = (await ELU.deploy()) as ELU;
    await elu.deployed();

    const NRGS: ContractFactory = await ethers.getContractFactory(`NRGS`);
    const nrgs: NRGS = (await NRGS.deploy()) as NRGS;
    await nrgs.deployed();

    admin_role = await MGT.DEFAULT_ADMIN_ROLE();
    minter_role = await MGT.MINTER_BURNER_ROLE();

    register_role = await nrgs.REGISTER_ROLE();

    return { MGT, elu, nrgs, deployer, otherAcc };
  }

  it('Deployed correctly', async () => {
    const { MGT, elu, nrgs, deployer } = await loadFixture(deployFixture);

    expect(MGT.address).to.be.properAddress;
    expect(elu.address).to.be.properAddress;
    expect(nrgs.address).to.be.properAddress;

    expect(await MGT.name()).to.be.eq(`Mictrogrid Token`);
    expect(await MGT.symbol()).to.be.eq(`MGT`);

    expect(await elu.name()).to.be.eq(`Electricity Users Token`);
    expect(await elu.symbol()).to.be.eq(`ELU`);

    expect(await nrgs.name()).to.be.eq(`Energy Supplier Token`);
    expect(await nrgs.symbol()).to.be.eq(`NRGS`);

    expect(await MGT.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await MGT.hasRole(minter_role, deployer.address)).to.be.true;

    expect(await elu.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await elu.hasRole(register_role, deployer.address)).to.be.true;

    expect(await nrgs.hasRole(admin_role, deployer.address)).to.be.true;
    expect(await nrgs.hasRole(register_role, deployer.address)).to.be.true;
  });

  describe(`MGT`, function () {
    it('MGT can be minted and burner only by mint_burn manager', async () => {
      const { MGT, otherAcc } = await loadFixture(deployFixture);

      await expect(MGT.connect(otherAcc).mint(otherAcc.address, 10)).to.be.revertedWith(
        `AccessControl: account ${otherAccAddress} is missing role ${minter_role}`,
      );
      expect(await MGT.mint(otherAcc.address, 10)).to.changeTokenBalance(MGT, otherAcc, 10);

      await expect(MGT.connect(otherAcc).burn(otherAcc.address, 10)).to.be.revertedWith(
        `AccessControl: account ${otherAccAddress} is missing role ${minter_role}`,
      );
      expect(await MGT.burn(otherAcc.address, 10)).to.changeTokenBalance(MGT, otherAcc, -10);
    });
  });

  describe(`NRGS`, function () {
    it('NRGS can be minted only by register manager', async () => {
      const { nrgs, otherAcc } = await loadFixture(deployFixture);

      await expect(nrgs.connect(otherAcc).mint(otherAcc.address, 0)).to.be.revertedWith(
        `AccessControl: account ${otherAccAddress} is missing role ${register_role}`,
      );
      expect(await nrgs.mint(otherAcc.address, 0)).to.changeTokenBalance(nrgs, otherAcc, 1);
    });

    it('NRGS can be burned only by register manager', async () => {
      const { nrgs, otherAcc } = await loadFixture(deployFixture);

      await nrgs.mint(otherAcc.address, 0);

      await expect(nrgs.connect(otherAcc).burn(0)).to.be.revertedWith(
        `AccessControl: account ${otherAccAddress} is missing role ${register_role}`,
      );
      expect(await nrgs.burn(0)).to.changeTokenBalance(nrgs, otherAcc, -1);
    });
  });

  describe(`ELU`, function () {
    it('ELU can add user to supplier', async () => {
      const { elu, otherAcc, deployer } = await loadFixture(deployFixture);

      await elu.mint(otherAcc.address, 0, 10);
      expect(await elu.balanceOf(otherAcc.address, 0)).to.eq(10);
    });

    it('ELU can be minted only by register manager', async () => {
      const { elu, otherAcc } = await loadFixture(deployFixture);

      await expect(elu.connect(otherAcc).mint(otherAcc.address, 0, 10)).to.be.revertedWith(
        `AccessControl: account ${otherAccAddress} is missing role ${register_role}`,
      );

      await elu.mint(otherAcc.address, 0, 10);
      expect(await elu.balanceOf(otherAcc.address, 0)).to.eq(10);
    });

    it('ELU can be burned only by register manager', async () => {
      const { elu, otherAcc } = await loadFixture(deployFixture);

      await elu.mint(otherAcc.address, 0, 10);
      expect(await elu.balanceOf(otherAcc.address, 0)).to.eq(10);

      await expect(elu.connect(otherAcc).burn(otherAcc.address, 0, 10)).to.be.revertedWith(
        `AccessControl: account ${otherAccAddress} is missing role ${register_role}`,
      );
      await elu.burn(otherAcc.address, 0, 10);
      expect(await elu.balanceOf(otherAcc.address, 0)).to.eq(0);
    });
  });
});

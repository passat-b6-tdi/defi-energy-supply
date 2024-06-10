import { BytesLike, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { Manager } from '../../typechain';

const ELU_ADDRESS: BytesLike = '0xd31f9437602E985c19a3Ee11B35d76F5d1DA4235';
const MCGR_ADDRESS: BytesLike = '0x2F176C9145DF9943f7ad31E4DEFC1290bDe54D32';
const NRGS_ADDRESS: BytesLike = '0xCd144d7bfE80D0300F1Ec64CbFc97109777F15Bc';

const reward = 10;
const tolerance = 5;
const fees = 10;

export async function deployManager(elu: BytesLike, mcgr: BytesLike, nrgs: BytesLike): Promise<Manager> {
  const [deployer] = await ethers.getSigners();

  const feeReceiver = deployer.address;

  if (elu == undefined || elu == '') {
    throw Error('ELU address is not defined');
  }

  if (mcgr == undefined || mcgr == '') {
    throw Error('MCGR address is not defined');
  }

  if (nrgs == undefined || nrgs == '') {
    throw Error('NRGS address is not defined');
  }

  console.log(`Manager deployment`);

  const Manager: ContractFactory = await ethers.getContractFactory('Manager');
  const manager = (await Manager.deploy(mcgr, elu, nrgs, feeReceiver, reward, tolerance, fees)) as Manager;
  await manager.deployed();

  console.log(`Manager deployed to ${manager.address}`);

  return manager;
}

async function main() {
  await deployManager(ELU_ADDRESS, MCGR_ADDRESS, NRGS_ADDRESS);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

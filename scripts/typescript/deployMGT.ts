import { ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { MGT } from '../../typechain';

export async function deployMGT(): Promise<MGT> {
  console.log(`MGT deployment`);

  const MGT: ContractFactory = await ethers.getContractFactory('MGT');
  const mgt = (await MGT.deploy()) as MGT;
  await mgt.deployed();

  console.log(`MGT deployed to ${mgt.address}`);
  return mgt;
}

async function main() {
  await deployMGT();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

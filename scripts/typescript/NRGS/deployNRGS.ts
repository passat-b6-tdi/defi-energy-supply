import { ethers } from 'hardhat';
import { NRGS } from '../../../typechain';
import { ContractFactory } from 'ethers';

export async function deployNRGS(): Promise<NRGS> {
  console.log(`NRGS deployment`);

  const NRGS: ContractFactory = await ethers.getContractFactory('NRGS');
  const nrgs = await NRGS.deploy() as NRGS;
  await nrgs.deployed();

  console.log(`NRGS deployed to ${nrgs.address}`);

  return nrgs;
}

async function main() {
  await deployNRGS();
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

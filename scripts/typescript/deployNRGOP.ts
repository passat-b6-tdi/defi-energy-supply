import { ethers } from 'hardhat';
import { NRGOP } from '../../typechain';
import { ContractFactory } from 'ethers';

export async function deployNRGOP(): Promise<NRGOP> {
  console.log(`NRGS deployment`);

  const NRGOP: ContractFactory = await ethers.getContractFactory('NRGOP');
  const nrgop = (await NRGOP.deploy()) as NRGOP;
  await nrgop.deployed();

  console.log(`NRGOP deployed to ${nrgop.address}`);

  return nrgop;
}

async function main() {
  await deployNRGOP();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

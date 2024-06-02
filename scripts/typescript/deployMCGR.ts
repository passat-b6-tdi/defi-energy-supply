import { ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { MCGR } from '../../typechain';

export async function deployMCGR(): Promise<MCGR> {
  console.log(`MCGR deployment`);

  const MCGR: ContractFactory = await ethers.getContractFactory('MCGR');
  const mcgr = await MCGR.deploy() as MCGR;
  await mcgr.deployed();

  console.log(`MCGR deployed to ${mcgr.address}`);
  return mcgr;
}

async function main() {
  await deployMCGR();
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

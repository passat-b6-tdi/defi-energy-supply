import { ethers } from 'hardhat';
import { ECU } from '../../typechain';
import { ContractFactory } from 'ethers';

export async function deployECU(): Promise<ECU> {
  console.log(`ECU deployment`);

  const ECU: ContractFactory = await ethers.getContractFactory('ECU');
  const ecu = (await ECU.deploy()) as ECU;
  await ecu.deployed();

  console.log(`ECU deployed to ${ecu.address}`);

  return ecu;
}

async function main() {
  await deployECU();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

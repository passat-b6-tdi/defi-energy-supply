import { ethers } from 'hardhat';
import { ELU } from '../../typechain';
import { ContractFactory } from 'ethers';

export async function deployELU(): Promise<ELU> {
  console.log(`ELU deployment`);

  const ELU: ContractFactory = await ethers.getContractFactory('ELU');
  const elu = (await ELU.deploy()) as ELU;
  await elu.deployed();

  console.log(`ELU deployed to ${elu.address}`);

  return elu;
}

async function main() {
  await deployELU();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

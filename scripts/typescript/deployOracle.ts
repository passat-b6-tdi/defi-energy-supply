import { ethers } from 'hardhat';
import { EnergyOracle } from '../../typechain';
import { BytesLike, ContractFactory } from 'ethers';

const MANAGER_ADDRESS: BytesLike = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

export async function deployOracle(manager_address: BytesLike): Promise<EnergyOracle> {
  if (manager_address == undefined || manager_address == '') {
    throw Error('Manager address is not defined');
  }

  console.log(`Oracle deployment`);

  const EnergyOracle: ContractFactory = await ethers.getContractFactory('EnergyOracle');
  const oracle = await EnergyOracle.deploy(manager_address) as EnergyOracle;
  await oracle.deployed();

  console.log(`EnergyOracle deployed to ${oracle.address}`);

  return oracle;
}

async function main() {
  await deployOracle(MANAGER_ADDRESS);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

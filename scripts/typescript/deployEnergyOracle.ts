import { ethers } from 'hardhat';
import { EnergyOracle } from '../../typechain';
import { BytesLike, ContractFactory } from 'ethers';

const MANAGER_ADDRESS: BytesLike = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

export async function deployEnergyOracle(manager_address: BytesLike): Promise<EnergyOracle> {
  if (manager_address == undefined || manager_address == '') {
    throw Error('Manager address is not defined');
  }

  console.log(`EnergyOracle deployment`);

  const EnergyOracle: ContractFactory = await ethers.getContractFactory('EnergyOracle');
  const energyOracle = (await EnergyOracle.deploy(manager_address)) as EnergyOracle;
  await energyOracle.deployed();

  console.log(`EnergyOracle deployed to ${energyOracle.address}`);

  return energyOracle;
}

async function main() {
  await deployEnergyOracle(MANAGER_ADDRESS);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

import { BytesLike, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { Main } from '../../typechain';

const MANAGER_ADDRESS: BytesLike = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

export async function deployMain(manager_address: BytesLike): Promise<Main> {
  if (manager_address == undefined || manager_address == '') {
    throw Error('Manager address is not defined');
  }

  console.log(`Main deployment`);

  const Main: ContractFactory = await ethers.getContractFactory('Main');
  const main = (await Main.deploy(manager_address)) as Main;
  await main.deployed();

  console.log(`Main deployed to ${main.address}`);

  return main;
}

async function main() {
  await deployMain(MANAGER_ADDRESS);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

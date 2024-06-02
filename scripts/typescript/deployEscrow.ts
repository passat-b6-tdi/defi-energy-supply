import { BytesLike, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { Escrow } from '../../typechain';

const MANAGER_ADDRESS: BytesLike = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

export async function deployEscrow(manager_address: BytesLike): Promise<Escrow> {
  if (manager_address == undefined || manager_address == '') {
    throw Error('Manager address is not defined');
  }

  console.log(`Escrow deployment`);

  const Escrow: ContractFactory = await ethers.getContractFactory('Escrow');
  const escrow = await Escrow.deploy(manager_address) as Escrow;
  await escrow.deployed();

  console.log(`Escrow deployed to ${escrow.address}`);

  return escrow;
}

async function main() {
  await deployEscrow(MANAGER_ADDRESS);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

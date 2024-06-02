import { ethers } from 'hardhat';
import { Register } from '../../../typechain';
import { BytesLike, ContractFactory } from 'ethers';

const MANAGER_ADDRESS: BytesLike = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

export async function deployRegister(manager_address: BytesLike): Promise<Register> {
  if (manager_address == undefined || manager_address == '') {
    throw Error('Manager address is not defined');
  }

  console.log(`Register deployment`);

  const Register: ContractFactory = await ethers.getContractFactory('Register');
  const register = await Register.deploy(manager_address) as Register;
  await register.deployed();

  console.log(`Register deployed to ${register.address}`);

  return register;
}

async function main() {
  await deployRegister(MANAGER_ADDRESS);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

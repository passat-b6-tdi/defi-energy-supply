import { BytesLike } from 'ethers';
import { verifyContract } from './helpers/verify-contract';
import { ethers } from 'hardhat';

const ELU = '0xa1d1519FB659b280d584C68E2582ec5020Fa25b1';
const MCGR = '0x5e756CE1Fc98FCf7b4C89957fcc2b41CA00FCc53';
const NRGS = '0x7D80AA4D9F4f9e53c5C04aC6F22F8b372855Fb76';

const reward = 10;
const tolerance = 5;
const fees = 10;
const Manager = '0x8D2971DD07b42Bf63f82E72F08a07431573aB1Bf';

const Escrow = '0xf8Fa8CCeB1F19541a71b6732B28f5c626528d92C';
const Main = '0x8759fe749f3feDf0A7319C83551bd475Cd6c2201';
const EnergyOracle = '0x1888C7F3fF23793ea0B462D319D9DF122f67f6b4';
const Register = '0x92aC6a4d4D3ddFb7eA2B32847D6Cf89FAF4F948b';
const StakingReward = '0x5fC19FFcf9fA10B16A4892306862413f7E34EB09';

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  await verifyELU();
  await verifyMCGR();
  await verifyNRGS();

  await verifyManager(deployer.address);

  if (Manager != undefined && Manager != '') {
    await verifyEscrow(Manager);
    await verifyMain(Manager);
    await verifyOracle(Manager);
    await verifyRegister(Manager);
    await verifyStaking(Manager);
  }
}

async function verifyELU(): Promise<void> {
  if (ELU != undefined && ELU != '') {
    await verifyContract(ELU);
  }
}

async function verifyMCGR(): Promise<void> {
  if (MCGR != undefined && MCGR != '') {
    await verifyContract(MCGR);
  }
}

async function verifyNRGS(): Promise<void> {
  if (NRGS != undefined && NRGS != '') {
    await verifyContract(NRGS);
  }
}

async function verifyManager(feeReceiver: BytesLike): Promise<void> {
  if (ELU != undefined && ELU != '' && NRGS != undefined && NRGS != '' && MCGR != undefined && MCGR != '') {
    await verifyContract(Manager, [MCGR, ELU, NRGS, feeReceiver, reward, tolerance, fees]);
  }
}

async function verifyEscrow(manager_address: BytesLike): Promise<void> {
  if (Escrow != undefined && Escrow != '') {
    await verifyContract(Escrow, [manager_address]);
  }
}

async function verifyOracle(manager_address: BytesLike): Promise<void> {
  if (EnergyOracle != undefined && EnergyOracle != '') {
    await verifyContract(EnergyOracle, [manager_address]);
  }
}

async function verifyMain(manager_address: BytesLike): Promise<void> {
  if (Main != undefined && Main != '') {
    await verifyContract(Main, [manager_address]);
  }
}

async function verifyRegister(manager_address: BytesLike): Promise<void> {
  if (Register != undefined && Register != '') {
    await verifyContract(Register, [manager_address]);
  }
}

async function verifyStaking(manager_address: BytesLike): Promise<void> {
  if (StakingReward != undefined && StakingReward != '') {
    await verifyContract(StakingReward, [manager_address]);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

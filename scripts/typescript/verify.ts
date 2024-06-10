import { BytesLike } from 'ethers';
import { verifyContract } from './helpers/verify-contract';
import { ethers } from 'hardhat';

const ELU = '0x56FC2b9666fE0721dCbD1F972541507e15e59b16';
const MCGR = '0x887938BaC3bC46Af0930F8afac88C2f15BaEcdb1';
const NRGS = '0x1a947BdFb306cEc7afE1D324f0A8397Fa1f88887';

const reward = 10;
const tolerance = 5;
const fees = 10;
const Manager = '0xCa9B2772c9ce9746234c9b0eFdAc7A79E7b96144';

const Escrow = '0x33589584E70881f268257Add96867B2E2eaB793A';
const EnergyOracle = '0xb3b2e4820BCC39abd12e2689b4c9F3c27D352DC9';
const Register = '0xAbB1CeFB5f90Ce1114af146606101a795D43d5a1';
const StakingReward = '0x6788754C34aed23F54B0cd78A63574d314F380A5';
const Main = '0x68a9905ECe4DD58DdEeCCc660B87816CCF6AB9B7';


async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  await verifyELU();
  await verifyMCGR();
  await verifyNRGS();

  await verifyManager(deployer.address);

  if (Manager != undefined && Manager != '') {
    await verifyEscrow(Manager);
    await verifyEnergyOracle(Manager);
    await verifyRegister(Manager);
    await verifyStaking(Manager);
    await verifyMain(Manager);
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

async function verifyEnergyOracle(manager_address: BytesLike): Promise<void> {
  if (EnergyOracle != undefined && EnergyOracle != '') {
    await verifyContract(EnergyOracle, [manager_address]);
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

async function verifyMain(manager_address: BytesLike): Promise<void> {
  if (Main != undefined && Main != '') {
    await verifyContract(Main, [manager_address]);
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

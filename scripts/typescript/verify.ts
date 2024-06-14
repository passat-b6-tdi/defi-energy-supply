import { BytesLike } from 'ethers';
import { verifyContract } from './helpers/verify-contract';
import { ethers } from 'hardhat';

const ELU = '0x700959F95fCd583C01b8Da2239ED9c2858dCBEce';
const MGT = '0x273d2c9e4A4F90DBfF3B40feefE088ee786f8FD2';
const NRGS = '0xb5a4F41c70D25191Df4cE4b0fCABD9d335e044c7';

const reward = 10;
const tolerance = 5;
const fees = 10;
const Manager = '0x1CeE6B7C0648D0f4f6012b4bD599E64d07d8dC24';

const Escrow = '0xE487fD39214AF84039FE3b3cc3Ca1183612D19b5';
const EnergyOracle = '0x22Ab3c7Bc02695D3B119A6cf0224f00354E2Ee7f';
const Register = '0xf646325Eb8E44Ed8Dfc07074ea1667455521C4f7';
const StakingReward = '0x98C5cC1025A4f949f945C40e5E5F9BA1af684D34';
const Main = '0x6Afde766802B7E7989A54B64FA8AB7efDa6F7f0A';


async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  await verifyELU();
  await verifyMGT();
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

async function verifyMGT(): Promise<void> {
  if (MGT != undefined && MGT != '') {
    await verifyContract(MGT);
  }
}

async function verifyNRGS(): Promise<void> {
  if (NRGS != undefined && NRGS != '') {
    await verifyContract(NRGS);
  }
}

async function verifyManager(feeReceiver: BytesLike): Promise<void> {
  if (ELU != undefined && ELU != '' && NRGS != undefined && NRGS != '' && MGT != undefined && MGT != '') {
    await verifyContract(Manager, [MGT, ELU, NRGS, feeReceiver, reward, tolerance, fees]);
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

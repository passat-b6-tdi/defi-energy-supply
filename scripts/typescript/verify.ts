import fs from 'fs';
import path from 'path';
import hre from 'hardhat';
import { BytesLike } from 'ethers';
import { verifyContract } from './helpers/verify-contract';
import { ethers } from 'hardhat';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { Manager } from '../../typechain';

async function main(): Promise<void> {
  const networkName = hre.network.name;
  const filePath = path.join(`${process.cwd()}/deployed`, `deployed_addresses_${hre.network.name}.json`);
  const rawData = fs.readFileSync(filePath, 'utf8');
  const addresses = JSON.parse(rawData);

  const [deployer] = await ethers.getSigners();

  await verifyECU(addresses.ECU);
  await verifyMGT(addresses.MGT);
  await verifyNRGS(addresses.NRGS);
  await verifyNRGOP(addresses.NRGOP);
  await verifyManager(addresses.Manager, addresses, deployer.address);

  if (addresses.Manager) {
    await verifyEscrow(addresses.Escrow, addresses.Manager);
    await verifyEnergyOracle(addresses.EnergyOracle, addresses.Manager);
    await verifyRegister(addresses.Register, addresses.Manager);
    await verifyStaking(addresses.StakingReward, addresses.Manager);
    await verifyMain(addresses.Main, addresses.Manager);
  }

  // Dynamically generate the records array
  const records = Object.entries(addresses).map(([contract, address]) => ({
    contract,
    address,
    link: `https://sepolia.arbiscan.io/address/${address}#code`,
  }));

  // Write the verified addresses to a CSV file
  const csvWriter = createCsvWriter({
    path: path.join(`${process.cwd()}/deployed-addresses-csv`, `deployed_addresses_${networkName}.csv`),
    header: [
      { id: 'contract', title: 'Contract' },
      { id: 'address', title: 'Address' },
      { id: 'link', title: 'Link' },
    ],
  });

  await csvWriter.writeRecords(records);

  console.log(`Verified addresses written to deployed_addresses_${networkName}.csv`);
}

async function verifyECU(address: string): Promise<void> {
  if (address) {
    await verifyContract(
      address,
      [],
      "contracts/tokens/ERC721/ECU.sol:ECU"
    );
  }
}

async function verifyMGT(address: string): Promise<void> {
  if (address) {
    await verifyContract(
      address,
      [],
      "contracts/tokens/ERC721/MGT.sol:MGT"
    );
  }
}

async function verifyNRGS(address: string): Promise<void> {
  if (address) {
    await verifyContract(
      address,
      [],
      "contracts/tokens/ERC721/NRGS.sol:NRGS"
    );
  }
}

async function verifyNRGOP(address: string): Promise<void> {
  if (address) {
    await verifyContract(
      address,
      [],
      "contracts/tokens/ERC721/NRGOP.sol:NRGOP"
    );
  }
}

async function verifyManager(address: string, addresses: any, feeReceiver: BytesLike): Promise<void> {
  const Tokens: Manager.TokensStruct = {
    mgt: addresses.MGT,
    ecu: addresses.ECU,
    nrgs: addresses.NRGS,
    nrgop: addresses.NRGOP,
  }

  const Values: Manager.ValuesStruct = {
    rewardAmount: 10,
    fees: 10,
  }

  if (address) {
    await verifyContract(
      address,
      [
        Tokens,
        feeReceiver,
        Values
      ],
      "contracts/Manager.sol:Manager",
    );
  }
}

async function verifyEscrow(address: string, manager_address: BytesLike): Promise<void> {
  if (address) {
    await verifyContract(
      address,
      [manager_address],
      "contracts/Escrow.sol:Escrow",
    );
  }
}

async function verifyEnergyOracle(address: string, manager_address: BytesLike): Promise<void> {
  if (address) {
    await verifyContract(
      address,
      [manager_address],
      "contracts/EnergyOracle.sol:EnergyOracle",
    );
  }
}

async function verifyRegister(address: string, manager_address: BytesLike): Promise<void> {
  if (address) {
    await verifyContract(
      address,
      [manager_address],
      "contracts/Register.sol:Register",
    );
  }
}

async function verifyStaking(address: string, manager_address: BytesLike): Promise<void> {
  if (address) {
    await verifyContract(
      address,
      [manager_address],
      "contracts/StakingReward.sol:StakingReward",
    );
  }
}

async function verifyMain(address: string, manager_address: BytesLike): Promise<void> {
  if (address) {
    await verifyContract(
      address,
      [manager_address],
      "contracts/Main.sol:Main",
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
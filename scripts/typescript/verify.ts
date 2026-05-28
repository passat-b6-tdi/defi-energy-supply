import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import hre, { ethers } from 'hardhat';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { verifyContract } from './helpers/verify-contract';
import { Main } from '../../typechain';

dotenv.config();

const EXPLORER_BY_NETWORK: Record<string, string> = {
  arbitrum_sepolia: 'https://sepolia.arbiscan.io',
  base_sepolia: 'https://sepolia.basescan.org',
  sepolia: 'https://sepolia.etherscan.io',
  mainnet: 'https://etherscan.io',
  arbitrum: 'https://arbiscan.io',
  base: 'https://basescan.org',
  optimism: 'https://optimistic.etherscan.io',
  polygon: 'https://polygonscan.com',
};

const FEE_AMOUNT = 10;

type Addresses = {
  NRGCT?: string;
  MGT?: string;
  NRGPT?: string;
  NRGST?: string;
  NRGOPT?: string;
  ELCT?: string;
  USDC?: string;
  DAI?: string;
  USDT?: string;
  Main?: string;
  Register?: string;
  Escrow?: string;
  EnergyOracle?: string;
  StakingReward?: string;
};

// A stablecoin counts as "real" (externally deployed) when an env var like
// `BASE_SEPOLIA_USDC` is set. Real stablecoins are skipped during verification.
function hasRealStablecoin(network: string, label: 'USDC' | 'DAI' | 'USDT'): boolean {
  const key = `${network.toUpperCase()}_${label}`;
  const value = process.env[key]?.trim();
  return !!value && value.length > 0;
}

async function main(): Promise<void> {
  const networkName = hre.network.name;
  const filePath = path.join(process.cwd(), 'deployed', `deployed_addresses_${networkName}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Deployed addresses file not found: ${filePath}. Run \`yarn deploy:network ${networkName}\` first.`,
    );
  }

  const addresses = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Addresses;
  const [deployer] = await ethers.getSigners();

  await verifyNoArgs(addresses.NRGCT, 'contracts/tokens/ERC20/EnergyCreditToken.sol:EnergyCreditToken');
  await verifyNoArgs(addresses.MGT, 'contracts/tokens/ERC20/MicrogridGovernanceToken.sol:MicrogridGovernanceToken');
  await verifyNoArgs(addresses.NRGPT, 'contracts/tokens/ERC712/EnergyProducerToken.sol:EnergyProducerToken');
  await verifyNoArgs(addresses.NRGST, 'contracts/tokens/ERC712/EnergySupplierToken.sol:EnergySupplierToken');
  await verifyNoArgs(
    addresses.NRGOPT,
    'contracts/tokens/ERC712/EnergyOracleProviderToken.sol:EnergyOracleProviderToken',
  );
  await verifyNoArgs(addresses.ELCT, 'contracts/tokens/ERC1155/ElectricityConsumerToken.sol:ElectricityConsumerToken');

  if (addresses.USDC && !hasRealStablecoin(networkName, 'USDC')) {
    await verifyNoArgs(addresses.USDC, 'contracts/mocks/ERC20Mock.sol:ERC20Mock');
  }
  if (addresses.DAI && !hasRealStablecoin(networkName, 'DAI')) {
    await verifyNoArgs(addresses.DAI, 'contracts/mocks/ERC20Mock.sol:ERC20Mock');
  }
  if (addresses.USDT && !hasRealStablecoin(networkName, 'USDT')) {
    await verifyNoArgs(addresses.USDT, 'contracts/mocks/ERC20Mock.sol:ERC20Mock');
  }

  if (addresses.Main) {
    const Tokens: Main.TokensStruct = {
      energyCreditToken: addresses.NRGCT!,
      microgridGovernanceToken: addresses.MGT!,
      energyProducerToken: addresses.NRGPT!,
      energySupplierToken: addresses.NRGST!,
      energyOracleProviderToken: addresses.NRGOPT!,
      electricityConsumerToken: addresses.ELCT!,
    };
    const Fees: Main.FeesStruct = {
      receiver: deployer.address,
      amount: FEE_AMOUNT,
    };
    await verifyContract(
      addresses.Main,
      [Tokens, Fees, addresses.USDC!, addresses.DAI!, addresses.USDT!],
      'contracts/Main.sol:Main',
    );

    await verifyContract(addresses.Register!, [addresses.Main], 'contracts/Register.sol:Register');
    await verifyContract(addresses.Escrow!, [addresses.Main], 'contracts/Escrow.sol:Escrow');
    await verifyContract(addresses.EnergyOracle!, [addresses.Main], 'contracts/EnergyOracle.sol:EnergyOracle');
    await verifyContract(addresses.StakingReward!, [addresses.Main], 'contracts/StakingReward.sol:StakingReward');
  }

  const explorer = EXPLORER_BY_NETWORK[networkName] ?? '';
  const records = Object.entries(addresses).map(([contract, address]) => ({
    contract,
    address,
    link: explorer ? `${explorer}/address/${address}#code` : '',
  }));

  const csvDir = path.join(process.cwd(), 'deployed-addresses-csv');
  if (!fs.existsSync(csvDir)) fs.mkdirSync(csvDir, { recursive: true });
  const csvWriter = createCsvWriter({
    path: path.join(csvDir, `deployed_addresses_${networkName}.csv`),
    header: [
      { id: 'contract', title: 'Contract' },
      { id: 'address', title: 'Address' },
      { id: 'link', title: 'Link' },
    ],
  });
  await csvWriter.writeRecords(records);
  console.log(`Verified addresses written to deployed_addresses_${networkName}.csv`);
}

async function verifyNoArgs(address: string | undefined, contract: string): Promise<void> {
  if (!address) return;
  await verifyContract(address, [], contract);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

import dotenv from 'dotenv';
import { SupportedNetwork } from '../chains';

dotenv.config();

const INFURA_HOST: Record<SupportedNetwork, string> = Object.freeze({
  mainnet: 'mainnet.infura.io/v3/',
  sepolia: 'sepolia.infura.io/v3/',
  polygon: 'polygon-mainnet.infura.io/v3/',
  amoy: 'polygon-amoy.infura.io/v3/',
  optimism: 'optimism-mainnet.infura.io/v3/',
  optimism_sepolia: 'optimism-sepolia.infura.io/v3/',
  base: 'base-mainnet.infura.io/v3/',
  base_sepolia: 'base-sepolia.infura.io/v3/',
  arbitrum: 'arbitrum-mainnet.infura.io/v3/',
  arbitrum_sepolia: 'arbitrum-sepolia.infura.io/v3/',
});

export function getInfuraRpcUrl(network: SupportedNetwork): string | undefined {
  const host = INFURA_HOST[network];
  const key = process.env.INFURA_KEY?.trim();
  if (!host || !key) return undefined;
  return `https://${host}${key}`;
}

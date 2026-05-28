import dotenv from 'dotenv';
import { SupportedNetwork } from '../chains';

dotenv.config();

const ALCHEMY_HOST: Record<SupportedNetwork, string> = Object.freeze({
  mainnet: 'eth-mainnet.g.alchemy.com/v2/',
  sepolia: 'eth-sepolia.g.alchemy.com/v2/',
  polygon: 'polygon-mainnet.g.alchemy.com/v2/',
  amoy: 'polygon-amoy.g.alchemy.com/v2/',
  optimism: 'opt-mainnet.g.alchemy.com/v2/',
  optimism_sepolia: 'opt-sepolia.g.alchemy.com/v2/',
  base: 'base-mainnet.g.alchemy.com/v2/',
  base_sepolia: 'base-sepolia.g.alchemy.com/v2/',
  arbitrum: 'arb-mainnet.g.alchemy.com/v2/',
  arbitrum_sepolia: 'arb-sepolia.g.alchemy.com/v2/',
});

export function getAlchemyRpcUrl(network: SupportedNetwork): string | undefined {
  const host = ALCHEMY_HOST[network];
  const key = process.env.ALCHEMY_KEY?.trim();
  if (!host || !key) return undefined;
  return `https://${host}${key}`;
}

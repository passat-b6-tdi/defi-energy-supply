export const chainIds = Object.freeze({
  mainnet: 1,
  sepolia: 11155111,
  polygon: 137,
  amoy: 80002,
  optimism: 10,
  optimism_sepolia: 11155420,
  base: 8453,
  base_sepolia: 84532,
  arbitrum: 42161,
  arbitrum_sepolia: 421614,
});

export type SupportedNetwork = keyof typeof chainIds;

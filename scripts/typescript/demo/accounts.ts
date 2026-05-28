import fs from 'fs';
import path from 'path';

export interface DemoAccount {
  label: string;
  address: string;
  privateKey: string;
}

export interface DemoAccountsFile {
  producers: DemoAccount[];
  suppliers: DemoAccount[];
  oracleProviders: DemoAccount[];
  consumers: DemoAccount[];
}

export const ACCOUNT_LAYOUT = {
  producers: ['producerA', 'producerB'],
  suppliers: ['supplierA', 'supplierB'],
  oracleProviders: ['oracle1'],
  consumers: ['consumer1', 'consumer2', 'consumer3', 'consumer4'],
} as const;

export function demoAccountsPath(network: string): string {
  return path.join(process.cwd(), 'deployed', `demo_accounts_${network}.json`);
}

export function deployedAddressesPath(network: string): string {
  return path.join(process.cwd(), 'deployed', `deployed_addresses_${network}.json`);
}

export function readDemoAccounts(network: string): DemoAccountsFile {
  const p = demoAccountsPath(network);
  if (!fs.existsSync(p)) {
    throw new Error(`No demo accounts file at ${p}. Run \`yarn demo:create ${network}\` first.`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8')) as DemoAccountsFile;
}

export function writeDemoAccounts(network: string, data: DemoAccountsFile): string {
  const p = demoAccountsPath(network);
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  return p;
}

export function allAccounts(file: DemoAccountsFile): DemoAccount[] {
  return [...file.producers, ...file.suppliers, ...file.oracleProviders, ...file.consumers];
}

export interface DeployedAddresses {
  NRGCT: string;
  MGT: string;
  NRGPT: string;
  NRGST: string;
  NRGOPT: string;
  ELCT: string;
  USDC: string;
  DAI: string;
  USDT: string;
  Main: string;
  Register: string;
  Escrow: string;
  EnergyOracle: string;
  StakingReward: string;
}

export function readDeployedAddresses(network: string): DeployedAddresses {
  const p = deployedAddressesPath(network);
  if (!fs.existsSync(p)) {
    throw new Error(`No deployed addresses at ${p}. Run \`yarn deploy:network ${network}\` first.`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8')) as DeployedAddresses;
}

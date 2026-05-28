/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from 'dotenv';
import { HttpNetworkAccountsUserConfig, HttpNetworkUserConfig } from 'hardhat/types';
import { chainIds, SupportedNetwork } from './chains';
import { getAlchemyRpcUrl, getInfuraRpcUrl } from './rpc';

dotenv.config();

export enum AccountTypes {
  Mnemonic,
  PK,
  TestnetPk,
}

export function getNetworkAccounts(account: string, accountType: AccountTypes): HttpNetworkAccountsUserConfig {
  if (!account) {
    throw new Error('[getNetworkAccounts]: Please specify MNEMONIC or PRIVATE_KEY');
  }
  if (accountType === AccountTypes.Mnemonic) {
    return {
      mnemonic: account,
      path: "m/44'/60'/0'/0",
      count: 10,
      initialIndex: 0,
    };
  }
  return [account];
}

function resolveAccount(accountType: AccountTypes): string {
  switch (accountType) {
    case AccountTypes.Mnemonic:
      return process.env.MNEMONIC!;
    case AccountTypes.PK:
      return process.env.PK!;
    case AccountTypes.TestnetPk:
      return process.env.TESTNET_PK!;
    default:
      throw new Error('Invalid account type');
  }
}

// Builds a Hardhat HTTP network config. Returns a placeholder url/accounts when
// the relevant env vars are missing so the config object can still be built at
// load time — actual failure is deferred to the first request against the network.
export function getNetworkConfig(
  networkName: SupportedNetwork,
  accountType: AccountTypes,
  override?: HttpNetworkUserConfig,
): HttpNetworkUserConfig {
  const url = override?.url ?? getInfuraRpcUrl(networkName) ?? getAlchemyRpcUrl(networkName) ?? '';
  const account = resolveAccount(accountType);
  const accounts: HttpNetworkAccountsUserConfig = account ? getNetworkAccounts(account, accountType) : [];

  return {
    accounts,
    url,
    gas: 'auto',
    ...override,
    chainId: chainIds[networkName],
  };
}

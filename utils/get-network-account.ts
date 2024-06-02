/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { HttpNetworkAccountsUserConfig, HttpNetworkUserConfig } from 'hardhat/types';
import { getAlchemyRpcUrl } from './get-alchemy-rpc-url';
import { getInfuraRpcUrl } from './get-infura-rpc-url';
import { chainIds } from './chain-ids';
import dotenv from 'dotenv';
dotenv.config();

export enum AccountTypes {
  Mnemonic,
  PK,
  TestnetPk
}

export function getNetworkAccounts(account: string, accountType: AccountTypes): HttpNetworkAccountsUserConfig {
  if (account !== '' && account !== undefined) {
    if (accountType === AccountTypes.Mnemonic) {
      return {
        mnemonic: account,
        path: "m/44'/60'/0'/0",
        count: 10,
        initialIndex: 0,
      };
    } else {
      return [account];
    }
  } else {
    throw new Error('[getNetworkAccounts]: Please specify MNEMONIC or PRIVATE_KEY');
  }
}

export function getNetworkConfig(
  networkName: keyof typeof chainIds,
  accountType: AccountTypes,
  override?: HttpNetworkUserConfig,
): HttpNetworkUserConfig {
  const infuraRpcUrl = getInfuraRpcUrl(networkName);
  const alchemyRpcUrl = getAlchemyRpcUrl(networkName);

  if (!infuraRpcUrl && !alchemyRpcUrl && !override?.url) {
    throw new Error('Please specify Infura or Alchemy api key in .env file or override the whole rpc url');
  }

  let account: string;

  switch (accountType) {
    case AccountTypes.Mnemonic:
      account = process.env.MNEMONIC!;
      break;
    case AccountTypes.PK:
      account = process.env.PK!;
      break;
    case AccountTypes.TestnetPk:
      account = process.env.TESTNET_PK!;
      break;
    default:
      throw new Error('Invalid account type');
  }

  if (!account) {
    throw new Error('Account not found for the specified type');
  }

  return {
    accounts: getNetworkAccounts(account, accountType),
    url: override?.url || infuraRpcUrl || alchemyRpcUrl,
    gas: 'auto',
    ...override,
    chainId: chainIds[networkName],
  };
}

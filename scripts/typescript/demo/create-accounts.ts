import hre, { ethers } from 'hardhat';
import { ACCOUNT_LAYOUT, DemoAccount, DemoAccountsFile, writeDemoAccounts } from './accounts';

function makeAccounts(labels: readonly string[]): DemoAccount[] {
  return labels.map(label => {
    const wallet = ethers.Wallet.createRandom();
    return { label, address: wallet.address, privateKey: wallet.privateKey };
  });
}

async function main(): Promise<void> {
  const network = hre.network.name;

  const data: DemoAccountsFile = {
    producers: makeAccounts(ACCOUNT_LAYOUT.producers),
    suppliers: makeAccounts(ACCOUNT_LAYOUT.suppliers),
    oracleProviders: makeAccounts(ACCOUNT_LAYOUT.oracleProviders),
    consumers: makeAccounts(ACCOUNT_LAYOUT.consumers),
  };

  const filePath = writeDemoAccounts(network, data);

  console.log(`\nCreated demo accounts for network: ${network}`);
  console.log(`Saved to: ${filePath}`);
  console.log(`\n!!  PRIVATE KEYS — copy and store securely  !!\n`);

  const print = (group: string, accs: DemoAccount[]) => {
    console.log(`[${group}]`);
    for (const a of accs) {
      console.log(`  ${a.label.padEnd(10)}  ${a.address}  ${a.privateKey}`);
    }
  };

  print('producers', data.producers);
  print('suppliers', data.suppliers);
  print('oracle providers', data.oracleProviders);
  print('consumers', data.consumers);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

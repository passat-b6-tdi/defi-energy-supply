import hre, { ethers } from 'hardhat';
import { allAccounts, readDemoAccounts, readDeployedAddresses } from './accounts';
import { ERC20Mock__factory } from '../../../typechain';

const ETH_PER_ACCOUNT = ethers.utils.parseEther(process.env.DEMO_ETH_PER_ACCOUNT ?? '0.001');
// Oracle providers send the most txs (4 records per consumer + 2 prices + 2 productions).
// Give them ~4x to be safe.
const ETH_PER_ORACLE = ethers.utils.parseEther(process.env.DEMO_ETH_PER_ORACLE ?? '0.004');
const USDC_PER_CONSUMER = ethers.utils.parseUnits('1', 18); // mock USDC has 18 decimals

function targetEthFor(label: string): ReturnType<typeof ethers.utils.parseEther> {
  return label.startsWith('oracle') ? ETH_PER_ORACLE : ETH_PER_ACCOUNT;
}

async function main(): Promise<void> {
  const network = hre.network.name;
  const [deployer] = await ethers.getSigners();
  const accounts = readDemoAccounts(network);
  const addresses = readDeployedAddresses(network);

  console.log(`Network:  ${network}`);
  console.log(`Funding from deployer: ${deployer.address}`);
  const balance = await deployer.getBalance();
  console.log(`Deployer balance: ${ethers.utils.formatEther(balance)} ETH`);
  console.log(`Per-account amount: ${ethers.utils.formatEther(ETH_PER_ACCOUNT)} ETH`);

  // Compute per-account top-up amount: oracle gets more (busiest actor).
  // Skip accounts that already hold enough (idempotent re-runs).
  const allAccs = allAccounts(accounts);
  const toFund: Array<{ label: string; address: string; amount: ReturnType<typeof ethers.utils.parseEther> }> = [];
  for (const acc of allAccs) {
    const target = targetEthFor(acc.label);
    const cur = await ethers.provider.getBalance(acc.address);
    if (cur.gte(target)) {
      console.log(`  skip ${acc.label.padEnd(10)} ${acc.address}  already has ${ethers.utils.formatEther(cur)} ETH`);
    } else {
      const top = target.sub(cur);
      toFund.push({ label: acc.label, address: acc.address, amount: top });
    }
  }

  // Pre-flight: ensure deployer can cover the remaining transfers plus gas headroom.
  const totalNeeded = toFund.reduce((acc, t) => acc.add(t.amount), ethers.utils.parseEther('0.0005'));
  if (balance.lt(totalNeeded)) {
    console.error(
      `\nInsufficient deployer balance: need ~${ethers.utils.formatEther(totalNeeded)} ETH, ` +
        `have ${ethers.utils.formatEther(balance)} ETH. ` +
        `Top up ${deployer.address} on ${network} and re-run.`,
    );
    process.exit(1);
  }

  console.log(`\nTopping up ${toFund.length} accounts to their target balances...`);
  for (const t of toFund) {
    const tx = await deployer.sendTransaction({ to: t.address, value: t.amount });
    await tx.wait();
    console.log(`  -> ${t.label.padEnd(10)} ${t.address}  +${ethers.utils.formatEther(t.amount)} ETH  tx ${tx.hash}`);
  }

  if (!addresses.USDC) {
    console.log('\nNo USDC address recorded — skipping consumer USDC drip.');
    return;
  }

  console.log(`\nChecking mock USDC balances on consumers...`);
  const usdc = ERC20Mock__factory.connect(addresses.USDC, deployer);
  for (const c of accounts.consumers) {
    const cur = await usdc.balanceOf(c.address);
    if (cur.gte(USDC_PER_CONSUMER)) {
      console.log(`  skip ${c.label.padEnd(10)} already has ${ethers.utils.formatUnits(cur, 18)} USDC`);
      continue;
    }
    const tx = await usdc.transfer(c.address, USDC_PER_CONSUMER);
    await tx.wait();
    console.log(`  -> ${c.label.padEnd(10)} ${c.address}  tx ${tx.hash}`);
  }

  console.log('\nFunding complete.');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

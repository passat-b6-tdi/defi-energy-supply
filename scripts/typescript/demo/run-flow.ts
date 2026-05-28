import hre, { ethers } from 'hardhat';
import { BigNumber, Wallet } from 'ethers';
import { readDemoAccounts, readDeployedAddresses } from './accounts';
import {
  ElectricityConsumerToken__factory,
  EnergyCreditToken__factory,
  EnergyOracle__factory,
  Escrow__factory,
  Main__factory,
  MicrogridGovernanceToken__factory,
  Register__factory,
  StakingReward__factory,
  ERC20Mock__factory,
} from '../../../typechain';

const PRICE_A = BigNumber.from('1000000000000000'); // 1e15 wei/unit
const PRICE_B = BigNumber.from('2000000000000000'); // 2e15 wei/unit
const PRODUCTION_A = 1000;
const PRODUCTION_B = 2500;
const CONSUMPTION = [50, 120, 80, 200] as const;

async function main(): Promise<void> {
  const network = hre.network.name;
  const provider = ethers.provider;
  const accounts = readDemoAccounts(network);
  const addresses = readDeployedAddresses(network);
  const [deployer] = await ethers.getSigners();

  const wallet = (pk: string) => new ethers.Wallet(pk, provider);
  const producerA = wallet(accounts.producers[0].privateKey);
  const producerB = wallet(accounts.producers[1].privateKey);
  const supplierA = wallet(accounts.suppliers[0].privateKey);
  const supplierB = wallet(accounts.suppliers[1].privateKey);
  const oracle = wallet(accounts.oracleProviders[0].privateKey);
  const consumers = accounts.consumers.map(c => wallet(c.privateKey));

  const register = Register__factory.connect(addresses.Register, deployer);
  const energyOracle = EnergyOracle__factory.connect(addresses.EnergyOracle, deployer);
  const escrow = Escrow__factory.connect(addresses.Escrow, deployer);
  const staking = StakingReward__factory.connect(addresses.StakingReward, deployer);
  const main_ = Main__factory.connect(addresses.Main, deployer);
  const nrgct = EnergyCreditToken__factory.connect(addresses.NRGCT, deployer);
  const mgt = MicrogridGovernanceToken__factory.connect(addresses.MGT, deployer);
  const elct = ElectricityConsumerToken__factory.connect(addresses.ELCT, deployer);
  const usdc = ERC20Mock__factory.connect(addresses.USDC, deployer);

  console.log(`Network: ${network}\n`);

  console.log('Step 1: registering producers, suppliers, oracle provider');
  const producerAId = await registerAndReadId(
    () => register.registerProducer(producerA.address),
    'ProducerRegistered',
    'producerId',
  );
  const producerBId = await registerAndReadId(
    () => register.registerProducer(producerB.address),
    'ProducerRegistered',
    'producerId',
  );
  const supplierAId = await registerAndReadId(
    () => register.registerSupplier(supplierA.address),
    'SupplierRegistered',
    'supplierId',
  );
  const supplierBId = await registerAndReadId(
    () => register.registerSupplier(supplierB.address),
    'SupplierRegistered',
    'supplierId',
  );
  const oracleId = await registerAndReadId(
    () => register.registerOracleProvider(oracle.address),
    'OracleProviderRegistered',
    'oracleProviderId',
  );

  log('producerA NRGPT id', producerAId);
  log('producerB NRGPT id', producerBId);
  log('supplierA NRGST id', supplierAId);
  log('supplierB NRGST id', supplierBId);
  log('oracle    NRGOPT id', oracleId);

  console.log('\nStep 2: each supplier registers their consumers');
  const enrollments: Array<readonly [Wallet, Wallet, number]> = [
    [supplierA, consumers[0], supplierAId],
    [supplierA, consumers[1], supplierAId],
    [supplierB, consumers[2], supplierBId],
    [supplierB, consumers[3], supplierBId],
  ];
  for (const [sup, con, sid] of enrollments) {
    const enrolled = await elct.balanceOf(con.address, sid);
    if (enrolled.gt(0)) {
      console.log(`  skip ${con.address} (already enrolled with supplier ${sid})`);
      continue;
    }
    await (await register.connect(sup).registerElectricityConsumer(con.address, sid)).wait();
    console.log(`  registered ${con.address} with supplier ${sid}`);
  }

  console.log('\nStep 3: oracle records supplier prices');
  await (await energyOracle.connect(oracle).recordSupplierPrice(supplierAId, PRICE_A)).wait();
  await (await energyOracle.connect(oracle).recordSupplierPrice(supplierBId, PRICE_B)).wait();
  log('supplierA price (wei/unit)', PRICE_A.toString());
  log('supplierB price (wei/unit)', PRICE_B.toString());

  console.log('\nStep 4: oracle records productions');
  await (await energyOracle.connect(oracle).recordEnergyProductions(producerAId, PRODUCTION_A)).wait();
  await (await energyOracle.connect(oracle).recordEnergyProductions(producerBId, PRODUCTION_B)).wait();
  log('producerA NRGCT minted', (await nrgct.balanceOf(producerA.address)).toString());
  log('producerB NRGCT minted', (await nrgct.balanceOf(producerB.address)).toString());

  console.log('\nStep 5: producers transfer NRGCT to their suppliers');
  await (await nrgct.connect(producerA).transfer(supplierA.address, PRODUCTION_A)).wait();
  await (await nrgct.connect(producerB).transfer(supplierB.address, PRODUCTION_B)).wait();
  log('supplierA NRGCT inventory', (await nrgct.balanceOf(supplierA.address)).toString());
  log('supplierB NRGCT inventory', (await nrgct.balanceOf(supplierB.address)).toString());

  console.log('\nStep 6: oracle records per-consumer consumptions');
  const pairs: Array<readonly [Wallet, number, number]> = [
    [consumers[0], supplierAId, CONSUMPTION[0]],
    [consumers[1], supplierAId, CONSUMPTION[1]],
    [consumers[2], supplierBId, CONSUMPTION[2]],
    [consumers[3], supplierBId, CONSUMPTION[3]],
  ];
  for (const [c, sid, used] of pairs) {
    await (await energyOracle.connect(oracle).recordConsumerConsumptions(c.address, sid, used)).wait();
    const debt = await energyOracle.debtsUSD(c.address, sid);
    log(`${labelFor(c.address)} consumed ${used} units, debt`, ethers.utils.formatUnits(debt, 18) + ' USDC');
  }

  console.log('\nStep 7: consumers pay');
  const fee = (await main_.fees()).amount;
  for (const [c, sid] of pairs) {
    const debt = await energyOracle.debtsUSD(c.address, sid);
    const total = debt.add(fee);
    const bal = await usdc.balanceOf(c.address);
    log(
      `${labelFor(c.address)} balance / debt+fee`,
      `${ethers.utils.formatUnits(bal, 18)} / ${ethers.utils.formatUnits(total, 18)} USDC`,
    );
    if (debt.isZero()) {
      console.log(`  skip — debt is zero (already paid)`);
      continue;
    }
    if (bal.lt(total)) {
      console.log(`  skip — insufficient USDC (top up consumer first)`);
      continue;
    }
    await (await usdc.connect(c).approve(escrow.address, total)).wait();
    // Bypass estimateGas — RPC read replicas sometimes lag behind the approve we
    // just made, causing a stale-state simulation revert. Manual gasLimit forces
    // the tx through; the actual on-chain state is consistent.
    await (await escrow.connect(c).payForElectricity(sid, usdc.address, { gasLimit: 500_000 })).wait();
    log(`${labelFor(c.address)} paid`, ethers.utils.formatUnits(total, 18) + ' USDC');
  }

  console.log('\nStep 8: producerA claims staking rewards');
  await (await staking.connect(producerA).getProducerRewards(producerAId)).wait();

  // Final report
  console.log('\nUSDC balances:');
  log('supplierA', ethers.utils.formatUnits(await usdc.balanceOf(supplierA.address), 18));
  log('supplierB', ethers.utils.formatUnits(await usdc.balanceOf(supplierB.address), 18));
  log('fee receiver (deployer)', ethers.utils.formatUnits(await usdc.balanceOf(deployer.address), 18));
  for (let i = 0; i < consumers.length; i++) {
    log(`consumer${i + 1}`, ethers.utils.formatUnits(await usdc.balanceOf(consumers[i].address), 18));
  }

  console.log('\nMGT balances:');
  log('oracle', ethers.utils.formatUnits(await mgt.balanceOf(oracle.address), 18));
  log('producerA (claimed)', ethers.utils.formatUnits(await mgt.balanceOf(producerA.address), 18));
  log('producerB (unclaimed in pool)', ethers.utils.formatUnits(await mgt.balanceOf(producerB.address), 18));
  log('supplierA', ethers.utils.formatUnits(await mgt.balanceOf(supplierA.address), 18));
  log('supplierB', ethers.utils.formatUnits(await mgt.balanceOf(supplierB.address), 18));

  console.log('\nELCT enrollment:');
  for (const [c, sid] of pairs) {
    log(`${labelFor(c.address)} (supplier ${sid})`, (await elct.balanceOf(c.address, sid)).toString());
  }

  function labelFor(addr: string): string {
    if (addr === producerA.address) return 'producerA';
    if (addr === producerB.address) return 'producerB';
    if (addr === supplierA.address) return 'supplierA';
    if (addr === supplierB.address) return 'supplierB';
    if (addr === oracle.address) return 'oracle';
    const i = consumers.findIndex(c => c.address === addr);
    return i >= 0 ? `consumer${i + 1}` : addr;
  }
}

function log(label: string, value: unknown): void {
  console.log(`  ${String(label).padEnd(34)} ${value}`);
}

async function registerAndReadId(
  call: () => Promise<{
    wait: () => Promise<{ events?: Array<{ event?: string; args?: Record<string, BigNumber> }> }>;
  }>,
  eventName: string,
  argName: string,
): Promise<number> {
  const tx = await call();
  const receipt = await tx.wait();
  const evt = receipt.events?.find(e => e.event === eventName);
  if (!evt?.args || evt.args[argName] === undefined) {
    throw new Error(`Could not extract ${argName} from ${eventName} event`);
  }
  return evt.args[argName].toNumber();
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

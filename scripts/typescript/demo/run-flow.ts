import hre, { ethers } from 'hardhat';
import { BigNumber, Wallet } from 'ethers';
import { readDemoAccounts, readDeployedAddresses } from './accounts';
import {
  ElectricityConsumerToken__factory,
  EnergyCreditToken__factory,
  EnergyOracle__factory,
  EnergyOracleProviderToken__factory,
  EnergyProducerToken__factory,
  EnergySupplierToken__factory,
  Escrow__factory,
  Main__factory,
  MicrogridGovernanceToken__factory,
  Register__factory,
  StakingReward__factory,
  ERC20Mock__factory,
} from '../../../typechain';

const PRICE_A = BigNumber.from('1000000000000000'); // 1e15 wei/unit
const PRICE_B = BigNumber.from('2000000000000000'); // 2e15 wei/unit
const PRODUCTION_A = 2000;
const PRODUCTION_B = 5000;
// Round 1: small, billable amounts that fit inside per-consumer USDC funding.
const CONSUMPTION = [50, 120, 80, 200] as const;
// Round 2: larger, varied amounts recorded AFTER payment so `_debtsUSD` stays
// non-zero in contract state — the dashboard reads current debt, and without
// this the chart would flatline at 0 right after consumers pay in Step 7.
const CONSUMPTION_UNBILLED = [500, 800, 1200, 1500] as const;

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
  const nrgpt = EnergyProducerToken__factory.connect(addresses.NRGPT, deployer);
  const nrgst = EnergySupplierToken__factory.connect(addresses.NRGST, deployer);
  const nrgopt = EnergyOracleProviderToken__factory.connect(addresses.NRGOPT, deployer);

  console.log(`Network: ${network}\n`);

  console.log('Step 1: registering producers, suppliers, oracle provider');
  const producerAId = await ensureProducer(producerA.address);
  const producerBId = await ensureProducer(producerB.address);
  const supplierAId = await ensureSupplier(supplierA.address);
  const supplierBId = await ensureSupplier(supplierB.address);
  const oracleId = await ensureOracle(oracle.address);

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
    // just made, causing a stale-state simulation revert. Manual gasLimit sized
    // to ~150k actual gas with headroom, so the RPC's intrinsic-cost check
    // (gasLimit × maxFeePerGas) still fits the per-consumer ETH funding.
    await (await escrow.connect(c).payForElectricity(sid, usdc.address, { gasLimit: 250_000 })).wait();
    log(`${labelFor(c.address)} paid`, ethers.utils.formatUnits(total, 18) + ' USDC');
  }

  console.log('\nStep 8: oracle records ongoing (unbilled) consumption');
  const unbilledPairs: Array<readonly [Wallet, number, number]> = [
    [consumers[0], supplierAId, CONSUMPTION_UNBILLED[0]],
    [consumers[1], supplierAId, CONSUMPTION_UNBILLED[1]],
    [consumers[2], supplierBId, CONSUMPTION_UNBILLED[2]],
    [consumers[3], supplierBId, CONSUMPTION_UNBILLED[3]],
  ];
  for (const [c, sid, used] of unbilledPairs) {
    await (await energyOracle.connect(oracle).recordConsumerConsumptions(c.address, sid, used)).wait();
    const debt = await energyOracle.debtsUSD(c.address, sid);
    log(`${labelFor(c.address)} consumed ${used} units (unbilled), debt`, ethers.utils.formatUnits(debt, 18) + ' USDC');
  }

  console.log('\nStep 9: producerA claims staking rewards');
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

  // Idempotent registration: if the address already holds the NFT from a prior
  // demo run, reuse the existing tokenId instead of reverting on re-registration.
  // IDs are sequential (1..currentCounter-1), so a small linear scan is enough.
  async function findOwnedTokenId(
    ownerOf: (id: BigNumber) => Promise<string>,
    nextId: BigNumber,
    who: string,
  ): Promise<number | null> {
    const max = nextId.toNumber();
    for (let id = 1; id < max; id++) {
      try {
        const owner = await ownerOf(BigNumber.from(id));
        if (owner.toLowerCase() === who.toLowerCase()) return id;
      } catch {
        // tokenId may have been burned — keep scanning
      }
    }
    return null;
  }

  async function ensureProducer(addr: string): Promise<number> {
    if ((await nrgpt.balanceOf(addr)).gt(0)) {
      const next = await register.currentProducerId();
      const existing = await findOwnedTokenId(id => nrgpt.ownerOf(id), next, addr);
      if (existing != null) {
        console.log(`  ${addr} already registered as producer ${existing}`);
        return existing;
      }
    }
    return registerAndReadId(() => register.registerProducer(addr), 'ProducerRegistered', 'producerId');
  }

  async function ensureSupplier(addr: string): Promise<number> {
    if ((await nrgst.balanceOf(addr)).gt(0)) {
      const next = await register.currentSupplierId();
      const existing = await findOwnedTokenId(id => nrgst.ownerOf(id), next, addr);
      if (existing != null) {
        console.log(`  ${addr} already registered as supplier ${existing}`);
        return existing;
      }
    }
    return registerAndReadId(() => register.registerSupplier(addr), 'SupplierRegistered', 'supplierId');
  }

  async function ensureOracle(addr: string): Promise<number> {
    if ((await nrgopt.balanceOf(addr)).gt(0)) {
      const next = await register.currentOracleProviderId();
      const existing = await findOwnedTokenId(id => nrgopt.ownerOf(id), next, addr);
      if (existing != null) {
        console.log(`  ${addr} already registered as oracle ${existing}`);
        return existing;
      }
    }
    return registerAndReadId(
      () => register.registerOracleProvider(addr),
      'OracleProviderRegistered',
      'oracleProviderId',
    );
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

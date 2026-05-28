import hre, { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ContractFactory } from 'ethers';
import {
  ElectricityConsumerToken,
  EnergyCreditToken,
  EnergyOracle,
  EnergyOracleProviderToken,
  EnergyProducerToken,
  EnergySupplierToken,
  ERC20Mock,
  Escrow,
  Main,
  MicrogridGovernanceToken,
  Register,
  StakingReward,
} from '../../typechain';

dotenv.config();

const FEE_AMOUNT = 10;

// Reads an externally-deployed stablecoin address from the environment, e.g.
// `BASE_SEPOLIA_USDC`. Returns undefined when unset so the deployer falls back
// to an ERC20Mock stand-in.
function readStablecoin(network: string, label: 'USDC' | 'DAI' | 'USDT'): string | undefined {
  const key = `${network.toUpperCase()}_${label}`;
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

async function maybeDeployMock(label: string, real?: string): Promise<string> {
  if (real) {
    console.log(`Using real ${label} at ${real}`);
    return real;
  }
  console.log(`Deploying ERC20Mock as ${label} stand-in`);
  const Factory: ContractFactory = await ethers.getContractFactory('ERC20Mock');
  const mock = (await Factory.deploy()) as ERC20Mock;
  await mock.deployed();
  console.log(`${label} (mock) deployed to ${mock.address}`);
  return mock.address;
}

async function main(): Promise<void> {
  const networkName = hre.network.name;
  const [deployer] = await ethers.getSigners();

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network:  ${networkName}`);
  console.log('Deployment process - start');

  console.log('EnergyCreditToken (NRGCT) deployment');
  const NRGCT: ContractFactory = await ethers.getContractFactory('EnergyCreditToken');
  const nrgct = (await NRGCT.deploy()) as EnergyCreditToken;
  await nrgct.deployed();
  console.log(`NRGCT deployed to ${nrgct.address}`);

  console.log('MicrogridGovernanceToken (MGT) deployment');
  const MGT: ContractFactory = await ethers.getContractFactory('MicrogridGovernanceToken');
  const mgt = (await MGT.deploy()) as MicrogridGovernanceToken;
  await mgt.deployed();
  console.log(`MGT deployed to ${mgt.address}`);

  console.log('EnergyProducerToken (NRGPT) deployment');
  const NRGPT: ContractFactory = await ethers.getContractFactory('EnergyProducerToken');
  const nrgpt = (await NRGPT.deploy()) as EnergyProducerToken;
  await nrgpt.deployed();
  console.log(`NRGPT deployed to ${nrgpt.address}`);

  console.log('EnergySupplierToken (NRGST) deployment');
  const NRGST: ContractFactory = await ethers.getContractFactory('EnergySupplierToken');
  const nrgst = (await NRGST.deploy()) as EnergySupplierToken;
  await nrgst.deployed();
  console.log(`NRGST deployed to ${nrgst.address}`);

  console.log('EnergyOracleProviderToken (NRGOPT) deployment');
  const NRGOPT: ContractFactory = await ethers.getContractFactory('EnergyOracleProviderToken');
  const nrgopt = (await NRGOPT.deploy()) as EnergyOracleProviderToken;
  await nrgopt.deployed();
  console.log(`NRGOPT deployed to ${nrgopt.address}`);

  console.log('ElectricityConsumerToken (ELCT) deployment');
  const ELCT: ContractFactory = await ethers.getContractFactory('ElectricityConsumerToken');
  const elct = (await ELCT.deploy()) as ElectricityConsumerToken;
  await elct.deployed();
  console.log(`ELCT deployed to ${elct.address}`);

  const usdcAddress = await maybeDeployMock('USDC', readStablecoin(networkName, 'USDC'));
  const daiAddress = await maybeDeployMock('DAI', readStablecoin(networkName, 'DAI'));
  const usdtAddress = await maybeDeployMock('USDT', readStablecoin(networkName, 'USDT'));

  console.log('Main deployment');
  const Tokens: Main.TokensStruct = {
    energyCreditToken: nrgct.address,
    microgridGovernanceToken: mgt.address,
    energyProducerToken: nrgpt.address,
    energySupplierToken: nrgst.address,
    energyOracleProviderToken: nrgopt.address,
    electricityConsumerToken: elct.address,
  };

  const Fees: Main.FeesStruct = {
    receiver: deployer.address,
    amount: FEE_AMOUNT,
  };

  const MainFactory: ContractFactory = await ethers.getContractFactory('Main');
  const main = (await MainFactory.deploy(Tokens, Fees, usdcAddress, daiAddress, usdtAddress)) as Main;
  await main.deployed();
  console.log(`Main deployed to ${main.address}`);

  console.log('Register deployment');
  const RegisterFactory: ContractFactory = await ethers.getContractFactory('Register');
  const register = (await RegisterFactory.deploy(main.address)) as Register;
  await register.deployed();
  console.log(`Register deployed to ${register.address}`);

  console.log('Escrow deployment');
  const EscrowFactory: ContractFactory = await ethers.getContractFactory('Escrow');
  const escrow = (await EscrowFactory.deploy(main.address)) as Escrow;
  await escrow.deployed();
  console.log(`Escrow deployed to ${escrow.address}`);

  console.log('EnergyOracle deployment');
  const EnergyOracleFactory: ContractFactory = await ethers.getContractFactory('EnergyOracle');
  const energyOracle = (await EnergyOracleFactory.deploy(main.address)) as EnergyOracle;
  await energyOracle.deployed();
  console.log(`EnergyOracle deployed to ${energyOracle.address}`);

  console.log('StakingReward deployment');
  const StakingRewardFactory: ContractFactory = await ethers.getContractFactory('StakingReward');
  const staking = (await StakingRewardFactory.deploy(main.address)) as StakingReward;
  await staking.deployed();
  console.log(`StakingReward deployed to ${staking.address}`);

  console.log('Wiring contracts on Main');
  const Contracts: Main.ContractsStruct = {
    staking: staking.address,
    oracle: energyOracle.address,
    register: register.address,
    escrow: escrow.address,
  };
  await (await main.changeContracts(Contracts)).wait();

  console.log('Granting roles');
  const minter = await mgt.MINTER_ROLE();
  const burner = await mgt.BURNER_ROLE();
  const escrowRole = await energyOracle.ESCROW();

  await (await nrgpt.setRole(register.address, minter, true)).wait();
  await (await nrgpt.setRole(register.address, burner, true)).wait();
  await (await nrgst.setRole(register.address, minter, true)).wait();
  await (await nrgst.setRole(register.address, burner, true)).wait();
  await (await nrgopt.setRole(register.address, minter, true)).wait();
  await (await nrgopt.setRole(register.address, burner, true)).wait();
  await (await elct.setRole(register.address, minter, true)).wait();
  await (await elct.setRole(register.address, burner, true)).wait();

  await (await nrgct.setRole(energyOracle.address, minter, true)).wait();
  await (await nrgct.setRole(energyOracle.address, burner, true)).wait();
  await (await mgt.setRole(energyOracle.address, minter, true)).wait();

  await (await mgt.setRole(staking.address, minter, true)).wait();

  await (await energyOracle.setRole(escrow.address, escrowRole, true)).wait();

  console.log('Roles granted');

  const addresses = {
    NRGCT: nrgct.address,
    MGT: mgt.address,
    NRGPT: nrgpt.address,
    NRGST: nrgst.address,
    NRGOPT: nrgopt.address,
    ELCT: elct.address,
    USDC: usdcAddress,
    DAI: daiAddress,
    USDT: usdtAddress,
    Main: main.address,
    Register: register.address,
    Escrow: escrow.address,
    EnergyOracle: energyOracle.address,
    StakingReward: staking.address,
  };

  const outDir = path.join(process.cwd(), 'deployed');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `deployed_addresses_${networkName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
  console.log(`Deployed addresses written to ${filePath}`);

  console.log('Deployment process - end');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

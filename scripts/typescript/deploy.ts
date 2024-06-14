import hre, { ethers } from 'hardhat';
import { ECU, EnergyOracle, Escrow, MGT, Main, Manager, NRGS, Register, StakingReward } from '../../typechain';
import {
  deployMGT,
  deployECU,
  deployNRGS,
  deployManager,
  deployEscrow,
  deployRegister,
  deployStaking,
  deployMain,
  deployEnergyOracle,
} from './index';
import { ContractFactory } from 'ethers';

let
  minter_role: string,
  escrow_manager: string,
  register_role: string,
  energy_oracle_provider_role: string,
  _escrow_: string,
  register_manger_role: string,
  staking_manager_role: string;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deployment process - start');

  console.log(`ECU deployment`);
  const ECU: ContractFactory = await ethers.getContractFactory('ECU');
  const ecu = (await ECU.deploy()) as ECU;
  await ecu.deployed();
  console.log(`ECU deployed to ${ecu.address}`);

  console.log(`MGT deployment`);
  const MGT: ContractFactory = await ethers.getContractFactory('MGT');
  const MGT = (await MGT.deploy()) as MGT;
  await MGT.deployed();
  console.log(`MGT deployed to ${MGT.address}`);

  console.log(`NRGS deployment`);
  const NRGS: ContractFactory = await ethers.getContractFactory('NRGS');
  const nrgs = (await NRGS.deploy()) as NRGS;
  await nrgs.deployed();
  console.log(`NRGS deployed to ${nrgs.address}`);

  console.log(`Manager deployment`);
  const feeReceiver = deployer.address;
  const reward = 10;
  const tolerance = 5;
  const fees = 10;

  const Manager: ContractFactory = await ethers.getContractFactory('Manager');
  const manager = (await Manager.deploy(
    MGT.address,
    ecu.address,
    nrgs.address,
    feeReceiver,
    reward,
    tolerance,
    fees,
  )) as Manager;
  await manager.deployed();
  console.log(`Manager deployed to ${manager.address}`);

  console.log(`Escrow deployment`);
  const Escrow: ContractFactory = await ethers.getContractFactory('Escrow');
  const escrow = (await Escrow.deploy(manager.address)) as Escrow;
  await escrow.deployed();
  console.log(`Escrow deployed to ${escrow.address}`);

  console.log(`EnergyOracle deployment`);
  const EnergyOracle: ContractFactory = await ethers.getContractFactory('EnergyOracle');
  const energyOracle = (await EnergyOracle.deploy(manager.address)) as EnergyOracle;
  await energyOracle.deployed();
  console.log(`EnergyOracle deployed to ${energyOracle.address}`);

  console.log(`Register deployment`);
  const Register: ContractFactory = await ethers.getContractFactory('Register');
  const register = (await Register.deploy(manager.address)) as Register;
  await register.deployed();
  console.log(`Register deployed to ${register.address}`);

  console.log(`StakingReward deployment`);
  const StakingReward: ContractFactory = await ethers.getContractFactory('StakingReward');
  const stakingReward = (await StakingReward.deploy(manager.address)) as StakingReward;
  await stakingReward.deployed();
  console.log(`StakingReward deployed to ${stakingReward.address}`);

  console.log(`Main deployment`);
  const Main: ContractFactory = await ethers.getContractFactory('Main');
  const main = (await Main.deploy(manager.address)) as Main;
  await main.deployed();
  console.log(`Main deployed to ${main.address}`);

  console.log('Deployment process - end');

  console.log('Manager set up - start');
  await manager.changeEnergyOracle(energyOracle.address);
  await manager.changeRegister(register.address);
  await manager.changeEscrow(escrow.address);
  await manager.changeStakingContract(stakingReward.address);
  console.log('Manager set up - end');

  // Roles definition
  minter_role = await MGT.MINTER_BURNER_ROLE();

  register_role = await nrgs.REGISTER_ROLE();

  escrow_manager = await escrow.ESCROW_MANAGER_ROLE();

  energy_oracle_provider_role = await energyOracle.ENERGY_ORACLE_PROVIDER_ROLE();
  _escrow_ = await energyOracle.ESCROW();

  register_manger_role = await register.REGISTER_MANAGER_ROLE();

  staking_manager_role = await stakingReward.STAKING_MANAGER_ROLE();

  console.log('Granting roles - start');
  await register.grantRole(register_manger_role, main.address);
  await escrow.grantRole(escrow_manager, main.address);
  await stakingReward.grantRole(staking_manager_role, main.address);
  await stakingReward.grantRole(staking_manager_role, register.address);
  await energyOracle.grantRole(energy_oracle_provider_role, main.address);
  await energyOracle.grantRole(_escrow_, escrow.address);

  await ecu.grantRole(register_role, register.address);
  await nrgs.grantRole(register_role, register.address);
  await MGT.grantRole(minter_role, stakingReward.address);
  await MGT.grantRole(minter_role, energyOracle.address);
  console.log('Granting roles - end');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

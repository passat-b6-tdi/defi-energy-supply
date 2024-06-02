import hre, { ethers } from 'hardhat';
import { ELU, EnergyOracle, Escrow, MCGR, Main, Manager, NRGS, Register, StakingReward } from '../../typechain';
import { deployMCGR, deployELU, deployNRGS, deployManager, deployEscrow, deployRegister, deployStaking, deployMain, deployOracle } from './index';

let admin_role: string, minter_role: string, escrow_manager: string, register_role: string, energy_oracle_manager_role: string, oracle_provider_role: string, _escrow_: string, register_manger_role: string, staking_manager_role: string, main_manager_role: string, supplier_role: string, user_role: string;

async function main() {
  console.log("Deployment process - start");

  const mcgr: MCGR = await deployMCGR();
  const nrgs: NRGS = await deployNRGS();
  const elu: ELU = await deployELU();

  const manager: Manager = await deployManager(elu.address, mcgr.address, nrgs.address);

  const escrow: Escrow = await deployEscrow(manager.address);
  const register: Register = await deployRegister(manager.address);
  const stakingReward: StakingReward = await deployStaking(manager.address);

  const oracle: EnergyOracle = await deployOracle(manager.address);
  const main: Main = await deployMain(manager.address);
  console.log("Deployment process - end");


  console.log("Manager set up");
  await manager.changeOracle(oracle.address);
  await manager.changeRegister(register.address);
  await manager.changeEscrow(escrow.address);
  await manager.changeStakingContract(stakingReward.address);
  console.log("Done");

  admin_role = await mcgr.DEFAULT_ADMIN_ROLE();
  minter_role = await mcgr.MINTER_BURNER_ROLE();

  register_role = await nrgs.REGISTER_ROLE();

  escrow_manager = await escrow.ESCROW_MANAGER_ROLE();

  energy_oracle_manager_role = await oracle.ENERGY_ORACLE_MANAGER_ROLE();
  oracle_provider_role = await oracle.ORACLE_PROVIDER_ROLE();
  _escrow_ = await oracle.ESCROW();

  register_manger_role = await register.REGISTER_MANAGER_ROLE();

  staking_manager_role = await stakingReward.STAKING_MANAGER_ROLE();

  main_manager_role = await main.MAIN_MANAGER_ROLE();
  supplier_role = await main.SUPPLIER_ROLE();
  user_role = await main.USER_ROLE();

  console.log("Granting roles")
  await register.grantRole(register_manger_role, main.address);
  await escrow.grantRole(escrow_manager, main.address);
  await stakingReward.grantRole(staking_manager_role, main.address);
  await stakingReward.grantRole(staking_manager_role, register.address);
  await oracle.grantRole(oracle_provider_role, main.address);
  await oracle.grantRole(_escrow_, escrow.address);

  await elu.grantRole(register_role, register.address);
  await nrgs.grantRole(register_role, register.address);
  await mcgr.grantRole(minter_role, stakingReward.address);
  await mcgr.grantRole(minter_role, oracle.address);
  console.log("Done");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

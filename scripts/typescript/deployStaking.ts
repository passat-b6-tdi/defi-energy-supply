import { BytesLike, ContractFactory } from 'ethers';
import { ethers } from 'hardhat';
import { StakingReward } from '../../typechain';

const MANAGER_ADDRESS: BytesLike = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

export async function deployStaking(manager_address: BytesLike): Promise<StakingReward> {
  console.log(`StakingReward deployment`);

  const StakingReward: ContractFactory = await ethers.getContractFactory('StakingReward');
  const stakingReward = await StakingReward.deploy(manager_address) as StakingReward;
  await stakingReward.deployed();

  console.log(`StakingReward deployed to ${stakingReward.address}`);

  return stakingReward;
}

async function main() {
  await deployStaking(MANAGER_ADDRESS);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

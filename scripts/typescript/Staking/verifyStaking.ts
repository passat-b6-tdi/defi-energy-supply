import { verifyContract } from '../helpers/verify-contract';
import { ethers } from 'hardhat';

const Manager = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

const FixedPointMath = '0x19D1BDD343C3Ecdeb168D09573e5248B5F824e0E'
const StakingReward = '0xeCC73646565e17C253f230215a125E175476566b'

async function main(): Promise<void> {
	await verifyContract(FixedPointMath);

	await verifyContract(StakingReward, [Manager]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});

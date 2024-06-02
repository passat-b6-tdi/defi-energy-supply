import { verifyContract } from '../helpers/verify-contract';
import { ethers } from 'hardhat';

const Manager = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

const Escrow = '0x26367A9c65d9627EFd0c5eb62B984A13941aaBb6'

async function main(): Promise<void> {

	await verifyContract(Escrow, [Manager]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});

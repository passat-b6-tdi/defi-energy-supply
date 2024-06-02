import { verifyContract } from '../helpers/verify-contract';
import { ethers } from 'hardhat';

const Manager = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

const Register = '0xE59474b146d750022c5E3C9376d74D0Ca31D7008'

async function main(): Promise<void> {

	await verifyContract(Register, [Manager]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});

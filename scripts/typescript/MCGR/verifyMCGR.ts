import { verifyContract } from '../helpers/verify-contract';

const MCGR = '0x2F176C9145DF9943f7ad31E4DEFC1290bDe54D32';

async function main(): Promise<void> {
	await verifyContract(MCGR);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});

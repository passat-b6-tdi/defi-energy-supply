import { verifyContract } from '../helpers/verify-contract';

const NRGS = '0xCd144d7bfE80D0300F1Ec64CbFc97109777F15Bc';

async function main(): Promise<void> {
	await verifyContract(NRGS);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});

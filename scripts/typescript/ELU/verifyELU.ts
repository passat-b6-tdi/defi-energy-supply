import { verifyContract } from '../helpers/verify-contract';

const ELU = '0xd31f9437602E985c19a3Ee11B35d76F5d1DA4235';

async function main(): Promise<void> {
	await verifyContract(ELU);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});

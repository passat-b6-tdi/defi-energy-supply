import { verifyContract } from '../helpers/verify-contract';
import { ethers } from 'hardhat';

const Manager = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

const ELU = '0xd31f9437602E985c19a3Ee11B35d76F5d1DA4235';
const MCGR = '0x2F176C9145DF9943f7ad31E4DEFC1290bDe54D32';
const NRGS = '0xCd144d7bfE80D0300F1Ec64CbFc97109777F15Bc';

const reward = 10;
const tolerance = 5;
const fees = 10;

async function main(): Promise<void> {
	const [deployer] = await ethers.getSigners();

	const feeReceiver = deployer.address;

	await verifyContract(Manager, [MCGR, ELU, NRGS, feeReceiver, reward, tolerance, fees]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});

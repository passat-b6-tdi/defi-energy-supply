import { BytesLike } from 'ethers';
import { verifyContract } from './helpers/verify-contract';
import { ethers } from 'hardhat';

const ELU = '0xd31f9437602E985c19a3Ee11B35d76F5d1DA4235';
const MCGR = '0x2F176C9145DF9943f7ad31E4DEFC1290bDe54D32';
const NRGS = '0xCd144d7bfE80D0300F1Ec64CbFc97109777F15Bc';

const reward = 10;
const tolerance = 5;
const fees = 10;
const Manager = '0x61E0e280B1E05FCEfb684dd729cDe782fd98cd40';

const Escrow = '0x26367A9c65d9627EFd0c5eb62B984A13941aaBb6';
const Main = '0xcF81B08cbCa47fcbB4669c002774c7C405AD67dD';
const Oracle = '0xB99B7a11B0e6BF8F0220f7C4E9Bd5BA37d195da5';
const Register = '0xE59474b146d750022c5E3C9376d74D0Ca31D7008';
const FixedPointMath = '0x19D1BDD343C3Ecdeb168D09573e5248B5F824e0E'
const StakingReward = '0xeCC73646565e17C253f230215a125E175476566b'


async function main(): Promise<void> {
	const [deployer] = await ethers.getSigners();

	await verifyELU();
	await verifyMCGR();
	await verifyNRGS();

	await verifyManager(deployer.address);

	if (Manager != undefined && Manager != '') {
		await verifyEscrow(Manager);
		await verifyMain(Manager);
		await verifyOracle(Manager);
		await verifyRegister(Manager);
		await verifyStaking(Manager);
	}
}

async function verifyELU(): Promise<void> {
	if (ELU != undefined && ELU != '') {
		await verifyContract(ELU);
	}
}

async function verifyMCGR(): Promise<void> {
	if (MCGR != undefined && MCGR != '') {
		await verifyContract(MCGR);
	}
}

async function verifyNRGS(): Promise<void> {
	if (NRGS != undefined && NRGS != '') {
		await verifyContract(NRGS);
	}
}

async function verifyManager(feeReceiver: BytesLike): Promise<void> {
	if ((ELU != undefined && ELU != '') && (NRGS != undefined && NRGS != '') && (MCGR != undefined && MCGR != '')) {
		await verifyContract(Manager, [MCGR, ELU, NRGS, feeReceiver, reward, tolerance, fees]);
	}
}

async function verifyEscrow(manager_address: BytesLike): Promise<void> {
	if (Escrow != undefined && Escrow != '') {
		await verifyContract(Escrow, [manager_address]);
	}
}

async function verifyOracle(manager_address: BytesLike): Promise<void> {
	if (Oracle != undefined && Oracle != '') {
		await verifyContract(Oracle, [manager_address]);
	}
}

async function verifyMain(manager_address: BytesLike): Promise<void> {
	if (Main != undefined && Main != '') {
		await verifyContract(Main, [manager_address]);
	}
}

async function verifyRegister(manager_address: BytesLike): Promise<void> {
	if (Register != undefined && Register != '') {
		await verifyContract(Register, [manager_address]);
	}
}

async function verifyStaking(manager_address: BytesLike): Promise<void> {
	if (FixedPointMath != undefined && FixedPointMath != '') {
		await verifyContract(FixedPointMath);
	}

	if (StakingReward != undefined && StakingReward != '') {
		await verifyContract(StakingReward, [manager_address]);
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});

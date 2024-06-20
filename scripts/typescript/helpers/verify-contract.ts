import hre from 'hardhat';
import { ignoreAlreadyVerifiedError } from './ignore-already-verified-error';

export const verifyContract = async (
  address: string,
  constructorArguments: Array<unknown> = [],
  contract: string
): Promise<void> => {
  console.log(`Trying to verify ${address}\n`);
  try {
    await hre.run('verify:verify', {
      address,
      constructorArguments,
      contract
    });
    console.log('Successfully verified!');
  } catch (err) {
    console.log('Verification failed!!!');
    ignoreAlreadyVerifiedError(err);
  }
};

#!/usr/bin/env node
/*
 * Patches @nomiclabs/hardhat-etherscan to use the modern Solidity binary mirror.
 *
 * The plugin hardcodes the legacy host `solc-bin.ethereum.org`, which no longer
 * resolves. We replace it with `binaries.soliditylang.org` (Solidity Foundation).
 * Idempotent — safe to run on every install.
 *
 * Runs automatically via `postinstall` in package.json.
 */
const fs = require('fs');
const path = require('path');

const TARGET = path.join(
  __dirname,
  '..',
  'node_modules',
  '@nomiclabs',
  'hardhat-etherscan',
  'dist',
  'src',
  'solc',
  'version.js',
);

const OLD_HOST = 'solc-bin.ethereum.org';
const NEW_HOST = 'binaries.soliditylang.org';

function main() {
  if (!fs.existsSync(TARGET)) {
    return;
  }

  const original = fs.readFileSync(TARGET, 'utf8');
  if (!original.includes(OLD_HOST)) {
    return;
  }

  const patched = original.split(OLD_HOST).join(NEW_HOST);
  fs.writeFileSync(TARGET, patched);
  console.log(`[patch-hardhat-etherscan] replaced ${OLD_HOST} -> ${NEW_HOST}`);
}

main();

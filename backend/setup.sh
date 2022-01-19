#!/usr/bin/env bash

# Install dependencies
npm install dotenv
npm install @truffle/hdwallet-provider@1.2.3
npm install -D truffle-plugin-verify

# Deploy contracts
truffle migrate --reset --network BSCmainnet

# Verify Contracts on BSCscan GETO
truffle run verify GetoToken --network BSCmainnet --license SPDX-License-Identifier
truffle run verify GetoReserve --network BSCmainnet --license SPDX-License-Identifier
truffle run verify GetoBank --network BSCmainnet --license SPDX-License-Identifier
truffle run verify GetoBroker --network BSCmainnet --license SPDX-License-Identifier
truffle run verify GetoBureau --network BSCmainnet --license SPDX-License-Identifier
truffle run verify GovernorAlpha --network BSCmainnet --license SPDX-License-Identifier
truffle run verify Migrations --network BSCmainnet --license SPDX-License-Identifier
truffle run verify Migrator --network BSCmainnet --license SPDX-License-Identifier
truffle run verify MockBEP20 --network BSCmainnet --license SPDX-License-Identifier
truffle run verify Timelock --network BSCmainnet --license SPDX-License-Identifier
truffle run verify WBNB --network BSCmainnet --license SPDX-License-Identifier
truffle run verify UniMigrator --network BSCmainnet --license SPDX-License-Identifier

# Verify Contracts on BSCscan GETOswap
truffle run verify GetoswapV2BEP20 --network BSCmainnet --license SPDX-License-Identifier
truffle run verify GetoswapV2Factory --network BSCmainnet --license SPDX-License-Identifier
truffle run verify GetoswapV2Pair --network BSCmainnet --license SPDX-License-Identifier
truffle run verify GetoswapV2Router02 --network BSCmainnet --license SPDX-License-Identifier

# Flatten Contracts GETO
./node_modules/.bin/truffle-flattener contracts/GetoToken.sol > flats/GetoToken_flat.sol
./node_modules/.bin/truffle-flattener contracts/GetoReserve.sol > flats/GetoReserve_flat.sol
./node_modules/.bin/truffle-flattener contracts/GetoBank.sol > flats/GetoBank_flat.sol
./node_modules/.bin/truffle-flattener contracts/GetoBroker.sol > flats/GetoBroker_flat.sol
./node_modules/.bin/truffle-flattener contracts/GetoBureau.sol > flats/GetoBureau_flat.sol
./node_modules/.bin/truffle-flattener contracts/GovernorAlpha.sol > flats/GovernorAlpha_flat.sol
./node_modules/.bin/truffle-flattener contracts/Migrations.sol > flats/Migrations_flat.sol
./node_modules/.bin/truffle-flattener contracts/Migrator.sol > flats/Migrator_flat.sol
./node_modules/.bin/truffle-flattener contracts/MockBEP20.sol > flats/MockBEP20_flat.sol
./node_modules/.bin/truffle-flattener contracts/Timelock.sol > flats/Timelock_flat.sol
./node_modules/.bin/truffle-flattener contracts/WBNB.sol > flats/WBNB_flat.sol
./node_modules/.bin/truffle-flattener contracts/UniMigrator.sol > flats/UniMigrator_flat.sol

# Flatten Contracts GETOswap
./node_modules/.bin/truffle-flattener contracts/GetoswapV2BEP20.sol > flats/GetoswapV2BEP20_flat.sol
./node_modules/.bin/truffle-flattener contracts/GetoswapV2Factory.sol > flats/GetoswapV2Factory_flat.sol
./node_modules/.bin/truffle-flattener contracts/GetoswapV2Pair.sol > flats/GetoswapV2Pair_flat.sol
./node_modules/.bin/truffle-flattener contracts/GetoswapV2Router02.sol > flats/GetoswapV2Router02_flat.sol


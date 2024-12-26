require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy") /////////////////////////////////// yarn add hardhat-deploy
require('@nomiclabs/hardhat-ethers'); /////////////////////////////////// yarn add hardhat-deploy
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

// yarn global add hardhat-shorthand

const RPC_URL_SEPOLIA = process.env.RPC_URL_SEPOLIA;
const PRIVATE_KEY_MINE = process.env.PRIVATE_KEY_MINE;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [{version: "0.8.28"}, {version: "0.8.4"}],
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [PRIVATE_KEY],
      chainId: 31337,
      blockConfirmations: 1,
    },
    sepolia: {
      url: RPC_URL_SEPOLIA,
      accounts: [PRIVATE_KEY_MINE],
      chainId: 11155111,
      blockConfirmations: 6, // how many blocks we wanna wait 
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user: {
      default: 1,
    },
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    offline: true,
    // token: "MATIC",
  },
  coverage: {
    enabled: true,
    outputFile: "coverage-report.txt",
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
}

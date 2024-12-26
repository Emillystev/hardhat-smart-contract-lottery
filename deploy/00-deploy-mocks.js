const {getNamedAccounts, ethers} = require("hardhat");
const { network } = require("hardhat")
const {developmentChains} = require("../helper-hardhat-config");

const BASE_FEE = "250000000000000000" //ethers.parseEther("0.25"); // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

module.exports = async({getNamedAccounts, deployments}) => {
    const {deployer} = await getNamedAccounts();
    const {deploy, log} = deployments;
    const chainId = network.config.chainId;
    const args = [BASE_FEE, GAS_PRICE_LINK];

    if(developmentChains.includes(network.name)){
        const mocks = await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            args: args,
        });
        log("mocks deployed");
        log("-----------------------------");
        // log(mocks.abi.name.createSubscription)
    }
}

module.exports.tags = ["all", "mocks"];




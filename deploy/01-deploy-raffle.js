const {getNamedAccounts, ethers} = require("hardhat")
const {networkConfig, developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS} = require("../helper-hardhat-config");


const FUND_AMOUNT = ethers.parseEther("1")
const BASE_FEE = "250000000000000000" //ethers.parseEther("0.25"); // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deployer} = await getNamedAccounts();
    const {deploy, log} = deployments;
    const chainId = network.config.chainId;
    let vrfCoordinatorV2Address;
    let subscriptionId;
    let vrfCoordinatorV2Mock;
    const mockArgs = [BASE_FEE, GAS_PRICE_LINK];


    if(developmentChains.includes(network.name)){
        const vrfCoordinatorV2Mock = await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            args: mockArgs,
        });
        log("mocks deployed");
        log("-----------------------------");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        log(`vrfCoordinatorV2Address: ${vrfCoordinatorV2Address}`)
    }

    //console.log(`mocks address: ${}`)

    if(developmentChains.includes(network.name)){
        const mocks = await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: mockArgs,
        });
        log("mocks deployed");
        log("-----------------------------");
        vrfCoordinatorV2Address = mocks.address
        log(`vrfCoordinatorV2Address: ${vrfCoordinatorV2Address}`)
        const vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfCoordinatorV2Address)
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait();
        // subscriptionId = transactionReceipt.events[0].args.subId;
        subscriptionId = 1
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else{
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    console.log("-------------------")
    console.log(vrfCoordinatorV2Address)
    console.log("-------------------")


    const entranceFee = networkConfig[chainId]["raffleEntranceFee"]
    const interval = networkConfig[chainId]["keepersUpdateInterval"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]

    // console.log(networkConfig[chainId]["raffleEntranceFee"])
    // console.log(networkConfig[chainId]["keepersUpdateInterval"])
    // console.log(networkConfig[chainId]["gasLane"])
    // console.log(networkConfig[chainId]["callbackGasLimit"])

    const args = [vrfCoordinatorV2Address, subscriptionId, gasLane, interval, entranceFee, callbackGasLimit];

    const raffle = await deploy("Raffle", {
        contract: "Raffle",
        from: deployer,
        args: args,
        log: true,
        blockConfirmations: network.config.blockConfirmations || 1,
    });
}

module.exports.tags = ["all", "raffle"];


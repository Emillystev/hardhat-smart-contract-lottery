const {deployments, getNamedAccounts, ethers} = require("hardhat");
const {assert, expect} = require("chai");
const {developmentChains, networkConfig} = require("../../helper-hardhat-config")
const JSONbig = require("json-bigint");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", async function(){
        let raffle, deployer, player1, vrfCoordinatorV2Mock, raffleEntranceFee, raffleContract, interval;
        const chainId = network.config.chainId
        const deploy = deployments;
        beforeEach(async function(){
            
            [deployer, player1] = await ethers.getSigners();
            await deployments.fixture(["all"]);
            raffleContract = await ethers.getContract("Raffle", deployer)
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            raffle = raffleContract.connect(player1)
            raffleEntranceFee = await raffleContract.getEntranceFee()
            interval = await raffle.getInterval()
        })
        describe("constructor", async function(){
            it("ipen state", async function(){
                const getter = await raffleContract.getRaffleState()
                assert.equal(getter.toString(), "0")
            })
            it("interval", async function(){
                const getInterval = await raffleContract.getInterval()
                const configInterval = networkConfig[chainId]["keepersUpdateInterval"]
                assert.equal(getInterval.toString(), configInterval.toString())
            })

            it("entranceFee", async function(){
                const getEntranceFee = await raffleContract.getEntranceFee()
                const configEntranceFee = networkConfig[chainId]["raffleEntranceFee"]
                assert.equal(getEntranceFee.toString(), configEntranceFee.toString())
            })
            it("getGasLane", async function(){
                const getGasLane = await raffleContract.getGasLane()
                const configGasLane = networkConfig[chainId]["gasLane"]
                expect(getGasLane).to.be.equal(configGasLane)
            })
            it("callbackGasLimit", async function(){
                const getCallbackGasLimit = await raffleContract.getCallbackGasLimit();
                const configCallbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
                expect(getCallbackGasLimit.toString()).to.be.equal(configCallbackGasLimit.toString())
            })
            it("subscriptionId", async function(){
                const getSubscriptionId = await raffleContract.getSubscriptionId()
                const configSubscriptionId = networkConfig[chainId]["subscriptionId"]
                const subscriptionId = 1;
                assert.equal(getSubscriptionId.toString(), subscriptionId.toString())
            })
            it("TimeStamp", async function(){
                const getLastTimeStamp = await raffleContract.getLastTimeStamp();
                const blockNumBefore = await ethers.provider.getBlockNumber();
                const blockBefore = await ethers.provider.getBlock(blockNumBefore);
                const timestampBefore = blockBefore.timestamp;
                expect(getLastTimeStamp.toString()).to.be.equal(timestampBefore.toString())
            })
        })
        describe("enterRaffle", async function(){
            it("enterRaffle fails if not enough eth", async function(){
                expect(raffleContract.enterRaffle()).to.be.revertedWithCustomError(raffleContract, "Raffle__NotEnoughETHEnterned");
            })
            it("enterRaffle initializes at open state", async function(){
                raffleContract.enterRaffle({value: raffleEntranceFee})
                const getState = await raffleContract.getRaffleStateIndexed(0)
                const stateIndex = 0;
                assert.equal(getState, stateIndex)
                const getter = await raffleContract.getRaffleState()
                assert.equal(getter, stateIndex)
            })
            it("if enterRaffle doesnt initializes to open state, it will revert", async function(){
                raffleContract.enterRaffle({value: raffleEntranceFee})
                const getState = await raffleContract.getRaffleStateIndexed(0)
                const stateIndex = !0;
                expect(assert.notEqual(getState, stateIndex)).to.be.revertedWithCustomError(raffleContract, "Raffle__RaffleNotOpen")
            })
            it("message sender is pushing into players array", async function(){
                await raffle.enterRaffle({value: raffleEntranceFee})
                const player = await raffleContract.getPlayer(0)
                assert.equal(player, player1.address)
            })
            it("message sender is pushing into players array works for many players", async function(){
                raffleContract.enterRaffle({value: raffleEntranceFee})
                await raffle.enterRaffle({value: raffleEntranceFee})
                const getPlayers = await raffleContract.getPlayers()
                const playersLengthByFunctions = getPlayers.length
                const playersLength = 2
                assert.equal(playersLength, playersLength)
            })
            it("doesn't allow entrance when raffle is calculating", async function(){
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
                await network.provider.send("evm_increaseTime", [BigInt(interval + 1n).toString()])
                await network.provider.request({ method: "evm_mine", params: [] }) // create new blocks
                // we pretend to be a keeper for a second
                await raffleContract.performUpkeep("0x") // changes the state to calculating for our comparison below
                await expect(raffleContract.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWithCustomError( // is reverted as raffle is calculating
                    raffleContract,
                    "Raffle__RaffleNotOpen"
                )
            })
            it("enterRaffle emits an RaffleEnter event", async function(){
                await expect(raffleContract.enterRaffle({value: raffleEntranceFee})).to.emit(raffleContract, "RaffleEnter")
            })
        })
        describe("checkUpkeep", async function(){
            it("returns false if people haven't sent any ETH", async function(){
                await network.provider.send("evm_increaseTime", [BigInt(interval + 1n).toString()])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await raffleContract.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(!upkeepNeeded)
            })
            it("returns false if raffle isn't open", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [BigInt(interval + 1n).toString()])
                await network.provider.request({ method: "evm_mine", params: [] })
                await raffleContract.performUpkeep("0x") // changes the state to calculating
                const raffleState = await raffleContract.getRaffleState() // stores the new state
                const { upkeepNeeded } = await raffleContract.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert.equal(raffleState.toString() == "1", upkeepNeeded == false)
            })
            it("returns false if enough time hasn't passed", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [BigInt(interval - 5n).toString()]) // use a higher number here if this test fails
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await raffleContract.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(!upkeepNeeded)
            })
            it("returns true if enough time has passed, has players, eth, and is open", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [BigInt(interval + 1n).toString()])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await raffle.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(upkeepNeeded)
            })
        })
        describe("performUpkeep", function () {
            it("can only run if checkupkeep is true", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [BigInt(interval + 1n).toString()])
                await network.provider.request({ method: "evm_mine", params: [] })
                const tx = await raffleContract.performUpkeep("0x") 
                assert(tx)
            })
            it("reverts if checkup is false", async () => {
                await expect(raffleContract.performUpkeep("0x")).to.be.revertedWithCustomError( 
                    raffleContract,
                    "Raffle__UpkeepNotNeeded"
                )
            })
            it("updates the raffle state and emits a requestId", async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [BigInt(interval + 1n).toString()])
                await network.provider.request({ method: "evm_mine", params: [] })
                const txResponse = await raffleContract.performUpkeep("0x") // emits requestId
                const txReceipt = await txResponse.wait(1) // waits 1 block
                const raffleState = await raffleContract.getRaffleState() // updates state
                // const requestId = txReceipt.events[0].args.requestId
                // assert(requestId.toNumber() > 0)
                assert(raffleState == 1) // 0 = open, 1 = calculating
            })
        })
        describe("fulfillRandomWords", function () {
            beforeEach(async () => {
                await raffleContract.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [BigInt(interval + 1n).toString()])
                await network.provider.request({ method: "evm_mine", params: [] })
            })
        })
        describe("getter view/pure functions", async function(){
            it("getRequestConfirmations pure function", async function(){
                const getterRequestConfirmations = await raffleContract.getRequestConfirmations();
                const getRequestConfirmationsValue = 3;
                assert.equal(getterRequestConfirmations, getRequestConfirmationsValue)
            })
            it("getNumWords pure function", async function(){
                const getterNumWordsValue = await raffleContract.getNumWords();
                const getNumWordsValue = 1;
                assert.equal(getterNumWordsValue, getNumWordsValue)
            })
        })
    })



// yarn add hardhat-deploy


// ... 116,149,153
// 103,105,138
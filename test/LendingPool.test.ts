import { expect } from "chai";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { LendingPool } from "../typechain-types";
describe("LendingPool", function () {
    let lendingPool: LendingPool;
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const DAI_PRICE_FEED_ADDRESS = "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9";

    beforeEach(async function () {
        await deployments.fixture(["mocks", "lending-pool"]);
        lendingPool = await ethers.getContract("LendingPool");
    });
    it("check dai/usd price feed address", async function () {
        const daiTokenPriceFeed = await lendingPool.getTokenToPriceFeedAddress(
            DAI_ADDRESS
        );
        expect(daiTokenPriceFeed).to.equal(DAI_PRICE_FEED_ADDRESS);
    });
    it("Deposit dai", async function () {
        const { deployer } = await getNamedAccounts();
        const dai = await ethers.getContractAt("IERC20", DAI_ADDRESS, deployer);
        const amount = ethers.utils.parseEther("100");
        await dai.approve(lendingPool.address, amount);
        await lendingPool.deposit(DAI_ADDRESS, amount);
        const daiBalance = await dai.balanceOf(lendingPool.address);
        expect(daiBalance).to.equal(amount);
    });
});

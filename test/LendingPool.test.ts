import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { IERC20, LendingPool, Swap } from "../typechain-types";
import { IWETH9 } from "../typechain-types/contracts/Interfaces";
describe("LendingPool", function () {
    let lendingPool: LendingPool;
    let dai: IERC20;
    let signers: SignerWithAddress[];
    let weth9: IWETH9;
    let swap: Swap;
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const DAI_PRICE_FEED_ADDRESS = "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9";
    const WETH9_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    let daiBalance: BigNumber;

    beforeEach(async function () {
        await deployments.fixture(["all"]);
        lendingPool = await ethers.getContract("LendingPool");
        weth9 = await ethers.getContractAt("IWETH9", WETH9_ADDRESS);
        dai = await ethers.getContractAt("IERC20", DAI_ADDRESS);
        swap = await ethers.getContract("Swap");
        signers = await ethers.getSigners();

        const amountToSwap = ethers.utils.parseEther("200"); //note that this is 200 DAI
        // swap dai and add price feed address
        await weth9.deposit({ value: amountToSwap }); //convert ETH to WETH
        await weth9.approve(swap.address, amountToSwap);
        await swap.swapExactInputSingle(amountToSwap);
        daiBalance = await dai.balanceOf(signers[0].address);

        // add price feed address
        await lendingPool.addTokenToPriceFeedAddress(
            DAI_ADDRESS,
            DAI_PRICE_FEED_ADDRESS
        );
    });

    it("swap eth to dai ", async () => {
        assert(daiBalance.gt(0));
    });
    it("check the price feed address", async () => {
        const priceFeedAddress = await lendingPool.getTokenToPriceFeedAddress(
            DAI_ADDRESS
        );
        expect(priceFeedAddress).to.equal(DAI_PRICE_FEED_ADDRESS);
    });

    it("Deposit dai", async function () {
        const amount = ethers.utils.parseEther("200");
        await dai.approve(lendingPool.address, amount);
        await lendingPool.addTokenToPriceFeedAddress(
            DAI_ADDRESS,
            DAI_PRICE_FEED_ADDRESS
        );
        await lendingPool.deposit(DAI_ADDRESS, amount);
        const daiBalance = await dai.balanceOf(lendingPool.address);
        const totalLiquidityInUSD = await lendingPool.getUserCollateralInUSD(
            signers[0].address
        );
        const userToTokenToBalance = await lendingPool.getUserTokenToBalance(
            signers[0].address,
            DAI_ADDRESS
        );

        expect(userToTokenToBalance).to.equal(amount);
        expect(totalLiquidityInUSD.gt(0));
        expect(daiBalance).to.equal(amount);
    });
});

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
    let link: IERC20;
    let swap: Swap;
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const DAI_USD_PRICE_FEED_ADDRESS =
        "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9";
    const WETH9_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const LINK_ADDRESS = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
    const LINK_USD_PRICE_FEED_ADDRESS =
        "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c";
    let daiBalance: BigNumber;
    let amount: BigNumber;

    beforeEach(async function () {
        await deployments.fixture(["all"]);
        lendingPool = await ethers.getContract("LendingPool");
        weth9 = await ethers.getContractAt("IWETH9", WETH9_ADDRESS);
        dai = await ethers.getContractAt("IERC20", DAI_ADDRESS);
        link = await ethers.getContractAt("IERC20", LINK_ADDRESS);
        swap = await ethers.getContract("Swap");
        signers = await ethers.getSigners();

        const amountToSwap = ethers.utils.parseEther("200"); //note that this is 300 DAI
        // swap dai and add price feed address
        const depositWeth = ethers.utils.parseEther("600");
        await weth9.deposit({ value: depositWeth }); //convert ETH to WETH
        await weth9.approve(swap.address, depositWeth);
        await swap.swapExactInputSingle(amountToSwap, DAI_ADDRESS); // swap WETH for DAI
        await swap.swapExactInputSingle(amountToSwap, LINK_ADDRESS); // swap WETH for LINK

        daiBalance = await dai.balanceOf(signers[0].address);

        // add price feed address
        await lendingPool.addTokenToPriceFeedAddress(
            DAI_ADDRESS,
            DAI_USD_PRICE_FEED_ADDRESS
        );
        await lendingPool.addTokenToPriceFeedAddress(
            LINK_ADDRESS,
            LINK_USD_PRICE_FEED_ADDRESS
        );
        // depsoit dai and link
        amount = ethers.utils.parseEther("200");
        await dai.approve(lendingPool.address, amount);
        await link.approve(lendingPool.address, amount);

        await lendingPool.deposit(DAI_ADDRESS, amount);
        await lendingPool.deposit(LINK_ADDRESS, amount);
    });
    // TODO:tests left to write
    // TODO: check if ot revert if price feed address is not set
    // TODO: check if it reverts if amount deposted is zero

    it("swap eth to dai ", async () => {
        assert(daiBalance.gt(0));
    });
    it("check the price feed address", async () => {
        const priceFeedAddressDai =
            await lendingPool.getTokenToPriceFeedAddress(DAI_ADDRESS);
        const priceFeedAddressLink =
            await lendingPool.getTokenToPriceFeedAddress(LINK_ADDRESS);
        expect(priceFeedAddressDai).to.equal(DAI_USD_PRICE_FEED_ADDRESS);
        expect(priceFeedAddressLink).to.equal(LINK_USD_PRICE_FEED_ADDRESS);
    });

    it("Deposit dai", async function () {
        const daiBalance = await dai.balanceOf(lendingPool.address);
        const linkBalance = await link.balanceOf(lendingPool.address);
        const totalLiquidityInUSD = await lendingPool.getUserCollateralInUSD(
            signers[0].address
        );
        const userToTokenToDaiAmount = await lendingPool.getUserTokenToBalance(
            signers[0].address,
            DAI_ADDRESS
        );
        const userToTokenToLinkAmount = await lendingPool.getUserTokenToBalance(
            signers[0].address,
            LINK_ADDRESS
        );
        expect(userToTokenToDaiAmount).to.equal(amount);
        expect(userToTokenToLinkAmount).to.equal(amount);
        expect(totalLiquidityInUSD.gt(0));
        expect(daiBalance).to.equal(amount);
        expect(linkBalance).to.equal(amount);
    });

    describe("Borrow", function () {
        it("revert if pool doesn't have enough liquidity for the token you want to borrow", async function () {
            const amountToBorrow = ethers.utils.parseEther("300"); // pool only have 200 link so it revert
            await expect(
                lendingPool.borrow(LINK_ADDRESS, amountToBorrow)
            ).to.be.revertedWithCustomError(
                lendingPool,
                "LendingPool__NotEnoughTokenInPoolToBorrow"
            );
        });

        it("should borrow 100 link", async function () {
            const amount = ethers.utils.parseEther("100");
            await lendingPool.borrow(LINK_ADDRESS, amount);
            const totalBorrowedInUSD =
                await lendingPool.getUserBorrowedAmountInUSD(
                    signers[0].address
                );
            const linkBalance = await link.balanceOf(signers[0].address);
            expect(totalBorrowedInUSD.gt(0));
            // expect(linkBalance).to.equal(amount);
        });
    });
});

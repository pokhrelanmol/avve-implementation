import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployLendingPool = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;

    await deploy("LendingPool", {
        from: deployer,
        log: true,
    });

    const lendingPool = await ethers.getContract("LendingPool");
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const DAI_PRICE_FEED_ADDRESS = "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9";

    async function addInitalTokenAndPriceFeedAddresses() {
        await lendingPool.addTokenToPriceFeedAddress(
            DAI_ADDRESS,
            DAI_PRICE_FEED_ADDRESS
        );
        console.log("added token and price feed address");
    }
    await addInitalTokenAndPriceFeedAddresses(); // not passing in any arguments
};

export default deployLendingPool;
deployLendingPool.tags = ["all", "lending-pool"];

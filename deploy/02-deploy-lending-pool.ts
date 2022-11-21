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
};

export default deployLendingPool;
deployLendingPool.tags = ["all", "lending-pool"];

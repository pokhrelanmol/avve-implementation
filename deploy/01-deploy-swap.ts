import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploySwap = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;

    await deploy("Swap", {
        from: deployer,
        log: true,
    });
};

export default deploySwap;
deploySwap.tags = ["all", "swap"];

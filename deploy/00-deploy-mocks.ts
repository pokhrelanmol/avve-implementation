import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployMocks = async ({
    deployments,
    network,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();
    const { deploy } = deployments;

    await deploy("MockV3Aggregator", {
        from: deployer,
        args: [18, "2000000000000000000"],
        log: true,
    });
};

export default deployMocks;
deployMocks.tags = ["all", "mocks"];

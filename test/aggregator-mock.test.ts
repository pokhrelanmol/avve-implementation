import { ethers } from "hardhat";
import { MockV3Aggregator } from "../typechain-types";

describe("MockV3Aggregator", () => {
    let mockV3Aggregator: any;
    let priceConvertor;
    beforeEach(async () => {
        const [deployer] = await ethers.getSigners();
        const mockV3AggregatorFactory = await ethers.getContractFactory(
            "MockV3Aggregator",
            deployer
        );
        mockV3Aggregator = await mockV3AggregatorFactory.deploy(18, 100000000);
        await mockV3Aggregator.deployed();
    });
    it("should give us a conversion rate", async () => {
        const { answer } = await mockV3Aggregator.latestRoundData();

        console.log(answer);
    });
});

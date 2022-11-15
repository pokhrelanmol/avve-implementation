import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "dotenv/config";
// const MAINNET_RPC_URL =
// "https://mainnet.infura.io/v3/d93623c77fe34d028cf3d60bcf1682a5";
const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            { version: "0.8.11" },
            { version: "0.6.6" },
            { version: "0.5.12" },
            { version: "07.6" },
        ],
    },
    networks: {
        hardhat: {
            forking: {
                url: process.env.MAINNET_RPC_URL!,
            },
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
};

export default config;

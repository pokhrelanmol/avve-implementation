// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

library PriceConverter {
    function getPriceInUSD(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        return uint256(answer);
    }

    // answer will be on 8 decimals if 1 link = 8 dollar then answer will be 800000000

    function getConversionRateInUSD(
        uint256 amount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        //! Note : We are assuming that every token in our pool have 18 decimals
        uint256 tokenPrice = getPriceInUSD(priceFeed);
        uint256 priceInUSD = (tokenPrice * amount) / 1e18;
        // if amount = 2 and priceInUSD = 800000000 then priceInUSD = 800000000 * 2 / 1e8 = 1600000000
        return priceInUSD;
    }
}

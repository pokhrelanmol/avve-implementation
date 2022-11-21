// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
import "./library/PriceConverter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

error LendingPool__TokenNotSupported();
error LendingPool__AmountIsZero();
error LendingPool__TransferFailed();
error LendingPool__HealthFactorTooLow();
error LendingPool__BorrowLimitReached();
error LendingPool__NotEnoughTokenInPoolToBorrow();

contract LendingPool is Ownable {
    /*STATE VARAIBLES */
    mapping(address => address) internal s_tokenToPriceFeedAddress;
    mapping(address => mapping(address => uint256)) s_userToTokenToBalance;
    mapping(address => mapping(address => uint256)) s_userToTokenToBorrowedAmount;
    mapping(address => uint256) s_userToCollateralInUSD;
    mapping(address => uint256) s_userToBorrowedAmountInUSD;
    uint256 public constant LIQUIDATION_TRESHOLD = 80;
    uint256 public constant MIN_HEALTH_FACTOR = 1e8;

    /* LIBRARY*/
    using PriceConverter for uint256;

    function deposit(address tokenAddress, uint256 amount)
        external
        payable
        isTokenSupported(tokenAddress)
        isAmountZero(amount)
    {
        uint256 amountInUSD = amount.getConversionRateInUSD(
            AggregatorV3Interface(s_tokenToPriceFeedAddress[tokenAddress])
        ); // amount is a first perameter and priceFeed is a second perameter
        s_userToCollateralInUSD[msg.sender] += amountInUSD;
        s_userToTokenToBalance[msg.sender][tokenAddress] += amount;
        bool success = IERC20(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        if (!success) {
            revert LendingPool__TransferFailed();
        }
    }

    function borrow(address tokenAddress, uint256 amount)
        external
        isAmountZero(amount)
        isTokenSupported(tokenAddress)
    {
        if (IERC20(tokenAddress).balanceOf(address(this)) < amount)
            revert LendingPool__NotEnoughTokenInPoolToBorrow();
        s_userToTokenToBorrowedAmount[msg.sender][tokenAddress] += amount;
        if (getHealthFactor(msg.sender) < MIN_HEALTH_FACTOR)
            revert LendingPool__HealthFactorTooLow();
        // Something is not clear here - I still cant figure out that how heath factor is calculated
        s_userToTokenToBorrowedAmount[msg.sender][tokenAddress] += amount;
        bool success = IERC20(tokenAddress).transfer(msg.sender, amount);
        if (!success) revert LendingPool__TransferFailed();
    }

    function getHealthFactor(address userAddress)
        public
        view
        returns (uint256)
    {
        uint256 amountThatCanBeBorrowed = (s_userToCollateralInUSD[
            userAddress
        ] * LIQUIDATION_TRESHOLD) / 100;
        // if (s_userToBorrowedAmountInUSD[userAddress] == 0) return 100e8; //if no previous borrow then health factor is 100
        return
            (amountThatCanBeBorrowed * 1e8) /
            s_userToBorrowedAmountInUSD[userAddress];
    }

    function addTokenToPriceFeedAddress(
        address tokenAddress,
        address priceFeedAddress
    ) external onlyOwner {
        s_tokenToPriceFeedAddress[tokenAddress] = priceFeedAddress;
    }

    function getTokenToPriceFeedAddress(address tokenAddress)
        external
        view
        returns (address)
    {
        return s_tokenToPriceFeedAddress[tokenAddress];
    }

    function getUserCollateralInUSD(address userAddress)
        external
        view
        returns (uint256)
    {
        return s_userToCollateralInUSD[userAddress];
    }

    function getUserTokenToBalance(address userAddress, address tokenAddress)
        external
        view
        returns (uint256)
    {
        return s_userToTokenToBalance[userAddress][tokenAddress];
    }

    function getUserTokenToBorrowedAmount(
        address userAddress,
        address tokenAddress
    ) external view returns (uint256) {
        return s_userToTokenToBorrowedAmount[userAddress][tokenAddress];
    }

    modifier isTokenSupported(address tokenAddress) {
        if (s_tokenToPriceFeedAddress[tokenAddress] == address(0)) {
            revert LendingPool__TokenNotSupported();
        }
        _;
    }
    modifier isAmountZero(uint256 amount) {
        if (amount == 0) {
            revert LendingPool__AmountIsZero();
        }
        _;
    }
}

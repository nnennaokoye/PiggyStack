// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title StableDEX
 * @notice A DEX that supports swapping between ETH and multiple stablecoins
 */
contract StableDEX is Ownable2Step, ReentrancyGuard, Pausable {
    /* ========== STATE VARIABLES ========== */

    // Mapping of token address to its liquidity pool info
    struct Pool {
        uint256 totalLiquidity;
        mapping(address => uint256) userLiquidity;
        bool isSupported;
    }
    
    mapping(address => Pool) public pools;
    address[] public supportedTokens;
    uint256 public constant FEES_DENOMINATOR = 1000;
    uint256 public swapFee = 3; // 0.3% fee
    
    /* ========== EVENTS ========== */
    
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event LiquidityAdded(
        address indexed provider,
        address indexed token,
        uint256 tokenAmount,
        uint256 ethAmount
    );
    event LiquidityRemoved(
        address indexed provider,
        address indexed token,
        uint256 tokenAmount,
        uint256 ethAmount
    );

    /* ========== CONSTRUCTOR ========== */

    constructor() {
        _transferOwnership(msg.sender);
    }

    /* ========== VIEWS ========== */

    function getTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    function getLiquidity(address token, address provider) external view returns (uint256) {
        require(pools[token].isSupported, "Token not supported");
        return pools[token].userLiquidity[provider];
    }

    function calculateSwapOutput(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public view returns (uint256) {
        require(amountIn > 0, "Invalid input amount");
        require(reserveIn > 0 && reserveOut > 0, "Invalid reserves");

        uint256 amountInWithFee = amountIn * (FEES_DENOMINATOR - swapFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * FEES_DENOMINATOR + amountInWithFee;
        
        return numerator / denominator;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!pools[token].isSupported, "Token already supported");
        
        pools[token].isSupported = true;
        supportedTokens.push(token);
        
        emit TokenAdded(token);
    }

    function removeSupportedToken(address token) external onlyOwner {
        require(pools[token].isSupported, "Token not supported");
        
        // Find and remove token from supportedTokens array
        for (uint i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == token) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }
        
        pools[token].isSupported = false;
        emit TokenRemoved(token);
    }

    function addLiquidity(address token) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(pools[token].isSupported, "Token not supported");
        require(msg.value > 0, "Must provide ETH");
        
        IERC20 tokenContract = IERC20(token);
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = tokenContract.balanceOf(address(this));
        
        uint256 tokenAmount;
        if (tokenReserve == 0) {
            tokenAmount = msg.value; // 1:1 ratio for initial liquidity
        } else {
            tokenAmount = (msg.value * tokenReserve) / ethReserve;
        }
        
        require(tokenContract.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
        
        // Update liquidity records
        pools[token].totalLiquidity += msg.value;
        pools[token].userLiquidity[msg.sender] += msg.value;
        
        emit LiquidityAdded(msg.sender, token, tokenAmount, msg.value);
    }

    function removeLiquidity(address token, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(pools[token].isSupported, "Token not supported");
        require(pools[token].userLiquidity[msg.sender] >= amount, "Insufficient liquidity");
        
        IERC20 tokenContract = IERC20(token);
        uint256 ethReserve = address(this).balance;
        uint256 tokenReserve = tokenContract.balanceOf(address(this));
        
        uint256 ethAmount = (amount * ethReserve) / pools[token].totalLiquidity;
        uint256 tokenAmount = (amount * tokenReserve) / pools[token].totalLiquidity;
        
        // Update liquidity records
        pools[token].totalLiquidity -= amount;
        pools[token].userLiquidity[msg.sender] -= amount;
        
        // Transfer assets
        require(tokenContract.transfer(msg.sender, tokenAmount), "Token transfer failed");
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        emit LiquidityRemoved(msg.sender, token, tokenAmount, ethAmount);
    }

    function swapExactETHForTokens(address tokenOut) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        returns (uint256)
    {
        require(pools[tokenOut].isSupported, "Token not supported");
        require(msg.value > 0, "Must provide ETH");
        
        IERC20 tokenContract = IERC20(tokenOut);
        uint256 tokenReserve = tokenContract.balanceOf(address(this));
        uint256 ethReserve = address(this).balance - msg.value;
        
        uint256 tokenAmount = calculateSwapOutput(
            msg.value,
            ethReserve,
            tokenReserve
        );
        
        require(tokenContract.transfer(msg.sender, tokenAmount), "Token transfer failed");
        
        emit SwapExecuted(
            msg.sender,
            address(0),
            tokenOut,
            msg.value,
            tokenAmount
        );
        
        return tokenAmount;
    }

    function swapExactTokensForETH(address tokenIn, uint256 amountIn) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256)
    {
        require(pools[tokenIn].isSupported, "Token not supported");
        require(amountIn > 0, "Invalid input amount");
        
        IERC20 tokenContract = IERC20(tokenIn);
        uint256 tokenReserve = tokenContract.balanceOf(address(this));
        uint256 ethReserve = address(this).balance;
        
        uint256 ethAmount = calculateSwapOutput(
            amountIn,
            tokenReserve,
            ethReserve
        );
        
        require(tokenContract.transferFrom(msg.sender, address(this), amountIn), "Token transfer failed");
        
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        emit SwapExecuted(
            msg.sender,
            tokenIn,
            address(0),
            amountIn,
            ethAmount
        );
        
        return ethAmount;
    }

    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(pools[tokenIn].isSupported && pools[tokenOut].isSupported, "Token not supported");
        require(tokenIn != tokenOut, "Same tokens");
        require(amountIn > 0, "Invalid input amount");
        
        IERC20 tokenInContract = IERC20(tokenIn);
        IERC20 tokenOutContract = IERC20(tokenOut);
        
        uint256 tokenInReserve = tokenInContract.balanceOf(address(this));
        uint256 tokenOutReserve = tokenOutContract.balanceOf(address(this));
        
        uint256 amountOut = calculateSwapOutput(
            amountIn,
            tokenInReserve,
            tokenOutReserve
        );
        
        require(tokenInContract.transferFrom(msg.sender, address(this), amountIn), "Token transfer failed");
        require(tokenOutContract.transfer(msg.sender, amountOut), "Token transfer failed");
        
        emit SwapExecuted(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut
        );
        
        return amountOut;
    }

    /* ========== ADMIN FUNCTIONS ========== */

    function setSwapFee(uint256 newFee) external onlyOwner {
        require(newFee <= 50, "Fee too high"); // Max 5%
        swapFee = newFee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency withdraw function
    function emergencyWithdraw(address token) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = payable(owner()).call{value: address(this).balance}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20 tokenContract = IERC20(token);
            uint256 balance = tokenContract.balanceOf(address(this));
            require(tokenContract.transfer(owner(), balance), "Token transfer failed");
        }
    }

    receive() external payable {}
} 
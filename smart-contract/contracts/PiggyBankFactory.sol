// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PiggyBank.sol";
import "./GroupPiggyBank.sol";

contract PiggyBankFactory is Ownable {
    mapping(IERC20 => uint256) public whitelistedTokens;
    mapping(address => bool) public piggyBanks;
    address public lastDeployedPiggy;

    event PiggyBankCreated(address indexed piggyBank, address indexed owner);
    event TokenWhitelisted(address indexed token, uint256 maxAmount);
    event TokenBlacklisted(address indexed token);
    event GroupPiggyCreated(address indexed piggyBank, address[] participants);
    
    constructor() Ownable() {
        // Whitelist ETH by default with a high limit
        whitelistedTokens[IERC20(address(0))] = type(uint256).max;
    }
    
    function whitelistToken(IERC20 token, uint256 maxAmount) external onlyOwner {
        require(address(token) != address(0), "Invalid token address");
        require(maxAmount > 0, "Invalid max amount");
        whitelistedTokens[token] = maxAmount;
        emit TokenWhitelisted(address(token), maxAmount);
    }
    
    function createIndividualPiggy(
        address token,
        uint256 targetAmount,
        uint256 lockDuration
    ) external returns (address) {
        require(isValidToken(token), "Token not whitelisted");
        if (token != address(0)) {
            require(whitelistedTokens[IERC20(token)] >= targetAmount, "Amount exceeds max allowed");
        }
        
        PiggyBank piggyBank = new PiggyBank(
            msg.sender,
            token,
            targetAmount,
            lockDuration
        );
        
        piggyBanks[address(piggyBank)] = true;
        lastDeployedPiggy = address(piggyBank);
        emit PiggyBankCreated(address(piggyBank), msg.sender);
        return address(piggyBank);
    }
    
    function createGroupPiggy(
        address token,
        uint256 targetAmount,
        uint256 lockDuration,
        address[] memory participants,
        uint256 requiredApprovals
    ) external returns (address) {
        require(isValidToken(token), "Token not whitelisted");
        if (token != address(0)) {
            require(whitelistedTokens[IERC20(token)] >= targetAmount, "Amount exceeds max allowed");
        }
        require(participants.length > 0, "No participants provided");
        require(requiredApprovals <= participants.length, "Required approvals exceeds participant count");
        
        GroupPiggyBank groupPiggyBank = new GroupPiggyBank(
            token,
            targetAmount,
            lockDuration,
            participants,
            requiredApprovals
        );
        
        piggyBanks[address(groupPiggyBank)] = true;
        lastDeployedPiggy = address(groupPiggyBank);
        emit GroupPiggyCreated(address(groupPiggyBank), participants);
        return address(groupPiggyBank);
    }
    
    function blacklistToken(address token) external onlyOwner {
        require(token != address(0), "Cannot blacklist ETH");
        whitelistedTokens[IERC20(token)] = 0;
        emit TokenBlacklisted(token);
    }
    
    function isValidToken(address token) public view returns (bool) {
        return whitelistedTokens[IERC20(token)] > 0;
    }
    
    function isPiggyBank(address piggyBank) external view returns (bool) {
        return piggyBanks[piggyBank];
    }
    
    function getLastDeployedPiggy() external view returns (address) {
        return lastDeployedPiggy;
    }
    
    // Function to collect penalties
    function collectPenalties(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    // To receive ETH penalties
    receive() external payable {}
} 
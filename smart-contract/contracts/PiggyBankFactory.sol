// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PiggyBank.sol";
import "./GroupPiggyBank.sol";

contract PiggyBankFactory {
    address public immutable owner;
    mapping(IERC20 => uint256) public whitelistedTokens;
    mapping(address => bool) public piggyBanks;

    event PiggyBankCreated(address indexed piggyBank, address indexed owner);
    event TokenWhitelisted(IERC20 indexed token, uint256 maxAmount);
    event TokenBlacklisted(address indexed token);
    
    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function whitelistToken(IERC20 token, uint256 maxAmount) external onlyOwner {
        require(address(token) != address(0), "Invalid token address");
        whitelistedTokens[token] = maxAmount;
        emit TokenWhitelisted(token, maxAmount);
    }
    
    function createIndividualPiggyBank(
        address token,
        uint256 targetAmount,
        uint256 lockDuration
    ) external returns (address) {
        if (token != address(0)) {
            require(whitelistedTokens[IERC20(token)] >= targetAmount, "Target amount exceeds token limit");
        }
        
        PiggyBank piggyBank = new PiggyBank(
            msg.sender,
            token,
            targetAmount,
            lockDuration
        );
        
        piggyBanks[address(piggyBank)] = true;
        emit PiggyBankCreated(address(piggyBank), msg.sender);
        return address(piggyBank);
    }
    
    function createGroupPiggyBank(
        string memory name,
        address[] memory participants,
        uint256 requiredApprovals,
        address token,
        uint256 targetAmount,
        uint256 lockDuration
    ) external returns (address) {
        if (token != address(0)) {
            require(whitelistedTokens[IERC20(token)] >= targetAmount, "Target amount exceeds token limit");
        }
        require(participants.length > 0, "No participants provided");
        require(requiredApprovals <= participants.length, "Required approvals exceeds participant count");
        
        GroupPiggyBank groupPiggyBank = new GroupPiggyBank(
            name,
            participants,
            requiredApprovals,
            token,
            targetAmount,
            lockDuration
        );
        
        piggyBanks[address(groupPiggyBank)] = true;
        emit PiggyBankCreated(address(groupPiggyBank), msg.sender);
        return address(groupPiggyBank);
    }
    
    function blacklistToken(address token) external onlyOwner {
        require(token != address(0), "Cannot blacklist ETH");
        whitelistedTokens[IERC20(token)] = 0;
        emit TokenBlacklisted(token);
    }
    
    function isPiggyBank(address _address) external view returns (bool) {
        return piggyBanks[_address];
    }
    
    // Function to collect penalties
    function collectPenalties(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner).transfer(amount);
        } else {
            IERC20(token).transfer(owner, amount);
        }
    }
    
    // To receive ETH penalties
    receive() external payable {}
} 
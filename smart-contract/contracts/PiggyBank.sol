// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IPiggyBank.sol";

contract PiggyBank is IPiggyBank, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable owner;
    address public immutable token;
    uint256 public immutable targetAmount;
    uint256 public immutable lockEnd;
    uint256 public balance;

    uint256 public constant EMERGENCY_WITHDRAWAL_PENALTY = 10; // 10% penalty

    event Withdrawn(uint256 amount, bool isEmergency);

    constructor(
        address _owner,
        address _token,
        uint256 _targetAmount,
        uint256 _lockDuration
    ) {
        require(_owner != address(0), "Invalid owner address");
        require(_targetAmount > 0, "Invalid target amount");
        owner = _owner;
        token = _token;
        targetAmount = _targetAmount;
        lockEnd = block.timestamp + _lockDuration;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Zero amount");
        require(token == address(0), "Use depositToken for ERC20");
        balance += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function depositToken(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        require(token != address(0), "Use deposit for ETH");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        balance += amount;
        emit Deposit(msg.sender, amount);
    }

    function withdraw() external onlyOwner nonReentrant {
        require(block.timestamp >= lockEnd, "Lock period active");
        uint256 amount = balance;
        balance = 0;
        
        if (token == address(0)) {
            (bool success, ) = owner.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner, amount);
        }
        
        emit Withdrawn(amount, false);
    }

    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 amount = balance;
        balance = 0;

        uint256 penalty = (amount * EMERGENCY_WITHDRAWAL_PENALTY) / 100;
        uint256 withdrawAmount = amount - penalty;

        if (token == address(0)) {
            (bool success, ) = owner.call{value: withdrawAmount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(owner, withdrawAmount);
        }

        emit Withdrawn(withdrawAmount, true);
    }

    function getProgress() external view override returns (uint256, uint256) {
        return (balance, targetAmount);
    }

    receive() external payable {
        require(token == address(0), "ETH not accepted");
    }
} 
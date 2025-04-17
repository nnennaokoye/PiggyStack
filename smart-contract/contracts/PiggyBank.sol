// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IPiggyBank.sol";

contract PiggyBank is ReentrancyGuard, IPiggyBank {
    using SafeERC20 for IERC20;
    using Address for address payable;

    address public immutable owner;
    IERC20 public immutable token;
    uint256 public immutable targetAmount;
    uint256 public immutable lockEnd;
    uint256 public balance;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(
        address _owner,
        address _token,
        uint256 _targetAmount,
        uint256 _lockDuration
    ) {
        require(_owner != address(0), "Invalid owner address");
        require(_targetAmount > 0, "Invalid target amount");
        owner = _owner;
        token = IERC20(_token);
        targetAmount = _targetAmount;
        lockEnd = block.timestamp + _lockDuration;
    }

    function deposit() external payable virtual override nonReentrant {
        require(block.timestamp < lockEnd, "Savings period ended");
        
        uint256 amount = msg.value;
        require(amount > 0, "Amount must be greater than 0");
        
        balance += amount;
        emit Deposit(msg.sender, amount);
    }

    function depositToken(uint256 amount) external virtual nonReentrant {
        require(block.timestamp < lockEnd, "Savings period ended");
        require(amount > 0, "Amount must be greater than 0");
        require(address(token) != address(0), "Not a token piggy bank");

        token.safeTransferFrom(msg.sender, address(this), amount);
        balance += amount;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(block.timestamp >= lockEnd, "Still locked");
        require(amount <= balance, "Insufficient balance");

        balance -= amount;

        if (address(token) == address(0)) {
            payable(owner).sendValue(amount);
        } else {
            token.safeTransfer(owner, amount);
        }

        emit Withdrawal(msg.sender, amount);
    }

    function emergencyWithdraw() external override onlyOwner nonReentrant {
        uint256 amount = balance;
        balance = 0;

        if (address(token) == address(0)) {
            payable(owner).sendValue(amount);
        } else {
            token.safeTransfer(owner, amount);
        }

        emit EmergencyWithdrawal(owner, amount);
    }

    function getProgress() external view override returns (uint256, uint256) {
        return (balance, targetAmount);
    }

    receive() external payable {
        this.deposit{value: msg.value}();
    }
} 
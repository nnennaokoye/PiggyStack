// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPiggyBank {
    // Events
    event Deposit(address indexed depositor, uint256 amount);
    event Withdrawal(address indexed withdrawer, uint256 amount);
    event EmergencyWithdrawal(address indexed withdrawer, uint256 amount);
    event WithdrawalRequested(uint256 indexed requestId, address indexed requester, uint256 amount);

    // Core functions
    function deposit() external payable;
    function emergencyWithdraw() external;
    function getProgress() external view returns (uint256 currentAmount, uint256 targetAmount);
} 
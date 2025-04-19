// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GroupPiggyBank is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable factory;
    address public immutable token;
    uint256 public immutable targetAmount;
    uint256 public immutable lockEnd;
    uint256 public balance;
    
    address[] public participants;
    mapping(address => uint256) public contributions;
    mapping(address => bool) public hasApproved;
    uint256 public requiredApprovals;
    bool public withdrawalProposed;
    bool public isEmergencyWithdrawal;
    
    uint256 public constant EMERGENCY_WITHDRAWAL_PENALTY = 10; // 10% penalty

    event Deposit(address indexed participant, uint256 amount);
    event WithdrawalProposed(bool isEmergency);
    event WithdrawalApproved(address indexed participant);
    event Withdrawn(uint256 amount, bool isEmergency);

    constructor(
        address _token,
        uint256 _targetAmount,
        uint256 _lockDuration,
        address[] memory _participants,
        uint256 _requiredApprovals
    ) {
        require(_participants.length > 0, "No participants");
        require(_requiredApprovals > 0 && _requiredApprovals <= _participants.length, "Invalid approvals");
        
        factory = msg.sender;
        token = _token;
        targetAmount = _targetAmount;
        lockEnd = block.timestamp + _lockDuration;
        participants = _participants;
        requiredApprovals = _requiredApprovals;
    }

    modifier onlyParticipant() {
        bool isParticipant = false;
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i] == msg.sender) {
                isParticipant = true;
                break;
            }
        }
        require(isParticipant, "Not a participant");
        _;
    }

    function deposit(uint256 amount) external payable onlyParticipant nonReentrant {
        require(!withdrawalProposed, "Withdrawal in progress");
        require(amount > 0, "Zero amount");
        
        if (token == address(0)) {
            require(msg.value == amount, "Invalid ETH amount");
            balance += amount;
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            balance += amount;
        }
        
        contributions[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function proposeWithdrawal(bool _isEmergency) external onlyParticipant {
        require(!withdrawalProposed, "Withdrawal already proposed");
        if (!_isEmergency) {
            require(block.timestamp >= lockEnd, "Lock period active");
        }
        
        withdrawalProposed = true;
        isEmergencyWithdrawal = _isEmergency;
        emit WithdrawalProposed(_isEmergency);
    }

    function approveWithdrawal() external onlyParticipant {
        require(withdrawalProposed, "No withdrawal proposed");
        require(!hasApproved[msg.sender], "Already approved");
        
        hasApproved[msg.sender] = true;
        emit WithdrawalApproved(msg.sender);
    }

    function withdraw() external onlyParticipant nonReentrant {
        require(withdrawalProposed, "No withdrawal proposed");
        
        uint256 approvalCount = 0;
        for (uint i = 0; i < participants.length; i++) {
            if (hasApproved[participants[i]]) {
                approvalCount++;
            }
        }
        require(approvalCount >= requiredApprovals, "Insufficient approvals");

        uint256 totalAmount = balance;
        uint256 totalContributions = balance;
        balance = 0;
        
        if (isEmergencyWithdrawal) {
            uint256 penalty = (totalAmount * EMERGENCY_WITHDRAWAL_PENALTY) / 100;
            totalAmount -= penalty;
        }

        // Reset state
        withdrawalProposed = false;
        for (uint i = 0; i < participants.length; i++) {
            hasApproved[participants[i]] = false;
        }

        // Distribute funds according to contribution percentages
        for (uint i = 0; i < participants.length; i++) {
            address participant = participants[i];
            if (contributions[participant] > 0) {
                uint256 share = (totalAmount * contributions[participant]) / totalContributions;
                contributions[participant] = 0;
                
                if (token == address(0)) {
                    (bool success, ) = participant.call{value: share}("");
                    require(success, "ETH transfer failed");
                } else {
                    IERC20(token).safeTransfer(participant, share);
                }
            }
        }
        
        emit Withdrawn(totalAmount, isEmergencyWithdrawal);
    }

    receive() external payable {
        require(token == address(0), "ETH not accepted");
    }
} 
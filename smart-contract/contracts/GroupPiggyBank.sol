// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PiggyBank.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GroupPiggyBank is PiggyBank {
    using SafeERC20 for IERC20;

    string public name;
    address[] public participants;
    mapping(address => bool) public isParticipant;
    mapping(address => bool) public hasApprovedWithdrawal;
    uint256 public requiredApprovals;
    uint256 public withdrawalApprovals;
    bool public withdrawalProposed;

    event ParticipantDeposited(address indexed participant, uint256 amount);
    event WithdrawalProposed(address indexed proposer);
    event WithdrawalApproved(address indexed approver);
    event WithdrawalRejected();

    constructor(
        string memory _name,
        address[] memory _participants,
        uint256 _requiredApprovals,
        address _token,
        uint256 _targetAmount,
        uint256 _lockDuration
    ) PiggyBank(address(this), _token, _targetAmount, _lockDuration) {
        name = _name;
        participants = _participants;
        requiredApprovals = _requiredApprovals;
        
        for (uint256 i = 0; i < _participants.length; i++) {
            require(_participants[i] != address(0), "Invalid participant address");
            isParticipant[_participants[i]] = true;
        }
    }

    modifier onlyParticipant() {
        require(isParticipant[msg.sender], "Not a participant");
        _;
    }

    function deposit() external payable override nonReentrant {
        require(isParticipant[msg.sender], "Not a participant");
        require(block.timestamp < lockEnd, "Savings period ended");
        
        uint256 amount = msg.value;
        require(amount > 0, "Amount must be greater than 0");
        
        balance += amount;
        emit Deposit(msg.sender, amount);
        emit ParticipantDeposited(msg.sender, msg.value);
    }

    function depositToken(uint256 amount) external override nonReentrant {
        require(isParticipant[msg.sender], "Not a participant");
        require(block.timestamp < lockEnd, "Savings period ended");
        require(amount > 0, "Amount must be greater than 0");
        require(address(token) != address(0), "Not a token piggy bank");

        token.safeTransferFrom(msg.sender, address(this), amount);
        balance += amount;
        emit Deposit(msg.sender, amount);
        emit ParticipantDeposited(msg.sender, amount);
    }

    function proposeWithdrawal() external onlyParticipant {
        require(!withdrawalProposed, "Withdrawal already proposed");
        require(block.timestamp >= lockEnd, "Lock period not ended");
        
        withdrawalProposed = true;
        withdrawalApprovals = 0;
        
        // Reset all approvals
        for (uint256 i = 0; i < participants.length; i++) {
            hasApprovedWithdrawal[participants[i]] = false;
        }
        
        emit WithdrawalProposed(msg.sender);
    }

    function approveWithdrawal() external onlyParticipant {
        require(withdrawalProposed, "No withdrawal proposed");
        require(!hasApprovedWithdrawal[msg.sender], "Already approved");
        
        hasApprovedWithdrawal[msg.sender] = true;
        withdrawalApprovals++;
        
        emit WithdrawalApproved(msg.sender);
        
        if (withdrawalApprovals >= requiredApprovals) {
            _executeWithdrawal();
        }
    }

    function rejectWithdrawal() external onlyParticipant {
        require(withdrawalProposed, "No withdrawal proposed");
        withdrawalProposed = false;
        withdrawalApprovals = 0;
        emit WithdrawalRejected();
    }

    function _executeWithdrawal() internal {
        require(withdrawalProposed, "No withdrawal proposed");
        require(withdrawalApprovals >= requiredApprovals, "Insufficient approvals");
        
        uint256 amountPerParticipant = balance / participants.length;
        
        for (uint256 i = 0; i < participants.length; i++) {
            if (address(token) == address(0)) {
                payable(participants[i]).transfer(amountPerParticipant);
            } else {
                token.safeTransfer(participants[i], amountPerParticipant);
            }
        }
        
        // Transfer any remaining dust to the last participant
        if (address(token) == address(0)) {
            uint256 remaining = address(this).balance;
            if (remaining > 0) {
                payable(participants[participants.length - 1]).transfer(remaining);
            }
        } else {
            uint256 remaining = token.balanceOf(address(this));
            if (remaining > 0) {
                token.safeTransfer(participants[participants.length - 1], remaining);
            }
        }
        
        balance = 0;
        withdrawalProposed = false;
        withdrawalApprovals = 0;
    }

    function getParticipants() external view returns (address[] memory) {
        return participants;
    }
} 
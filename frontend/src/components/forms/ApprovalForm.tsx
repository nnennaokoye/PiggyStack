import { useState } from 'react';
import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { PIGGY_BANK_ABI } from '../../constants/contracts';
import { toast } from 'react-hot-toast';

interface ApprovalFormProps {
  address: `0x${string}`;
}

export const ApprovalForm = ({ address }: ApprovalFormProps) => {
  const [amount, setAmount] = useState('');

  const { data: pendingWithdrawals } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'getPendingWithdrawals',
  });

  const { write: approve, data: approveTx } = useContractWrite({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'approveWithdrawal',
  });

  const { isLoading } = useWaitForTransaction({
    hash: approveTx?.hash,
    onSuccess: () => {
      toast.success('Withdrawal approved successfully!');
      setAmount('');
    },
    onError: () => toast.error('Failed to approve withdrawal'),
  });

  const handleApprove = (withdrawalId: bigint) => {
    try {
      approve({ args: [withdrawalId] });
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    }
  };

  return (
    <div className="space-y-4">
      {pendingWithdrawals?.map((withdrawal: any) => (
        <div key={withdrawal.id.toString()} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Amount: {withdrawal.amount.toString()}</p>
              <p className="text-sm text-gray-600">Requester: {withdrawal.requester}</p>
              <p className="text-sm text-gray-600">
                Approvals: {withdrawal.approvals.toString()} / {withdrawal.requiredApprovals.toString()}
              </p>
            </div>
            <button
              onClick={() => handleApprove(withdrawal.id)}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              {isLoading ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      ))}
      
      {(!pendingWithdrawals || pendingWithdrawals.length === 0) && (
        <p className="text-center text-gray-500">No pending withdrawals</p>
      )}
    </div>
  );
}; 
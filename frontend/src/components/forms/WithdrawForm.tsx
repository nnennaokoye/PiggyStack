import { useState } from 'react';
import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { PIGGY_BANK_ABI } from '../../constants/contracts';
import { parseEther } from 'viem';
import { toast } from 'react-hot-toast';

interface WithdrawFormProps {
  address: `0x${string}`;
}

export const WithdrawForm = ({ address }: WithdrawFormProps) => {
  const [amount, setAmount] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  const { data: balance } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'balance',
    watch: true,
  });

  const { data: token } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'token',
  });

  const { write: withdraw, data: withdrawTx } = useContractWrite({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'withdraw',
  });

  const { write: emergencyWithdraw, data: emergencyTx } = useContractWrite({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'emergencyWithdraw',
  });

  const { isLoading: isWithdrawLoading } = useWaitForTransaction({
    hash: withdrawTx?.hash,
    onSuccess: () => {
      toast.success('Withdrawal successful!');
      setAmount('');
    },
    onError: () => toast.error('Failed to withdraw'),
  });

  const { isLoading: isEmergencyLoading } = useWaitForTransaction({
    hash: emergencyTx?.hash,
    onSuccess: () => {
      toast.success('Emergency withdrawal successful!');
      setAmount('');
    },
    onError: () => toast.error('Failed to emergency withdraw'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    try {
      const parsedAmount = parseEther(amount);
      
      if (isEmergency) {
        emergencyWithdraw();
      } else {
        withdraw({ args: [parsedAmount] });
      }
    } catch (error) {
      toast.error('Invalid amount');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount to Withdraw
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="text"
            name="amount"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="focus:ring-teal-500 focus:border-teal-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="0.0"
            required={!isEmergency}
            disabled={isEmergency}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">
              {token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'Tokens'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="emergency"
          name="emergency"
          type="checkbox"
          checked={isEmergency}
          onChange={(e) => setIsEmergency(e.target.checked)}
          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
        />
        <label htmlFor="emergency" className="ml-2 block text-sm text-gray-900">
          Emergency Withdrawal (10% penalty)
        </label>
      </div>

      {isEmergency && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Emergency withdrawal will incur a 10% penalty. You will receive{' '}
                  {balance ? Number(balance) * 0.9 : 0}{' '}
                  {token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'Tokens'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isWithdrawLoading || isEmergencyLoading || (!isEmergency && !amount)}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isEmergency ? 'focus:ring-red-500' : 'focus:ring-teal-500'
        } ${(isWithdrawLoading || isEmergencyLoading) && 'opacity-50 cursor-not-allowed'}`}
      >
        {isWithdrawLoading || isEmergencyLoading
          ? 'Processing...'
          : isEmergency
          ? 'Emergency Withdraw'
          : 'Withdraw'}
      </button>
    </form>
  );
}; 
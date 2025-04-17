import { useState } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { PIGGY_BANK_ABI } from '../../constants/contracts';
import { toast } from 'react-hot-toast';

interface DepositFormProps {
  address: `0x${string}`;
}

export const DepositForm = ({ address }: DepositFormProps) => {
  const [amount, setAmount] = useState('');

  const { write: deposit, data: depositTx } = useContractWrite({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'deposit',
  });

  const { isLoading } = useWaitForTransaction({
    hash: depositTx?.hash,
    onSuccess: () => {
      toast.success('Deposit successful!');
      setAmount('');
    },
    onError: () => toast.error('Failed to deposit'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      deposit({ args: [parseEther(amount)] });
    } catch (error) {
      toast.error('Invalid amount');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <div className="mt-1">
          <input
            type="number"
            step="0.000000000000000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !amount}
        className="w-full px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Depositing...' : 'Deposit'}
      </button>
    </form>
  );
}; 
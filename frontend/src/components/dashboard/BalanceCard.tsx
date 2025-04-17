import { useContractRead } from 'wagmi';
import { PIGGY_BANK_ABI } from '../../constants/contracts';
import { formatEther } from 'viem';

interface BalanceCardProps {
  address: `0x${string}`;
}

export const BalanceCard = ({ address }: BalanceCardProps) => {
  const { data: progress } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'getProgress',
    watch: true,
  });

  const { data: token } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'token',
  });

  const [balance, targetAmount] = progress || [BigInt(0), BigInt(0)];
  const percentage = targetAmount > 0 ? Number((balance * BigInt(100)) / targetAmount) : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Progress</h2>
      
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                {percentage}% Complete
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-teal-600">
                {formatEther(balance)}/{formatEther(targetAmount)} {token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'Tokens'}
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-teal-200">
            <div
              style={{ width: `${percentage}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500 transition-all duration-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatEther(balance)} {token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'Tokens'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Target Amount</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatEther(targetAmount)} {token === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'Tokens'}
            </p>
          </div>
        </div>

        {/* Animation */}
        <div className="flex justify-center">
          <div className={`w-24 h-24 ${percentage >= 100 ? 'animate-bounce' : ''}`}>
            <svg
              className="w-full h-full text-teal-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}; 
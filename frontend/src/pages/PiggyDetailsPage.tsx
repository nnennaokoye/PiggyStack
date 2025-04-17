import { useParams } from 'react-router-dom';
import { useContractRead } from 'wagmi';
import { PIGGY_BANK_ABI } from '../constants/contracts';
import { WithdrawForm } from '../components/forms/WithdrawForm';
import { DepositForm } from '../components/forms/DepositForm';
import { ApprovalForm } from '../components/forms/ApprovalForm';

export const PiggyDetailsPage = () => {
  const { address } = useParams<{ address: `0x${string}` }>();

  const { data: isGroup } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'isGroup',
  });

  const { data: targetAmount } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'targetAmount',
  });

  const { data: balance } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'balance',
  });

  const { data: lockEnd } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'lockEnd',
  });

  const { data: token } = useContractRead({
    address,
    abi: PIGGY_BANK_ABI,
    functionName: 'token',
  });

  if (!address) return null;

  const now = Math.floor(Date.now() / 1000);
  const isLocked = lockEnd ? Number(lockEnd) > now : false;
  const progress = targetAmount && balance ? (Number(balance) / Number(targetAmount)) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">PiggyBank Details</h1>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Type</h3>
              <p className="mt-1 text-lg text-gray-900">{isGroup ? 'Group' : 'Individual'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Token</h3>
              <p className="mt-1 text-lg text-gray-900">{token}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-lg text-gray-900">{isLocked ? 'Locked' : 'Unlocked'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Lock End</h3>
              <p className="mt-1 text-lg text-gray-900">
                {lockEnd ? new Date(Number(lockEnd) * 1000).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Progress</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-teal-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-600">
              <span>{balance?.toString() || '0'}</span>
              <span>{targetAmount?.toString() || '0'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Deposit</h2>
            <DepositForm address={address} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Withdraw</h2>
            <WithdrawForm address={address} />
          </div>

          {isGroup && (
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Approvals</h2>
              <ApprovalForm address={address} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
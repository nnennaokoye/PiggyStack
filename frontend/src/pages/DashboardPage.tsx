import { useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { FACTORY_ADDRESS, FACTORY_ABI } from '../constants/contracts';
import { DepositForm } from '../components/forms/DepositForm';
import { WithdrawForm } from '../components/forms/WithdrawForm';
import { BalanceCard } from '../components/dashboard/BalanceCard';
import { GroupSettings } from '../components/dashboard/GroupSettings';

export const DashboardPage = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'settings'>('deposit');

  const { data: piggyBankAddress } = useContractRead({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'userToPiggy',
    args: [address],
    enabled: !!address,
  });

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Please connect your wallet to view your dashboard.</p>
      </div>
    );
  }

  if (!piggyBankAddress) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">No PiggyBank found. Please create one from the welcome page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Card */}
        <div className="lg:col-span-2">
          <BalanceCard address={piggyBankAddress} />
        </div>

        {/* Action Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex border-b mb-6">
            <button
              className={`pb-2 px-4 ${
                activeTab === 'deposit'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('deposit')}
            >
              Deposit
            </button>
            <button
              className={`pb-2 px-4 ${
                activeTab === 'withdraw'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('withdraw')}
            >
              Withdraw
            </button>
            <button
              className={`pb-2 px-4 ${
                activeTab === 'settings'
                  ? 'border-b-2 border-teal-500 text-teal-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>

          {activeTab === 'deposit' && <DepositForm address={piggyBankAddress} />}
          {activeTab === 'withdraw' && <WithdrawForm address={piggyBankAddress} />}
          {activeTab === 'settings' && <GroupSettings address={piggyBankAddress} />}
        </div>
      </div>
    </div>
  );
}; 
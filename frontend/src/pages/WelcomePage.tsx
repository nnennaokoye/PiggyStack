import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useContractRead } from 'wagmi';
import { FACTORY_ADDRESS, FACTORY_ABI } from '../constants/contracts';
import { CreateAccountModal } from '../components/modals/CreateAccountModal';
import { toast } from 'react-hot-toast';

export const WelcomePage = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: hasAccount } = useContractRead({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'userToPiggy',
    args: [address],
    enabled: !!address,
  });

  const handleCreateAccount = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (hasAccount) {
      toast.error('You already have an account. Continue saving!');
      return;
    }
    setIsModalOpen(true);
  };

  const handleContinueSaving = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!hasAccount) {
      toast.error('No account found. Create one!');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Welcome to PiggyStack!
        </h1>
        
        <p className="text-lg text-gray-600 mb-12">
          Join PiggyStack! Connect your wallet to save Ether or stablecoins. 
          Set targets, lock funds, and track progress. New? Create an account. 
          Already saving? Head to your dashboard.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleCreateAccount}
            disabled={!isConnected || hasAccount}
            className={`px-8 py-4 rounded-lg text-lg font-semibold ${
              !isConnected || hasAccount
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-600'
            } text-white transition-colors`}
          >
            Create New Account
          </button>

          <button
            onClick={handleContinueSaving}
            disabled={!isConnected || !hasAccount}
            className={`px-8 py-4 rounded-lg text-lg font-semibold ${
              !isConnected || !hasAccount
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-white border-2 border-teal-500 text-teal-500 hover:bg-teal-50'
            } transition-colors`}
          >
            Continue Saving
          </button>
        </div>

        {!isConnected && (
          <p className="mt-4 text-gray-500">
            Please connect your wallet to get started
          </p>
        )}
      </div>

      <CreateAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}; 
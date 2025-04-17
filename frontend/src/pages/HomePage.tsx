import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

export const HomePage = () => {
  const { isConnected } = useAccount();














  

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to PiggyStack
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create and manage your digital piggy banks with smart contract security
        </p>

        {isConnected ? (
          <Link
            to="/create"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            Create New PiggyBank
          </Link>
        ) : (
          <p className="text-lg text-gray-500">
            Connect your wallet to get started
          </p>
        )}
      </div>
    </div>
  );
}; 
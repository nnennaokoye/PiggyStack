import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export const Header = () => {
  const { isConnected } = useAccount();

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm">
      <div className="flex items-center">
        <img src="/logo.svg" alt="PiggyStack" className="h-10 w-10" />
        <h1 className="text-2xl font-bold text-teal-600 ml-2">PiggyStack</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="bg-teal-500 text-white px-6 py-2 rounded-full hover:bg-teal-600 transition-colors"
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  return (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={openChainModal}
                        className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {chain.hasIcon && (
                          <div className="w-5 h-5">
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                className="w-5 h-5"
                              />
                            )}
                          </div>
                        )}
                        <span>{chain.name}</span>
                      </button>

                      <button
                        onClick={openAccountModal}
                        className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <span>{account.displayName}</span>
                        <span>{account.displayBalance}</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}; 
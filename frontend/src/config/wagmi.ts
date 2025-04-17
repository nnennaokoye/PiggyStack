import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, sepolia],
  [
    alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_ID || '' }),
    publicProvider(),
  ]
);

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

const { wallets } = getDefaultWallets({
  appName: 'PiggyStack',
  projectId,
  chains,
});

const connectors = connectorsForWallets([
  ...wallets,
]);

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains }; 
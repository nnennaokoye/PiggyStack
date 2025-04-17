import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, chains } from './config/wagmi';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { CreatePiggyPage } from './pages/CreatePiggyPage';
import { PiggyDetailsPage } from './pages/PiggyDetailsPage';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <RainbowKitProvider modalSize="compact" chains={chains}>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreatePiggyPage />} />
                <Route path="/piggy/:address" element={<PiggyDetailsPage />} />
              </Routes>
              <Toaster position="bottom-right" />
            </div>
          </Router>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;

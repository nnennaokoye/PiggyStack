# PiggyStack

A decentralized savings platform built on Ethereum. Lock Ether or stablecoins, set goals, and save solo or with friends.

## Features

- **Individual Savings**
  - Set target amounts and lock durations
  - Track progress with animated bars
  - Emergency withdrawals with 10% penalty
  - Support for ETH, USDC, USDT, and DAI

- **Group Savings**
  - Multi-signature setup
  - Shared goals and progress tracking
  - Participant management
  - Group withdrawals with approval system

## Project Structure

```
piggystack/
├── contracts/              # Smart contracts
│   ├── PiggyFactory.sol   # Factory for deploying piggy banks
│   ├── PiggyBank.sol      # Individual savings contract
│   ├── GroupPiggy.sol     # Group savings contract
│   └── interfaces/        # Contract interfaces
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and constants
│   │   └── pages/        # Page components
│   └── public/           # Static assets
└── scripts/              # Deployment scripts
```

## Smart Contracts

The project consists of three main contracts:

1. **PiggyFactory**: Deploys individual and group piggy banks
2. **PiggyBank**: Base contract for individual savings
3. **GroupPiggy**: Extension for group savings with multi-sig

## Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn
- MetaMask or another Web3 wallet

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/piggystack.git
   cd piggystack
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install contract dependencies
   cd ../contracts
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Frontend
   cp .env.example .env
   # Add your WalletConnect project ID and other config
   ```

4. Start the development server:
   ```bash
   cd frontend
   npm run dev
   ```

### Smart Contract Deployment

1. Deploy to local network:
   ```bash
   cd contracts
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```

2. Deploy to testnet:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

## Usage

1. Connect your wallet
2. Choose between individual or group savings
3. Set your target amount and lock duration
4. Start saving!

## Security

- Reentrancy protection
- Safe math operations
- Access control
- Multi-sig security for groups
- Emergency withdrawal system

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
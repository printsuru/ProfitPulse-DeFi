# ProfitPulse DeFi

A decentralized finance (DeFi) application on BNB Smart Chain (BSC) that offers tiered investment plans with daily profits, a 3-level referral system, instant withdrawals, and comprehensive dashboards for users and admins.

## Features

- **Tiered Investment Plans**: 2%, 3%, 3.5%, and 4% daily profit rates based on investment amount
- **3-Level Referral System**: 10%, 3%, and 2% referral rewards
- **Wallet Integration**: Support for MetaMask, Trust Wallet, and TokenPocket
- **User Dashboard**: Complete investment tracking and referral statistics
- **Admin Panel**: Monitoring, liquidity management, and contract controls
- **Multi-Signature Security**: Critical operations require multiple confirmations

## Project Structure

- `/contracts`: Smart contracts for the DeFi platform
- `/frontend`: User interface with wallet integrations
- `/admin`: Admin panel with analytics and management features
- `/scripts`: Deployment and testing scripts

## Technology Stack

- **Blockchain**: BNB Smart Chain (BSC)
- **Smart Contracts**: Solidity
- **Frontend**: React.js
- **Admin Panel**: React.js with Node.js
- **Testing**: Hardhat

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MetaMask or other supported wallet

### Installation

1. Clone the repository
```
git clone <repository-url>
```

2. Install dependencies
```
cd ProfitPulse
npm install
```

3. Compile smart contracts
```
npx hardhat compile
```

4. Run tests
```
npx hardhat test
```

5. Deploy to BSC Testnet
```
npx hardhat run scripts/deploy.js --network bscTestnet
```

### Running the Frontend

```
cd frontend
npm install
npm start
```

### Running the Admin Panel

```
cd admin
npm install
npm start
```

## Security

This project implements several security measures:
- Multi-signature wallet for admin operations
- Reentrancy protection
- Access control mechanisms
- Input validation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

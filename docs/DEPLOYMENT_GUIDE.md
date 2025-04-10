# ProfitPulse DeFi - Deployment Guide

This comprehensive guide will walk you through the process of deploying the ProfitPulse DeFi platform to both BSC Testnet (for testing) and BSC Mainnet (for production). Follow these instructions carefully to ensure a successful deployment.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Smart Contract Deployment](#smart-contract-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Admin Panel Deployment](#admin-panel-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before beginning the deployment process, ensure you have the following:

- Node.js (v16+) and npm installed
- MetaMask or another compatible wallet with BSC configured
- BNB for gas fees (testnet BNB for Testnet, real BNB for Mainnet)
- BUSD for initial liquidity (testnet BUSD for Testnet, real BUSD for Mainnet)
- Access to the ProfitPulse GitHub repository

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR-USERNAME/ProfitPulse-DeFi.git
cd ProfitPulse-DeFi
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PRIVATE_KEY=your_wallet_private_key
BSCSCAN_API_KEY=your_bscscan_api_key
REPORT_GAS=true
```

> **IMPORTANT**: Never share your private key or commit the `.env` file to version control.

4. Update the `hardhat.config.js` file with your actual private key (replace the mnemonic):
```javascript
bscTestnet: {
  url: "https://data-seed-prebsc-1-s1.binance.org:8545",
  chainId: 97,
  gasPrice: 20000000000,
  accounts: [process.env.PRIVATE_KEY]
},
bscMainnet: {
  url: "https://bsc-dataseed.binance.org/",
  chainId: 56,
  gasPrice: 20000000000,
  accounts: [process.env.PRIVATE_KEY]
}
```

## Smart Contract Deployment

### Testnet Deployment

1. Compile the smart contracts:
```bash
npx hardhat compile
```

2. Deploy to BSC Testnet:
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

3. Save the deployed contract addresses that are output in the console:
```
MockBUSD deployed to: 0x...
MultiSigWallet deployed to: 0x...
ProfitPulse deployed to: 0x...
```

4. Verify the contracts on BSC Testnet Explorer:
```bash
npx hardhat verify --network bscTestnet MOCKBUSD_ADDRESS
npx hardhat verify --network bscTestnet MULTISIGWALLET_ADDRESS "['owner1','owner2','owner3']" "2"
npx hardhat verify --network bscTestnet PROFITPULSE_ADDRESS "MOCKBUSD_ADDRESS" "MULTISIGWALLET_ADDRESS"
```

### Mainnet Deployment

> **IMPORTANT**: Before deploying to Mainnet, ensure all tests pass and the contracts have been audited.

1. For Mainnet, you'll need real BUSD instead of MockBUSD. Update the deployment script to use the official BUSD contract address:
```javascript
// In scripts/deploy.js, replace MockBUSD deployment with:
const BUSD_ADDRESS = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"; // Official BUSD on BSC
```

2. Deploy to BSC Mainnet:
```bash
npx hardhat run scripts/deploy.js --network bscMainnet
```

3. Save the deployed contract addresses.

4. Verify the contracts on BSC Mainnet Explorer:
```bash
npx hardhat verify --network bscMainnet MULTISIGWALLET_ADDRESS "['owner1','owner2','owner3']" "2"
npx hardhat verify --network bscMainnet PROFITPULSE_ADDRESS "BUSD_ADDRESS" "MULTISIGWALLET_ADDRESS"
```

5. Seed initial liquidity:
   - Approve BUSD spending for the ProfitPulse contract
   - Call the `addLiquidity` function with the desired amount (e.g., 10,000 BUSD)

## Frontend Deployment

1. Update contract addresses in the frontend configuration:
```bash
cd frontend
```

2. Edit `src/utils/constants.js` with the deployed contract addresses:
```javascript
export const PROFITPULSE_ADDRESS = "0x..."; // Your deployed contract address
export const BUSD_ADDRESS = "0x..."; // BUSD or MockBUSD address
```

3. Build the frontend:
```bash
npm run build
```

4. Deploy to your preferred hosting service (e.g., Vercel, Netlify, AWS):

### Vercel Deployment Example
```bash
npm install -g vercel
vercel login
vercel
```

### Netlify Deployment Example
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

## Admin Panel Deployment

1. Update contract addresses in the admin panel configuration:
```bash
cd admin
```

2. Edit `src/utils/constants.js` with the deployed contract addresses:
```javascript
export const PROFITPULSE_ADDRESS = "0x...";
export const BUSD_ADDRESS = "0x...";
export const MULTISIG_ADDRESS = "0x...";
```

3. Build the admin panel:
```bash
npm run build
```

4. Deploy to your preferred hosting service (similar to frontend deployment).

5. Set up access controls to ensure only authorized personnel can access the admin panel.

## Post-Deployment Verification

After deployment, perform these verification steps:

1. Connect to the platform with your wallet
2. Make a small deposit to test the investment functionality
3. Test the referral system by creating a referral link and having someone use it
4. Test withdrawals to ensure funds can be retrieved
5. Verify admin functions through the multi-signature wallet
6. Check profit calculations over a 24-hour period

## Security Considerations

1. **Multi-Signature Wallet**: Ensure at least 3 trusted individuals have access to the multi-sig wallet for admin operations.

2. **Liquidity Management**: Monitor liquidity levels regularly to ensure there's enough BUSD to cover potential withdrawals.

3. **Rate Adjustments**: Any changes to profit rates should be carefully considered and implemented gradually.

4. **Regular Audits**: Schedule regular security audits of the deployed contracts.

5. **Monitoring**: Set up alerts for large deposits/withdrawals and unusual activity.

## Troubleshooting

### Common Issues and Solutions

1. **Transaction Failures**:
   - Check if you have enough BNB for gas
   - Verify contract addresses are correct
   - Ensure function parameters are valid

2. **Frontend Connection Issues**:
   - Confirm the wallet is connected to the correct network (BSC Testnet or Mainnet)
   - Check browser console for errors
   - Verify contract ABI is up to date

3. **Admin Panel Access**:
   - Ensure your wallet address is registered as an owner in the multi-sig wallet
   - Check network connection

4. **Profit Distribution Issues**:
   - Verify the contract has sufficient BUSD balance
   - Check if the contract is paused

For additional support, please contact the development team or create an issue in the GitHub repository.

---

This deployment guide is maintained by the ProfitPulse DeFi team. Last updated: April 2025.

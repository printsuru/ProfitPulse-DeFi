const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ProfitPulse DeFi contracts to BSC Testnet...");

  // Deploy MockBUSD first
  const MockBUSD = await ethers.getContractFactory("MockBUSD");
  const mockBUSD = await MockBUSD.deploy();
  await mockBUSD.waitForDeployment();
  const mockBUSDAddress = await mockBUSD.getAddress();
  console.log(`MockBUSD deployed to: ${mockBUSDAddress}`);

  // Deploy MultiSigWallet
  const [deployer, owner1, owner2] = await ethers.getSigners();
  const owners = [deployer.address, owner1.address, owner2.address];
  const requiredConfirmations = 2;

  const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
  const multiSigWallet = await MultiSigWallet.deploy(owners, requiredConfirmations);
  await multiSigWallet.waitForDeployment();
  const multiSigWalletAddress = await multiSigWallet.getAddress();
  console.log(`MultiSigWallet deployed to: ${multiSigWalletAddress}`);

  // Deploy ProfitPulse with MockBUSD and MultiSigWallet addresses
  const ProfitPulse = await ethers.getContractFactory("ProfitPulse");
  const profitPulse = await ProfitPulse.deploy(mockBUSDAddress, multiSigWalletAddress);
  await profitPulse.waitForDeployment();
  const profitPulseAddress = await profitPulse.getAddress();
  console.log(`ProfitPulse deployed to: ${profitPulseAddress}`);

  console.log("Deployment completed successfully!");
  
  // Return contract addresses for verification
  return {
    mockBUSD: mockBUSDAddress,
    multiSigWallet: multiSigWalletAddress,
    profitPulse: profitPulseAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

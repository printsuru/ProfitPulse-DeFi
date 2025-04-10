// Contract addresses and ABIs
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual contract address after deployment
export const MULTISIG_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual multi-sig wallet address after deployment
export const BUSD_ADDRESS = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"; // BUSD on BSC Mainnet

export const CONTRACT_ABI = [
  // ProfitPulse ABI
  "function totalDeposits() public view returns (uint256)",
  "function userCount() public view returns (uint256)",
  "function paused() public view returns (bool)",
  "function busdToken() public view returns (address)",
  "function owner() public view returns (address)",
  "function tier1Rate() public view returns (uint256)",
  "function tier2Rate() public view returns (uint256)",
  "function tier3Rate() public view returns (uint256)",
  "function tier4Rate() public view returns (uint256)",
  "function level1RefRate() public view returns (uint256)",
  "function level2RefRate() public view returns (uint256)",
  "function level3RefRate() public view returns (uint256)",
  "function withdrawalCap() public view returns (uint256)",
  "function getUserDetails(address _user) external view returns (uint256 investment, uint256 profits, uint256 tier, address referrer, uint256 referralCount, uint256 referralRewards)",
  "function getUserReferrals(address _user) external view returns (address[] memory)",
  "function calculateProfit(address _user) public",
  "function addLiquidity(uint256 _amount) external",
  "function setWithdrawalCap(uint256 _cap) external",
  "function updateProfitRate(uint256 _tier, uint256 _rate) external",
  "function updateReferralRate(uint256 _level, uint256 _rate) external",
  "function pause(bool _status) external"
];

export const MULTISIG_ABI = [
  // MultiSigWallet ABI
  "function owners(uint256) public view returns (address)",
  "function isOwner(address) public view returns (bool)",
  "function required() public view returns (uint256)",
  "function transactionCount() public view returns (uint256)",
  "function transactions(uint256) public view returns (address destination, uint256 value, bytes data, bool executed)",
  "function confirmations(uint256, address) public view returns (bool)",
  "function getOwners() public view returns (address[] memory)",
  "function getTransactionCount(bool pending, bool executed) public view returns (uint256)",
  "function getConfirmationCount(uint256 transactionId) public view returns (uint256)",
  "function submitTransaction(address destination, uint256 value, bytes memory data) public returns (uint256)",
  "function confirmTransaction(uint256 transactionId) public",
  "function revokeConfirmation(uint256 transactionId) public",
  "function executeTransaction(uint256 transactionId) public"
];

export const BUSD_ABI = [
  // BUSD Token ABI (ERC20)
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// Network configuration
export const BSC_MAINNET = {
  chainId: "0x38", // 56 in decimal
  chainName: "Binance Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com/"]
};

export const BSC_TESTNET = {
  chainId: "0x61", // 97 in decimal
  chainName: "Binance Smart Chain Testnet",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
  blockExplorerUrls: ["https://testnet.bscscan.com/"]
};

// Investment tiers
export const INVESTMENT_TIERS = [
  { min: 0, max: 499.99, rate: 2, name: "Bronze" },
  { min: 500, max: 999.99, rate: 3, name: "Silver" },
  { min: 1000, max: 1999.99, rate: 3.5, name: "Gold" },
  { min: 2000, max: Infinity, rate: 4, name: "Platinum" }
];

// Referral levels
export const REFERRAL_LEVELS = [
  { level: 1, rate: 10, name: "Direct" },
  { level: 2, rate: 3, name: "Second Level" },
  { level: 3, rate: 2, name: "Third Level" }
];

// Contract addresses and ABIs
export const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual contract address after deployment
export const BUSD_ADDRESS = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"; // BUSD on BSC Mainnet

export const CONTRACT_ABI = [
  // ProfitPulse ABI
  "function deposit(address _referrer) external",
  "function withdraw(uint256 _amount) external",
  "function withdrawAll() external",
  "function calculateProfit(address _user) public",
  "function getUserDetails(address _user) external view returns (uint256 investment, uint256 profits, uint256 tier, address referrer, uint256 referralCount, uint256 referralRewards)",
  "function getUserReferrals(address _user) external view returns (address[] memory)",
  "function busdToken() public view returns (address)"
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

// Minimum deposit amount
export const MIN_DEPOSIT = 10; // BUSD

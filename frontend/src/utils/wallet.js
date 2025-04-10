import { ethers } from 'ethers';

// Connect wallet function
export const connectWallet = async () => {
  if (!window.ethereum && !window.trustwallet && !window.tokenpocket) {
    throw new Error('No wallet detected. Please install MetaMask, Trust Wallet, or TokenPocket');
  }
  
  // Determine which wallet provider to use
  let provider;
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
  } else if (window.trustwallet) {
    provider = new ethers.BrowserProvider(window.trustwallet);
  } else if (window.tokenpocket) {
    provider = new ethers.BrowserProvider(window.tokenpocket);
  }
  
  // Request account access
  const accounts = await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  // Check if connected to BSC
  const chainId = await getChainId();
  if (chainId !== 56 && chainId !== 97) { // 56 for mainnet, 97 for testnet
    await switchToBSC();
  }
  
  return { address, provider };
};

// Get current chain ID
export const getChainId = async () => {
  if (window.ethereum) {
    return parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
  } else if (window.trustwallet) {
    return parseInt(await window.trustwallet.request({ method: 'eth_chainId' }), 16);
  } else if (window.tokenpocket) {
    return parseInt(await window.tokenpocket.request({ method: 'eth_chainId' }), 16);
  }
  throw new Error('No wallet detected');
};

// Switch to BSC network
export const switchToBSC = async () => {
  const provider = window.ethereum || window.trustwallet || window.tokenpocket;
  
  if (!provider) {
    throw new Error('No wallet detected');
  }
  
  try {
    // Try to switch to BSC
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x38' }], // 0x38 is 56 in hex (BSC Mainnet)
    });
  } catch (switchError) {
    // If the network is not added, add it
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x38', // 56 in hex
              chainName: 'Binance Smart Chain',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18,
              },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/'],
            },
          ],
        });
      } catch (addError) {
        throw new Error('Failed to add BSC network to wallet');
      }
    } else {
      throw new Error('Failed to switch to BSC network');
    }
  }
};

// Format address for display
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Format currency with 2 decimal places
export const formatCurrency = (amount) => {
  if (!amount) return '0.00';
  return parseFloat(amount).toFixed(2);
};

// Calculate daily profit based on investment amount
export const calculateDailyProfit = (amount) => {
  if (!amount) return 0;
  
  const investmentAmount = parseFloat(amount);
  let rate;
  
  if (investmentAmount < 500) {
    rate = 0.02; // 2%
  } else if (investmentAmount < 1000) {
    rate = 0.03; // 3%
  } else if (investmentAmount < 2000) {
    rate = 0.035; // 3.5%
  } else {
    rate = 0.04; // 4%
  }
  
  return investmentAmount * rate;
};

// Get tier name based on tier number
export const getTierName = (tier) => {
  switch (tier) {
    case 1:
      return 'Bronze (2%)';
    case 2:
      return 'Silver (3%)';
    case 3:
      return 'Gold (3.5%)';
    case 4:
      return 'Platinum (4%)';
    default:
      return 'Unknown';
  }
};

// Generate referral link
export const generateReferralLink = (address) => {
  if (!address) return '';
  return `${window.location.origin}/?ref=${address}`;
};

// Get referrer from URL
export const getReferrerFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref') || '';
};

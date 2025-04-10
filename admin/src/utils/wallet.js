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

// Create a transaction for multi-sig wallet
export const createMultiSigTransaction = async (multiSigContract, targetContract, functionName, params) => {
  // Encode function data
  const functionData = targetContract.interface.encodeFunctionData(functionName, params);
  
  // Submit transaction to multi-sig wallet
  return await multiSigContract.submitTransaction(
    await targetContract.getAddress(),
    0, // value (0 ETH)
    functionData
  );
};

// Check if an address is an owner of the multi-sig wallet
export const isMultiSigOwner = async (multiSigContract, address) => {
  return await multiSigContract.isOwner(address);
};

// Get transaction count from multi-sig wallet
export const getMultiSigTransactionCount = async (multiSigContract) => {
  return await multiSigContract.getTransactionCount(true, true);
};

// Get transaction details from multi-sig wallet
export const getMultiSigTransaction = async (multiSigContract, txId) => {
  return await multiSigContract.transactions(txId);
};

// Confirm a transaction in multi-sig wallet
export const confirmMultiSigTransaction = async (multiSigContract, txId) => {
  return await multiSigContract.confirmTransaction(txId);
};

// Revoke a confirmation in multi-sig wallet
export const revokeMultiSigConfirmation = async (multiSigContract, txId) => {
  return await multiSigContract.revokeConfirmation(txId);
};

// Execute a transaction in multi-sig wallet
export const executeMultiSigTransaction = async (multiSigContract, txId) => {
  return await multiSigContract.executeTransaction(txId);
};

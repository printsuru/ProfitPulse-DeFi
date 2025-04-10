import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { Route, Switch, useHistory } from 'react-router-dom';
import { ethers } from 'ethers';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Referral from './pages/Referral';
import NotFound from './pages/NotFound';

// Utils
import { connectWallet, getChainId, switchToBSC } from './utils/wallet';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './utils/constants';

// Create dark theme
const darkTheme = createTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#ffd700', // Gold
    },
    secondary: {
      main: '#4caf50', // Green
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

function App() {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState(0);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [userDetails, setUserDetails] = useState({
    investment: 0,
    profits: 0,
    tier: 0,
    referrer: '',
    referralCount: 0,
    referralRewards: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const history = useHistory();

  // Initialize wallet connection
  useEffect(() => {
    const init = async () => {
      try {
        // Check if wallet is already connected
        if (window.ethereum && window.ethereum.selectedAddress) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          
          // Check if connected to BSC
          const chainId = await getChainId();
          if (chainId !== 56 && chainId !== 97) { // 56 for mainnet, 97 for testnet
            await switchToBSC();
          }
          
          setAccount(address);
          setProvider(provider);
          
          // Initialize contract
          const profitPulseContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
          );
          setContract(profitPulseContract);
          
          // Get user balance
          const busdAddress = await profitPulseContract.busdToken();
          const busdContract = new ethers.Contract(
            busdAddress,
            ['function balanceOf(address) view returns (uint256)'],
            provider
          );
          const userBalance = await busdContract.balanceOf(address);
          setBalance(ethers.formatUnits(userBalance, 18));
          
          // Get user details
          await fetchUserDetails(profitPulseContract, address);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Failed to initialize wallet connection');
      }
    };
    
    init();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount('');
          setBalance(0);
          setContract(null);
        }
      });
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);
  
  // Fetch user details from contract
  const fetchUserDetails = async (contractInstance, userAddress) => {
    try {
      setLoading(true);
      const details = await contractInstance.getUserDetails(userAddress);
      
      setUserDetails({
        investment: ethers.formatUnits(details[0], 18),
        profits: ethers.formatUnits(details[1], 18),
        tier: Number(details[2]),
        referrer: details[3],
        referralCount: Number(details[4]),
        referralRewards: ethers.formatUnits(details[5], 18)
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to fetch user details');
      setLoading(false);
    }
  };
  
  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const { address, provider: walletProvider } = await connectWallet();
      setAccount(address);
      setProvider(walletProvider);
      
      const signer = await walletProvider.getSigner();
      
      // Initialize contract
      const profitPulseContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      setContract(profitPulseContract);
      
      // Get user balance
      const busdAddress = await profitPulseContract.busdToken();
      const busdContract = new ethers.Contract(
        busdAddress,
        ['function balanceOf(address) view returns (uint256)'],
        walletProvider
      );
      const userBalance = await busdContract.balanceOf(address);
      setBalance(ethers.formatUnits(userBalance, 18));
      
      // Get user details
      await fetchUserDetails(profitPulseContract, address);
      
      setLoading(false);
    } catch (error) {
      console.error('Connection error:', error);
      setError('Failed to connect wallet');
      setLoading(false);
    }
  };
  
  // Refresh user data
  const refreshUserData = async () => {
    if (contract && account) {
      try {
        setLoading(true);
        
        // Get user balance
        const busdAddress = await contract.busdToken();
        const busdContract = new ethers.Contract(
          busdAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const userBalance = await busdContract.balanceOf(account);
        setBalance(ethers.formatUnits(userBalance, 18));
        
        // Get user details
        await fetchUserDetails(contract, account);
        
        setLoading(false);
      } catch (error) {
        console.error('Refresh error:', error);
        setError('Failed to refresh user data');
        setLoading(false);
      }
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="app">
        <Header 
          account={account} 
          balance={balance} 
          onConnectWallet={handleConnectWallet} 
        />
        <main className="main-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError('')}>Dismiss</button>
            </div>
          )}
          <Switch>
            <Route exact path="/">
              <Dashboard 
                account={account}
                userDetails={userDetails}
                loading={loading}
                refreshUserData={refreshUserData}
              />
            </Route>
            <Route path="/deposit">
              <Deposit 
                account={account}
                balance={balance}
                contract={contract}
                refreshUserData={refreshUserData}
              />
            </Route>
            <Route path="/withdraw">
              <Withdraw 
                account={account}
                userDetails={userDetails}
                contract={contract}
                refreshUserData={refreshUserData}
              />
            </Route>
            <Route path="/referral">
              <Referral 
                account={account}
                userDetails={userDetails}
                contract={contract}
                refreshUserData={refreshUserData}
              />
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;

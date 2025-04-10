import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { Route, Switch, useHistory } from 'react-router-dom';
import { ethers } from 'ethers';

// Components
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';

// Pages
import Dashboard from './pages/Dashboard';
import LiquidityManagement from './pages/LiquidityManagement';
import ContractControl from './pages/ContractControl';
import EarningsDistribution from './pages/EarningsDistribution';
import Governance from './pages/Governance';
import UserSupport from './pages/UserSupport';
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
      main: '#2196f3', // Blue
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
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [platformData, setPlatformData] = useState({
    totalDeposits: 0,
    userCount: 0,
    contractBalance: 0,
    paused: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
          
          // Fetch platform data
          await fetchPlatformData(profitPulseContract, provider);
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
  
  // Fetch platform data from contract
  const fetchPlatformData = async (contractInstance, providerInstance) => {
    try {
      setLoading(true);
      
      // Get total deposits
      const totalDeposits = await contractInstance.totalDeposits();
      
      // Get user count
      const userCount = await contractInstance.userCount();
      
      // Get contract balance
      const busdAddress = await contractInstance.busdToken();
      const busdContract = new ethers.Contract(
        busdAddress,
        ['function balanceOf(address) view returns (uint256)'],
        providerInstance
      );
      const contractBalance = await busdContract.balanceOf(await contractInstance.getAddress());
      
      // Get paused status
      const paused = await contractInstance.paused();
      
      setPlatformData({
        totalDeposits: ethers.formatUnits(totalDeposits, 18),
        userCount: Number(userCount),
        contractBalance: ethers.formatUnits(contractBalance, 18),
        paused
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching platform data:', error);
      setError('Failed to fetch platform data');
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
      
      // Fetch platform data
      await fetchPlatformData(profitPulseContract, walletProvider);
      
      setLoading(false);
    } catch (error) {
      console.error('Connection error:', error);
      setError('Failed to connect wallet');
      setLoading(false);
    }
  };
  
  // Refresh platform data
  const refreshPlatformData = async () => {
    if (contract && provider) {
      await fetchPlatformData(contract, provider);
    }
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="admin-app" style={{ display: 'flex' }}>
        <AdminSidebar 
          open={sidebarOpen} 
          onClose={toggleSidebar}
        />
        <div style={{ flexGrow: 1 }}>
          <AdminHeader 
            account={account} 
            onConnectWallet={handleConnectWallet}
            onToggleSidebar={toggleSidebar}
          />
          <main style={{ padding: '20px' }}>
            {error && (
              <div className="error-message" style={{ color: '#f44336', marginBottom: '20px' }}>
                {error}
                <button onClick={() => setError('')} style={{ marginLeft: '10px' }}>Dismiss</button>
              </div>
            )}
            <Switch>
              <Route exact path="/">
                <Dashboard 
                  account={account}
                  platformData={platformData}
                  loading={loading}
                  refreshPlatformData={refreshPlatformData}
                />
              </Route>
              <Route path="/liquidity">
                <LiquidityManagement 
                  account={account}
                  contract={contract}
                  platformData={platformData}
                  refreshPlatformData={refreshPlatformData}
                />
              </Route>
              <Route path="/contract-control">
                <ContractControl 
                  account={account}
                  contract={contract}
                  platformData={platformData}
                  refreshPlatformData={refreshPlatformData}
                />
              </Route>
              <Route path="/earnings">
                <EarningsDistribution 
                  account={account}
                  contract={contract}
                  refreshPlatformData={refreshPlatformData}
                />
              </Route>
              <Route path="/governance">
                <Governance 
                  account={account}
                  contract={contract}
                  refreshPlatformData={refreshPlatformData}
                />
              </Route>
              <Route path="/user-support">
                <UserSupport 
                  account={account}
                  contract={contract}
                />
              </Route>
              <Route>
                <NotFound />
              </Route>
            </Switch>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;

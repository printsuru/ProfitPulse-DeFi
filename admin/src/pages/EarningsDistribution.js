import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  makeStyles,
  Divider,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@material-ui/core';
import { ethers } from 'ethers';
import { formatCurrency } from '../utils/wallet';

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#2d2d2d',
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  card: {
    backgroundColor: '#1e1e1e',
    marginBottom: theme.spacing(3),
  },
  cardTitle: {
    color: '#b3b3b3',
    marginBottom: theme.spacing(1),
  },
  cardValue: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
  button: {
    marginTop: theme.spacing(2),
    backgroundColor: '#2196f3',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#1976d2',
    },
  },
  divider: {
    margin: theme.spacing(3, 0),
    backgroundColor: '#444444',
  },
  table: {
    backgroundColor: '#1e1e1e',
  },
  tableHead: {
    backgroundColor: '#121212',
  },
  tableHeadCell: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
  noWallet: {
    textAlign: 'center',
    padding: theme.spacing(5),
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(5),
  },
  error: {
    color: '#f44336',
    marginTop: theme.spacing(2),
  },
  success: {
    color: '#4caf50',
    marginTop: theme.spacing(2),
  },
  searchField: {
    marginBottom: theme.spacing(3),
  },
  statusRunning: {
    color: '#4caf50',
  },
  statusPending: {
    color: '#ff9800',
  }
}));

const EarningsDistribution = ({ account, contract, refreshPlatformData }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');
  
  // Mock data for last profit update
  useEffect(() => {
    // In a real implementation, this would be fetched from the contract or backend
    const mockLastUpdate = new Date();
    mockLastUpdate.setHours(mockLastUpdate.getHours() - 2);
    setLastUpdate(mockLastUpdate);
  }, []);
  
  // Handle calculate profits for all users
  const handleCalculateProfitsForAll = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    try {
      setLoading(true);
      setIsRunning(true);
      setError('');
      setSuccess('');
      
      // In a real implementation, this would call a backend API or script
      // that iterates through all users and calls calculateProfit for each
      
      // Simulate processing time
      setTimeout(() => {
        setSuccess('Profit calculation for all users has been initiated. This process will run in the background.');
        setLastUpdate(new Date());
        setLoading(false);
        
        // Simulate completion after some time
        setTimeout(() => {
          setIsRunning(false);
          setSuccess('Profit calculation for all users has been completed successfully.');
        }, 10000);
      }, 3000);
      
    } catch (error) {
      console.error('Profit calculation error:', error);
      setError('Failed to calculate profits. Please try again.');
      setLoading(false);
      setIsRunning(false);
    }
  };
  
  // Handle user address change
  const handleUserAddressChange = (event) => {
    setUserAddress(event.target.value);
  };
  
  // Handle search user
  const handleSearchUser = async () => {
    if (!account || !contract) {
      setUserError('Please connect your wallet first');
      return;
    }
    
    if (!userAddress || !ethers.isAddress(userAddress)) {
      setUserError('Please enter a valid Ethereum address');
      return;
    }
    
    try {
      setUserLoading(true);
      setUserError('');
      
      // Get user details from contract
      const details = await contract.getUserDetails(userAddress);
      
      setUserDetails({
        address: userAddress,
        investment: ethers.formatUnits(details[0], 18),
        profits: ethers.formatUnits(details[1], 18),
        tier: Number(details[2]),
        referrer: details[3],
        referralCount: Number(details[4]),
        referralRewards: ethers.formatUnits(details[5], 18),
        lastProfitUpdate: new Date(Date.now() - Math.floor(Math.random() * 86400000)) // Mock data
      });
      
      setUserLoading(false);
    } catch (error) {
      console.error('User search error:', error);
      setUserError('Failed to fetch user details. Please try again.');
      setUserLoading(false);
    }
  };
  
  // Handle calculate profit for specific user
  const handleCalculateProfitForUser = async () => {
    if (!account || !contract || !userDetails) {
      setUserError('Please connect your wallet and search for a user first');
      return;
    }
    
    try {
      setUserLoading(true);
      setUserError('');
      
      // Call calculateProfit for the specific user
      const tx = await contract.calculateProfit(userDetails.address);
      
      await tx.wait();
      
      // Refresh user details
      const details = await contract.getUserDetails(userDetails.address);
      
      setUserDetails({
        ...userDetails,
        profits: ethers.formatUnits(details[1], 18),
        lastProfitUpdate: new Date()
      });
      
      setUserLoading(false);
      setSuccess(`Profit calculated successfully for user ${userDetails.address}`);
    } catch (error) {
      console.error('Profit calculation error:', error);
      setUserError('Failed to calculate profit. Please try again.');
      setUserLoading(false);
    }
  };
  
  // If no wallet is connected
  if (!account) {
    return (
      <Container className={classes.container}>
        <Paper className={classes.paper}>
          <div className={classes.noWallet}>
            <Typography variant="h5" gutterBottom>
              Connect your wallet to manage earnings distribution
            </Typography>
            <Typography variant="body1" gutterBottom>
              You need to connect with a wallet that has admin privileges
            </Typography>
          </div>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container className={classes.container}>
      <Paper className={classes.paper}>
        <Typography variant="h4" className={classes.title}>
          Earnings Distribution
        </Typography>
        
        {/* Profit Calculation Status */}
        <Card className={classes.card}>
          <CardContent>
            <Typography variant="subtitle1" className={classes.cardTitle}>
              Profit Calculation Status
            </Typography>
            <Typography variant="h6" className={isRunning ? classes.statusRunning : ''}>
              {isRunning ? 'RUNNING' : 'IDLE'}
            </Typography>
            
            <Typography variant="body2" style={{ marginTop: '8px' }}>
              Last Update: {lastUpdate ? lastUpdate.toLocaleString() : 'Never'}
            </Typography>
            
            <Button
              variant="contained"
              className={classes.button}
              onClick={handleCalculateProfitsForAll}
              disabled={loading || isRunning}
            >
              {loading ? <CircularProgress size={24} /> : 'Calculate Profits for All Users'}
            </Button>
          </CardContent>
        </Card>
        
        {error && (
          <Typography variant="body2" className={classes.error}>
            {error}
          </Typography>
        )}
        
        {success && (
          <Typography variant="body2" className={classes.success}>
            {success}
          </Typography>
        )}
        
        <Divider className={classes.divider} />
        
        {/* User Search */}
        <Typography variant="h5" gutterBottom>
          User Profit Management
        </Typography>
        
        <TextField
          label="User Address"
          variant="outlined"
          fullWidth
          className={classes.searchField}
          value={userAddress}
          onChange={handleUserAddressChange}
          placeholder="0x..."
        />
        
        <Button
          variant="contained"
          className={classes.button}
          onClick={handleSearchUser}
          disabled={userLoading || !userAddress || !ethers.isAddress(userAddress)}
        >
          {userLoading ? <CircularProgress size={24} /> : 'Search User'}
        </Button>
        
        {userError && (
          <Typography variant="body2" className={classes.error}>
            {userError}
          </Typography>
        )}
        
        {/* User Details */}
        {userDetails && (
          <div style={{ marginTop: '20px' }}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Details
                </Typography>
                
                <TableContainer>
                  <Table className={classes.table}>
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Address</TableCell>
                        <TableCell>{userDetails.address}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Investment</TableCell>
                        <TableCell>${formatCurrency(userDetails.investment)} BUSD</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Available Profits</TableCell>
                        <TableCell>${formatCurrency(userDetails.profits)} BUSD</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Tier</TableCell>
                        <TableCell>{userDetails.tier}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Referral Count</TableCell>
                        <TableCell>{userDetails.referralCount}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Referral Rewards</TableCell>
                        <TableCell>${formatCurrency(userDetails.referralRewards)} BUSD</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Last Profit Update</TableCell>
                        <TableCell>{userDetails.lastProfitUpdate.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Button
                  variant="contained"
                  className={classes.button}
                  onClick={handleCalculateProfitForUser}
                  disabled={userLoading}
                >
                  {userLoading ? <CircularProgress size={24} /> : 'Calculate Profit for This User'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Divider className={classes.divider} />
        
        <Typography variant="h6" gutterBottom>
          Profit Distribution Information
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Profits are calculated based on user's investment tier
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Tier 1 (Bronze): 2% daily for investments &lt; $500
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Tier 2 (Silver): 3% daily for investments &lt; $1,000
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Tier 3 (Gold): 3.5% daily for investments &lt; $2,000
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Tier 4 (Platinum): 4% daily for investments ≥ $2,000
        </Typography>
        
        <Typography variant="body2">
          • The "Calculate Profits for All Users" function should be run once daily
        </Typography>
      </Paper>
    </Container>
  );
};

export default EarningsDistribution;

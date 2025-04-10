import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  makeStyles,
  FormControl,
  InputLabel,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Grid,
  LinearProgress
} from '@material-ui/core';
import { ethers } from 'ethers';
import { formatCurrency, createMultiSigTransaction } from '../utils/wallet';
import { BUSD_ADDRESS, BUSD_ABI, MULTISIG_ADDRESS, MULTISIG_ABI } from '../utils/constants';

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
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  formControl: {
    marginBottom: theme.spacing(3),
  },
  button: {
    marginTop: theme.spacing(3),
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
  liquidityBar: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    height: 10,
    borderRadius: 5,
  },
  liquidityBarRoot: {
    backgroundColor: '#444444',
  },
  liquidityBarColorPrimary: {
    backgroundColor: props => props.ratio < 0.1 ? '#f44336' : props.ratio < 0.3 ? '#ff9800' : '#4caf50',
  },
  warningText: {
    color: '#ff9800',
  },
  criticalText: {
    color: '#f44336',
  },
  healthyText: {
    color: '#4caf50',
  }
}));

const LiquidityManagement = ({ account, contract, platformData, refreshPlatformData }) => {
  const [amount, setAmount] = useState('');
  const [cap, setCap] = useState('');
  const [loading, setLoading] = useState(false);
  const [capLoading, setCapLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Calculate liquidity ratio
  const liquidityRatio = platformData.totalDeposits > 0 
    ? platformData.contractBalance / platformData.totalDeposits 
    : 1;
  
  const classes = useStyles({ ratio: liquidityRatio });
  
  // Handle amount change
  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };
  
  // Handle cap change
  const handleCapChange = (event) => {
    setCap(event.target.value);
  };
  
  // Handle add liquidity
  const handleAddLiquidity = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get BUSD contract
      const busdContract = new ethers.Contract(
        BUSD_ADDRESS,
        BUSD_ABI,
        signer
      );
      
      // Check BUSD balance
      const balance = await busdContract.balanceOf(account);
      if (ethers.formatUnits(balance, 18) < parseFloat(amount)) {
        setError('Insufficient BUSD balance');
        setLoading(false);
        return;
      }
      
      // Get MultiSig contract
      const multiSigContract = new ethers.Contract(
        MULTISIG_ADDRESS,
        MULTISIG_ABI,
        signer
      );
      
      // Approve BUSD for contract
      const amountWei = ethers.parseUnits(amount, 18);
      const approveTx = await busdContract.approve(await contract.getAddress(), amountWei);
      
      setSuccess('Approval transaction submitted. Please wait for confirmation...');
      
      await approveTx.wait();
      
      // Create transaction in multisig to add liquidity
      const tx = await createMultiSigTransaction(
        multiSigContract,
        contract,
        'addLiquidity',
        [amountWei]
      );
      
      setSuccess('Transaction submitted to multi-sig wallet. Waiting for required confirmations...');
      
      await tx.wait();
      
      setSuccess('Liquidity addition transaction submitted to multi-sig wallet. It requires additional confirmations from other owners to execute.');
      setAmount('');
      refreshPlatformData();
      setLoading(false);
    } catch (error) {
      console.error('Liquidity addition error:', error);
      setError('Failed to add liquidity. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle set withdrawal cap
  const handleSetWithdrawalCap = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (cap !== '0' && (!cap || isNaN(cap) || parseFloat(cap) < 0)) {
      setError('Please enter a valid cap amount (0 for no cap)');
      return;
    }
    
    try {
      setCapLoading(true);
      setError('');
      setSuccess('');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get MultiSig contract
      const multiSigContract = new ethers.Contract(
        MULTISIG_ADDRESS,
        MULTISIG_ABI,
        signer
      );
      
      // Convert cap to wei
      const capWei = cap === '0' ? 0 : ethers.parseUnits(cap, 18);
      
      // Create transaction in multisig to set withdrawal cap
      const tx = await createMultiSigTransaction(
        multiSigContract,
        contract,
        'setWithdrawalCap',
        [capWei]
      );
      
      setSuccess('Transaction submitted to multi-sig wallet. Waiting for required confirmations...');
      
      await tx.wait();
      
      setSuccess('Withdrawal cap update transaction submitted to multi-sig wallet. It requires additional confirmations from other owners to execute.');
      setCap('');
      refreshPlatformData();
      setCapLoading(false);
    } catch (error) {
      console.error('Withdrawal cap update error:', error);
      setError('Failed to update withdrawal cap. Please try again.');
      setCapLoading(false);
    }
  };
  
  // If no wallet is connected
  if (!account) {
    return (
      <Container className={classes.container}>
        <Paper className={classes.paper}>
          <div className={classes.noWallet}>
            <Typography variant="h5" gutterBottom>
              Connect your wallet to manage liquidity
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
          Liquidity Management
        </Typography>
        
        <Grid container spacing={3}>
          {/* TVL Card */}
          <Grid item xs={12} sm={6}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Total Value Locked
                </Typography>
                <Typography variant="h5" className={classes.cardValue}>
                  ${formatCurrency(platformData.totalDeposits)} BUSD
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Contract Balance Card */}
          <Grid item xs={12} sm={6}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Contract Balance
                </Typography>
                <Typography variant="h5" className={classes.cardValue}>
                  ${formatCurrency(platformData.contractBalance)} BUSD
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Liquidity Ratio */}
        <Card className={classes.card} style={{ marginTop: '20px' }}>
          <CardContent>
            <Typography variant="subtitle1" className={classes.cardTitle}>
              Liquidity Ratio
            </Typography>
            <Typography variant="h5" className={classes.cardValue}>
              {(liquidityRatio * 100).toFixed(2)}%
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={Math.min(liquidityRatio * 100, 100)} 
              classes={{
                root: classes.liquidityBarRoot,
                bar: classes.liquidityBarColorPrimary
              }}
              className={classes.liquidityBar}
            />
            
            <Typography variant="body2" className={
              liquidityRatio < 0.1 ? classes.criticalText : 
              liquidityRatio < 0.3 ? classes.warningText : 
              classes.healthyText
            }>
              {liquidityRatio < 0.1 ? 'CRITICAL: Contract balance is below 10% of TVL' : 
               liquidityRatio < 0.3 ? 'WARNING: Contract balance is below 30% of TVL' : 
               'HEALTHY: Contract has sufficient liquidity'}
            </Typography>
          </CardContent>
        </Card>
        
        <Divider className={classes.divider} />
        
        {/* Add Liquidity Form */}
        <Typography variant="h5" gutterBottom>
          Add Liquidity
        </Typography>
        
        <form className={classes.form} noValidate>
          <FormControl fullWidth className={classes.formControl}>
            <TextField
              label="BUSD Amount"
              variant="outlined"
              value={amount}
              onChange={handleAmountChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </FormControl>
          
          <Button
            fullWidth
            variant="contained"
            className={classes.button}
            onClick={handleAddLiquidity}
            disabled={loading || !amount || isNaN(amount) || parseFloat(amount) <= 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Liquidity (Multi-Sig)'}
          </Button>
        </form>
        
        <Divider className={classes.divider} />
        
        {/* Set Withdrawal Cap Form */}
        <Typography variant="h5" gutterBottom>
          Set Withdrawal Cap
        </Typography>
        
        <Typography variant="body2" paragraph>
          Current cap: {platformData.withdrawalCap > 0 
            ? `$${formatCurrency(platformData.withdrawalCap)} BUSD` 
            : 'No cap'}
        </Typography>
        
        <form className={classes.form} noValidate>
          <FormControl fullWidth className={classes.formControl}>
            <TextField
              label="Withdrawal Cap (0 for no cap)"
              variant="outlined"
              value={cap}
              onChange={handleCapChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </FormControl>
          
          <Button
            fullWidth
            variant="contained"
            className={classes.button}
            onClick={handleSetWithdrawalCap}
            disabled={capLoading || cap === '' || isNaN(cap) || parseFloat(cap) < 0}
          >
            {capLoading ? <CircularProgress size={24} /> : 'Set Withdrawal Cap (Multi-Sig)'}
          </Button>
        </form>
        
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
        
        <Typography variant="h6" gutterBottom>
          Multi-Signature Requirements
        </Typography>
        
        <Typography variant="body2" paragraph>
          • All liquidity management actions require multi-signature approval
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Transactions must be confirmed by the required number of owners
        </Typography>
        
        <Typography variant="body2">
          • Check the Governance page to view pending transactions
        </Typography>
      </Paper>
    </Container>
  );
};

export default LiquidityManagement;

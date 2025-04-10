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
  Grid
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
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  formControl: {
    marginBottom: theme.spacing(3),
  },
  button: {
    marginTop: theme.spacing(3),
    backgroundColor: '#4caf50',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#388e3c',
    },
  },
  divider: {
    margin: theme.spacing(3, 0),
    backgroundColor: '#444444',
  },
  balanceCard: {
    backgroundColor: '#1e1e1e',
    marginBottom: theme.spacing(3),
  },
  balanceTitle: {
    color: '#b3b3b3',
    marginBottom: theme.spacing(1),
  },
  balanceValue: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
  profitValue: {
    color: '#4caf50',
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
  withdrawAllButton: {
    marginTop: theme.spacing(2),
    backgroundColor: '#ffd700',
    color: '#000000',
    '&:hover': {
      backgroundColor: '#e6c200',
    },
  },
  statusBar: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: '#1e1e1e',
    borderRadius: theme.shape.borderRadius,
  },
  statusPending: {
    color: '#ffd700',
  },
  statusConfirmed: {
    color: '#4caf50',
  }
}));

const Withdraw = ({ account, userDetails, contract, refreshUserData }) => {
  const classes = useStyles();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState(''); // 'pending' or 'confirmed'
  
  // Handle amount change
  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };
  
  // Handle withdraw
  const handleWithdraw = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > parseFloat(userDetails.profits)) {
      setError('Insufficient profits balance');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setStatus('pending');
      
      // Convert amount to wei
      const amountWei = ethers.parseUnits(amount, 18);
      
      // Call withdraw function
      const tx = await contract.withdraw(amountWei);
      setTxHash(tx.hash);
      
      setSuccess('Withdrawal transaction submitted. Please wait for confirmation...');
      
      await tx.wait();
      
      setSuccess('Withdrawal successful!');
      setStatus('confirmed');
      setAmount('');
      refreshUserData();
      setLoading(false);
    } catch (error) {
      console.error('Withdrawal error:', error);
      setError('Failed to withdraw. Please try again.');
      setStatus('');
      setLoading(false);
    }
  };
  
  // Handle withdraw all
  const handleWithdrawAll = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (parseFloat(userDetails.profits) <= 0 && parseFloat(userDetails.investment) <= 0) {
      setError('No funds to withdraw');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setStatus('pending');
      
      // Call withdrawAll function
      const tx = await contract.withdrawAll();
      setTxHash(tx.hash);
      
      setSuccess('Withdrawal transaction submitted. Please wait for confirmation...');
      
      await tx.wait();
      
      setSuccess('Withdrawal successful! All funds have been transferred to your wallet.');
      setStatus('confirmed');
      refreshUserData();
      setLoading(false);
    } catch (error) {
      console.error('Withdrawal error:', error);
      setError('Failed to withdraw. Please try again.');
      setStatus('');
      setLoading(false);
    }
  };
  
  // If no wallet is connected
  if (!account) {
    return (
      <Container className={classes.container}>
        <Paper className={classes.paper}>
          <div className={classes.noWallet}>
            <Typography variant="h5" gutterBottom>
              Connect your wallet to withdraw funds
            </Typography>
            <Typography variant="body1" gutterBottom>
              Use MetaMask, Trust Wallet, or TokenPocket to connect to ProfitPulse DeFi
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
          Withdraw Funds
        </Typography>
        
        <Grid container spacing={3}>
          {/* Profits Card */}
          <Grid item xs={12} sm={6}>
            <Card className={classes.balanceCard}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.balanceTitle}>
                  Available Profits
                </Typography>
                <Typography variant="h5" className={classes.profitValue}>
                  ${formatCurrency(userDetails.profits)} BUSD
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Investment Card */}
          <Grid item xs={12} sm={6}>
            <Card className={classes.balanceCard}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.balanceTitle}>
                  Total Investment
                </Typography>
                <Typography variant="h5" className={classes.balanceValue}>
                  ${formatCurrency(userDetails.investment)} BUSD
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <form className={classes.form} noValidate>
          <FormControl fullWidth className={classes.formControl}>
            <TextField
              label="Amount to Withdraw"
              variant="outlined"
              value={amount}
              onChange={handleAmountChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText={`Maximum: ${parseFloat(userDetails.profits).toFixed(2)} BUSD (profits only)`}
            />
          </FormControl>
          
          <Button
            fullWidth
            variant="contained"
            className={classes.button}
            onClick={handleWithdraw}
            disabled={loading || !amount || isNaN(amount) || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(userDetails.profits)}
          >
            {loading ? <CircularProgress size={24} /> : 'Withdraw Now'}
          </Button>
          
          <Button
            fullWidth
            variant="contained"
            className={classes.withdrawAllButton}
            onClick={handleWithdrawAll}
            disabled={loading || (parseFloat(userDetails.profits) <= 0 && parseFloat(userDetails.investment) <= 0)}
          >
            {loading ? <CircularProgress size={24} /> : 'Withdraw All (Profits + Investment)'}
          </Button>
          
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
          
          {status && (
            <div className={classes.statusBar}>
              <Typography 
                variant="body1" 
                className={status === 'pending' ? classes.statusPending : classes.statusConfirmed}
              >
                Status: {status === 'pending' ? 'Pending' : 'Confirmed'}
              </Typography>
              
              {txHash && (
                <Typography variant="body2">
                  Transaction: <a 
                    href={`https://bscscan.com/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#ffd700' }}
                  >
                    View on BscScan
                  </a>
                </Typography>
              )}
            </div>
          )}
        </form>
        
        <Divider className={classes.divider} />
        
        <Typography variant="h6" gutterBottom>
          Withdrawal Information
        </Typography>
        
        <Typography variant="body1" paragraph>
          • You can withdraw your profits at any time with no fees.
        </Typography>
        
        <Typography variant="body1" paragraph>
          • To withdraw your investment, use the "Withdraw All" button.
        </Typography>
        
        <Typography variant="body1" paragraph>
          • Withdrawals are processed instantly and sent directly to your wallet.
        </Typography>
        
        <Typography variant="body1">
          • All withdrawals are subject to available contract liquidity.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Withdraw;

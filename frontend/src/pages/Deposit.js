import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  makeStyles,
  Slider,
  FormControl,
  InputLabel,
  InputAdornment,
  Divider,
  Card,
  CardContent
} from '@material-ui/core';
import { ethers } from 'ethers';
import { BUSD_ADDRESS, BUSD_ABI, MIN_DEPOSIT, INVESTMENT_TIERS } from '../utils/constants';
import { calculateDailyProfit, getReferrerFromURL } from '../utils/wallet';

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
  slider: {
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(3),
    color: '#ffd700',
  },
  sliderLabel: {
    marginBottom: theme.spacing(1),
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
  previewCard: {
    backgroundColor: '#1e1e1e',
    marginTop: theme.spacing(3),
  },
  previewTitle: {
    color: '#b3b3b3',
    marginBottom: theme.spacing(1),
  },
  previewValue: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  tierInfo: {
    marginTop: theme.spacing(2),
    color: '#ffd700',
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
  }
}));

const Deposit = ({ account, balance, contract, refreshUserData }) => {
  const classes = useStyles();
  const [amount, setAmount] = useState('');
  const [referrer, setReferrer] = useState('');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allowance, setAllowance] = useState(0);
  const [dailyProfit, setDailyProfit] = useState(0);
  const [profitRate, setProfitRate] = useState(2);
  
  // Get referrer from URL if available
  useEffect(() => {
    const urlReferrer = getReferrerFromURL();
    if (urlReferrer) {
      setReferrer(urlReferrer);
    }
  }, []);
  
  // Check BUSD allowance when account changes
  useEffect(() => {
    const checkAllowance = async () => {
      if (account && contract) {
        try {
          const busdAddress = await contract.busdToken();
          const busdContract = new ethers.Contract(
            busdAddress,
            BUSD_ABI,
            new ethers.BrowserProvider(window.ethereum)
          );
          
          const currentAllowance = await busdContract.allowance(account, await contract.getAddress());
          setAllowance(ethers.formatUnits(currentAllowance, 18));
        } catch (error) {
          console.error('Error checking allowance:', error);
        }
      }
    };
    
    checkAllowance();
  }, [account, contract]);
  
  // Calculate daily profit when amount changes
  useEffect(() => {
    if (amount && !isNaN(amount)) {
      const amountNum = parseFloat(amount);
      let rate;
      
      // Determine profit rate based on investment tier
      if (amountNum < 500) {
        rate = 2;
      } else if (amountNum < 1000) {
        rate = 3;
      } else if (amountNum < 2000) {
        rate = 3.5;
      } else {
        rate = 4;
      }
      
      setProfitRate(rate);
      setDailyProfit((amountNum * rate) / 100);
    } else {
      setDailyProfit(0);
    }
  }, [amount]);
  
  // Handle amount change
  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };
  
  // Handle referrer change
  const handleReferrerChange = (event) => {
    setReferrer(event.target.value);
  };
  
  // Handle slider change
  const handleSliderChange = (event, newValue) => {
    setAmount(newValue.toString());
  };
  
  // Handle approve BUSD
  const handleApprove = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) < MIN_DEPOSIT) {
      setError(`Minimum deposit amount is ${MIN_DEPOSIT} BUSD`);
      return;
    }
    
    try {
      setApproving(true);
      setError('');
      setSuccess('');
      
      const busdAddress = await contract.busdToken();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const busdContract = new ethers.Contract(
        busdAddress,
        BUSD_ABI,
        signer
      );
      
      const amountToApprove = ethers.parseUnits(amount, 18);
      const tx = await busdContract.approve(await contract.getAddress(), amountToApprove);
      
      setSuccess('Approval transaction submitted. Please wait for confirmation...');
      
      await tx.wait();
      
      setSuccess('BUSD approved successfully! You can now deposit.');
      setAllowance(amount);
      setApproving(false);
    } catch (error) {
      console.error('Approval error:', error);
      setError('Failed to approve BUSD. Please try again.');
      setApproving(false);
    }
  };
  
  // Handle deposit
  const handleDeposit = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) < MIN_DEPOSIT) {
      setError(`Minimum deposit amount is ${MIN_DEPOSIT} BUSD`);
      return;
    }
    
    if (parseFloat(amount) > parseFloat(balance)) {
      setError('Insufficient BUSD balance');
      return;
    }
    
    if (parseFloat(allowance) < parseFloat(amount)) {
      setError('Please approve BUSD first');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Validate referrer address if provided
      let referrerAddress = ethers.ZeroAddress;
      if (referrer && referrer.trim() !== '') {
        try {
          referrerAddress = ethers.getAddress(referrer);
        } catch (error) {
          setError('Invalid referrer address');
          setLoading(false);
          return;
        }
      }
      
      // Call deposit function
      const tx = await contract.deposit(referrerAddress);
      
      setSuccess('Deposit transaction submitted. Please wait for confirmation...');
      
      await tx.wait();
      
      setSuccess('Deposit successful!');
      setAmount('');
      refreshUserData();
      setLoading(false);
    } catch (error) {
      console.error('Deposit error:', error);
      setError('Failed to deposit. Please try again.');
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
              Connect your wallet to make a deposit
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
          Deposit BUSD
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
              helperText={`Available Balance: ${parseFloat(balance).toFixed(2)} BUSD`}
            />
          </FormControl>
          
          <Typography variant="body2" className={classes.sliderLabel}>
            Select Amount:
          </Typography>
          <Slider
            value={amount ? parseFloat(amount) : 0}
            onChange={handleSliderChange}
            aria-labelledby="deposit-amount-slider"
            min={10}
            max={5000}
            step={10}
            className={classes.slider}
            valueLabelDisplay="auto"
          />
          
          <FormControl fullWidth className={classes.formControl}>
            <TextField
              label="Referrer Address (Optional)"
              variant="outlined"
              value={referrer}
              onChange={handleReferrerChange}
              placeholder="0x..."
            />
          </FormControl>
          
          {/* Preview Card */}
          <Card className={classes.previewCard}>
            <CardContent>
              <Typography variant="h6" className={classes.previewTitle}>
                Your Daily Profit:
              </Typography>
              <Typography variant="h4" className={classes.previewValue}>
                {profitRate}% = ${dailyProfit.toFixed(2)}/day
              </Typography>
              
              <Typography variant="body2" className={classes.tierInfo}>
                {amount && parseFloat(amount) >= MIN_DEPOSIT ? (
                  <>
                    Investment Tier: {
                      parseFloat(amount) < 500 ? 'Bronze (2%)' :
                      parseFloat(amount) < 1000 ? 'Silver (3%)' :
                      parseFloat(amount) < 2000 ? 'Gold (3.5%)' :
                      'Platinum (4%)'
                    }
                  </>
                ) : (
                  'Enter an amount to see your profit tier'
                )}
              </Typography>
            </CardContent>
          </Card>
          
          {parseFloat(allowance) < parseFloat(amount || 0) ? (
            <Button
              fullWidth
              variant="contained"
              className={classes.button}
              onClick={handleApprove}
              disabled={approving || !amount || isNaN(amount) || parseFloat(amount) < MIN_DEPOSIT}
            >
              {approving ? <CircularProgress size={24} /> : 'Approve BUSD'}
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              className={classes.button}
              onClick={handleDeposit}
              disabled={loading || !amount || isNaN(amount) || parseFloat(amount) < MIN_DEPOSIT}
            >
              {loading ? <CircularProgress size={24} /> : 'Deposit Now'}
            </Button>
          )}
          
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
        </form>
        
        <Divider className={classes.divider} />
        
        {/* Investment Tiers Information */}
        <Typography variant="h5" gutterBottom>
          Investment Tiers
        </Typography>
        
        {INVESTMENT_TIERS.map((tier, index) => (
          <Typography key={index} variant="body1" gutterBottom>
            <strong>{tier.name}:</strong> {tier.rate}% daily for investments 
            {tier.min === 0 ? ' up to ' : ' between $' + tier.min + ' and '}
            {tier.max === Infinity ? '$' + tier.min + ' or more' : '$' + tier.max}
          </Typography>
        ))}
      </Paper>
    </Container>
  );
};

export default Deposit;

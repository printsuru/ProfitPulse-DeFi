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
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Card,
  CardContent,
  Grid
} from '@material-ui/core';
import { ethers } from 'ethers';
import { createMultiSigTransaction } from '../utils/wallet';
import { MULTISIG_ADDRESS, MULTISIG_ABI, INVESTMENT_TIERS, REFERRAL_LEVELS } from '../utils/constants';

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
  pauseSwitch: {
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: '#f44336',
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: '#f44336',
    },
  },
  pauseText: {
    color: props => props.paused ? '#f44336' : '#4caf50',
    fontWeight: 'bold',
  }
}));

const ContractControl = ({ account, contract, platformData, refreshPlatformData }) => {
  const [selectedTier, setSelectedTier] = useState(1);
  const [profitRate, setProfitRate] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [referralRate, setReferralRate] = useState('');
  const [paused, setPaused] = useState(platformData.paused);
  const [loading, setLoading] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const classes = useStyles({ paused: platformData.paused });
  
  // Handle tier change
  const handleTierChange = (event) => {
    setSelectedTier(event.target.value);
  };
  
  // Handle profit rate change
  const handleProfitRateChange = (event) => {
    setProfitRate(event.target.value);
  };
  
  // Handle level change
  const handleLevelChange = (event) => {
    setSelectedLevel(event.target.value);
  };
  
  // Handle referral rate change
  const handleReferralRateChange = (event) => {
    setReferralRate(event.target.value);
  };
  
  // Handle pause toggle
  const handlePauseToggle = (event) => {
    setPaused(event.target.checked);
  };
  
  // Handle update profit rate
  const handleUpdateProfitRate = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!profitRate || isNaN(profitRate) || parseFloat(profitRate) <= 0 || parseFloat(profitRate) > 10) {
      setError('Please enter a valid profit rate (0-10%)');
      return;
    }
    
    try {
      setLoading(true);
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
      
      // Convert rate to basis points (100 = 1%)
      const rateInBasisPoints = Math.floor(parseFloat(profitRate) * 100);
      
      // Create transaction in multisig to update profit rate
      const tx = await createMultiSigTransaction(
        multiSigContract,
        contract,
        'updateProfitRate',
        [selectedTier, rateInBasisPoints]
      );
      
      setSuccess('Transaction submitted to multi-sig wallet. Waiting for required confirmations...');
      
      await tx.wait();
      
      setSuccess(`Profit rate update transaction for Tier ${selectedTier} submitted to multi-sig wallet. It requires additional confirmations from other owners to execute.`);
      setProfitRate('');
      refreshPlatformData();
      setLoading(false);
    } catch (error) {
      console.error('Profit rate update error:', error);
      setError('Failed to update profit rate. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle update referral rate
  const handleUpdateReferralRate = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!referralRate || isNaN(referralRate) || parseFloat(referralRate) <= 0 || parseFloat(referralRate) > 20) {
      setError('Please enter a valid referral rate (0-20%)');
      return;
    }
    
    try {
      setReferralLoading(true);
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
      
      // Convert rate to basis points (100 = 1%)
      const rateInBasisPoints = Math.floor(parseFloat(referralRate) * 100);
      
      // Create transaction in multisig to update referral rate
      const tx = await createMultiSigTransaction(
        multiSigContract,
        contract,
        'updateReferralRate',
        [selectedLevel, rateInBasisPoints]
      );
      
      setSuccess('Transaction submitted to multi-sig wallet. Waiting for required confirmations...');
      
      await tx.wait();
      
      setSuccess(`Referral rate update transaction for Level ${selectedLevel} submitted to multi-sig wallet. It requires additional confirmations from other owners to execute.`);
      setReferralRate('');
      refreshPlatformData();
      setReferralLoading(false);
    } catch (error) {
      console.error('Referral rate update error:', error);
      setError('Failed to update referral rate. Please try again.');
      setReferralLoading(false);
    }
  };
  
  // Handle pause/unpause
  const handlePauseUnpause = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    try {
      setPauseLoading(true);
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
      
      // Create transaction in multisig to pause/unpause
      const tx = await createMultiSigTransaction(
        multiSigContract,
        contract,
        'pause',
        [paused]
      );
      
      setSuccess('Transaction submitted to multi-sig wallet. Waiting for required confirmations...');
      
      await tx.wait();
      
      setSuccess(`Contract ${paused ? 'pause' : 'unpause'} transaction submitted to multi-sig wallet. It requires additional confirmations from other owners to execute.`);
      refreshPlatformData();
      setPauseLoading(false);
    } catch (error) {
      console.error('Pause/unpause error:', error);
      setError(`Failed to ${paused ? 'pause' : 'unpause'} contract. Please try again.`);
      setPauseLoading(false);
    }
  };
  
  // If no wallet is connected
  if (!account) {
    return (
      <Container className={classes.container}>
        <Paper className={classes.paper}>
          <div className={classes.noWallet}>
            <Typography variant="h5" gutterBottom>
              Connect your wallet to control contract parameters
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
          Contract Control
        </Typography>
        
        {/* Contract Status */}
        <Card className={classes.card}>
          <CardContent>
            <Typography variant="subtitle1" className={classes.cardTitle}>
              Contract Status
            </Typography>
            <Typography variant="h5" className={classes.pauseText}>
              {platformData.paused ? 'PAUSED' : 'ACTIVE'}
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={paused}
                  onChange={handlePauseToggle}
                  className={classes.pauseSwitch}
                />
              }
              label={paused ? "Pause Contract" : "Unpause Contract"}
              style={{ marginTop: '16px' }}
            />
            
            <Button
              variant="contained"
              className={classes.button}
              onClick={handlePauseUnpause}
              disabled={pauseLoading || paused === platformData.paused}
            >
              {pauseLoading ? <CircularProgress size={24} /> : paused ? 'Pause Contract (Multi-Sig)' : 'Unpause Contract (Multi-Sig)'}
            </Button>
          </CardContent>
        </Card>
        
        <Divider className={classes.divider} />
        
        {/* Update Profit Rates */}
        <Typography variant="h5" gutterBottom>
          Update Profit Rates
        </Typography>
        
        <Grid container spacing={3}>
          {INVESTMENT_TIERS.map((tier, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card className={classes.card}>
                <CardContent>
                  <Typography variant="subtitle1" className={classes.cardTitle}>
                    {tier.name} Tier
                  </Typography>
                  <Typography variant="h6" className={classes.cardValue}>
                    {tier.rate}%
                  </Typography>
                  <Typography variant="body2">
                    {tier.min === 0 ? 'Up to ' : `$${tier.min} - `}
                    {tier.max === Infinity ? `$${tier.min}+` : `$${tier.max}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <form className={classes.form} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl variant="outlined" fullWidth className={classes.formControl}>
                <InputLabel id="tier-select-label">Select Tier</InputLabel>
                <Select
                  labelId="tier-select-label"
                  id="tier-select"
                  value={selectedTier}
                  onChange={handleTierChange}
                  label="Select Tier"
                >
                  <MenuItem value={1}>Tier 1 (Bronze)</MenuItem>
                  <MenuItem value={2}>Tier 2 (Silver)</MenuItem>
                  <MenuItem value={3}>Tier 3 (Gold)</MenuItem>
                  <MenuItem value={4}>Tier 4 (Platinum)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="New Profit Rate (%)"
                variant="outlined"
                fullWidth
                value={profitRate}
                onChange={handleProfitRateChange}
                helperText="Enter value between 0.1 and 10"
              />
            </Grid>
          </Grid>
          
          <Button
            fullWidth
            variant="contained"
            className={classes.button}
            onClick={handleUpdateProfitRate}
            disabled={loading || !profitRate || isNaN(profitRate) || parseFloat(profitRate) <= 0 || parseFloat(profitRate) > 10}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Profit Rate (Multi-Sig)'}
          </Button>
        </form>
        
        <Divider className={classes.divider} />
        
        {/* Update Referral Rates */}
        <Typography variant="h5" gutterBottom>
          Update Referral Rates
        </Typography>
        
        <Grid container spacing={3}>
          {REFERRAL_LEVELS.map((level, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Card className={classes.card}>
                <CardContent>
                  <Typography variant="subtitle1" className={classes.cardTitle}>
                    {level.name}
                  </Typography>
                  <Typography variant="h6" className={classes.cardValue}>
                    {level.rate}%
                  </Typography>
                  <Typography variant="body2">
                    Level {level.level}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <form className={classes.form} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl variant="outlined" fullWidth className={classes.formControl}>
                <InputLabel id="level-select-label">Select Level</InputLabel>
                <Select
                  labelId="level-select-label"
                  id="level-select"
                  value={selectedLevel}
                  onChange={handleLevelChange}
                  label="Select Level"
                >
                  <MenuItem value={1}>Level 1 (Direct)</MenuItem>
                  <MenuItem value={2}>Level 2</MenuItem>
                  <MenuItem value={3}>Level 3</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="New Referral Rate (%)"
                variant="outlined"
                fullWidth
                value={referralRate}
                onChange={handleReferralRateChange}
                helperText="Enter value between 0.1 and 20"
              />
            </Grid>
          </Grid>
          
          <Button
            fullWidth
            variant="contained"
            className={classes.button}
            onClick={handleUpdateReferralRate}
            disabled={referralLoading || !referralRate || isNaN(referralRate) || parseFloat(referralRate) <= 0 || parseFloat(referralRate) > 20}
          >
            {referralLoading ? <CircularProgress size={24} /> : 'Update Referral Rate (Multi-Sig)'}
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
          • All contract parameter changes require multi-signature approval
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

export default ContractControl;

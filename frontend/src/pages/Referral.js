import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  makeStyles,
  TextField,
  IconButton,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@material-ui/core';
import { FileCopy as CopyIcon } from '@material-ui/icons';
import { ethers } from 'ethers';
import { formatAddress, formatCurrency, generateReferralLink } from '../utils/wallet';

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
  referralCard: {
    backgroundColor: '#1e1e1e',
    marginBottom: theme.spacing(3),
  },
  referralTitle: {
    color: '#b3b3b3',
    marginBottom: theme.spacing(1),
  },
  referralValue: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
  linkContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: '#121212',
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
  },
  linkText: {
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  copyButton: {
    color: '#ffd700',
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
  noReferrals: {
    textAlign: 'center',
    padding: theme.spacing(3),
    color: '#b3b3b3',
  },
  levelBadge: {
    display: 'inline-block',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    color: '#000000',
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  level1Badge: {
    backgroundColor: '#ffd700', // Gold
  },
  level2Badge: {
    backgroundColor: '#c0c0c0', // Silver
  },
  level3Badge: {
    backgroundColor: '#cd7f32', // Bronze
  },
}));

const Referral = ({ account, userDetails, contract, refreshUserData }) => {
  const classes = useStyles();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Generate referral link
  const referralLink = generateReferralLink(account);
  
  // Fetch referrals when account or contract changes
  useEffect(() => {
    const fetchReferrals = async () => {
      if (account && contract) {
        try {
          setLoading(true);
          
          // Get user's referrals
          const referralAddresses = await contract.getUserReferrals(account);
          
          // Get details for each referral
          const referralDetails = await Promise.all(
            referralAddresses.map(async (address) => {
              const details = await contract.getUserDetails(address);
              return {
                address,
                investment: ethers.formatUnits(details[0], 18),
                profits: ethers.formatUnits(details[1], 18),
                tier: Number(details[2]),
                referrer: details[3],
                referralCount: Number(details[4]),
                referralRewards: ethers.formatUnits(details[5], 18)
              };
            })
          );
          
          // Get second level referrals
          const secondLevelReferrals = [];
          for (const referral of referralAddresses) {
            const secondLevelAddresses = await contract.getUserReferrals(referral);
            for (const address of secondLevelAddresses) {
              const details = await contract.getUserDetails(address);
              secondLevelReferrals.push({
                address,
                investment: ethers.formatUnits(details[0], 18),
                profits: ethers.formatUnits(details[1], 18),
                tier: Number(details[2]),
                referrer: details[3],
                referralCount: Number(details[4]),
                referralRewards: ethers.formatUnits(details[5], 18),
                level: 2,
                via: referral
              });
            }
          }
          
          // Get third level referrals
          const thirdLevelReferrals = [];
          for (const secondLevel of secondLevelReferrals) {
            const thirdLevelAddresses = await contract.getUserReferrals(secondLevel.address);
            for (const address of thirdLevelAddresses) {
              const details = await contract.getUserDetails(address);
              thirdLevelReferrals.push({
                address,
                investment: ethers.formatUnits(details[0], 18),
                profits: ethers.formatUnits(details[1], 18),
                tier: Number(details[2]),
                referrer: details[3],
                referralCount: Number(details[4]),
                referralRewards: ethers.formatUnits(details[5], 18),
                level: 3,
                via: secondLevel.address
              });
            }
          }
          
          // Combine all referrals
          const allReferrals = [
            ...referralDetails.map(ref => ({ ...ref, level: 1 })),
            ...secondLevelReferrals,
            ...thirdLevelReferrals
          ];
          
          setReferrals(allReferrals);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching referrals:', error);
          setError('Failed to fetch referrals');
          setLoading(false);
        }
      }
    };
    
    fetchReferrals();
  }, [account, contract]);
  
  // Handle copy referral link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // If no wallet is connected
  if (!account) {
    return (
      <Container className={classes.container}>
        <Paper className={classes.paper}>
          <div className={classes.noWallet}>
            <Typography variant="h5" gutterBottom>
              Connect your wallet to view your referrals
            </Typography>
            <Typography variant="body1" gutterBottom>
              Use MetaMask, Trust Wallet, or TokenPocket to connect to ProfitPulse DeFi
            </Typography>
          </div>
        </Paper>
      </Container>
    );
  }
  
  // If loading
  if (loading) {
    return (
      <Container className={classes.container}>
        <Paper className={classes.paper}>
          <div className={classes.loading}>
            <CircularProgress />
          </div>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container className={classes.container}>
      <Paper className={classes.paper}>
        <Typography variant="h4" className={classes.title}>
          Referral Program
        </Typography>
        
        <Card className={classes.referralCard}>
          <CardContent>
            <Typography variant="h6" className={classes.referralTitle}>
              Total Referral Earnings:
            </Typography>
            <Typography variant="h4" className={classes.referralValue}>
              ${formatCurrency(userDetails.referralRewards)} BUSD
            </Typography>
            
            <Typography variant="body1" style={{ marginTop: 16 }}>
              Share your referral link and earn:
            </Typography>
            <Typography variant="body1">
              • <strong>10%</strong> of your direct referrals' investments (Level 1)
            </Typography>
            <Typography variant="body1">
              • <strong>3%</strong> of your Level 2 referrals' investments
            </Typography>
            <Typography variant="body1">
              • <strong>2%</strong> of your Level 3 referrals' investments
            </Typography>
          </CardContent>
        </Card>
        
        <Typography variant="h6" gutterBottom>
          Your Referral Link:
        </Typography>
        
        <div className={classes.linkContainer}>
          <Typography variant="body1" className={classes.linkText}>
            {referralLink}
          </Typography>
          <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
            <IconButton 
              className={classes.copyButton} 
              onClick={handleCopyLink}
              size="small"
            >
              <CopyIcon />
            </IconButton>
          </Tooltip>
        </div>
        
        <Divider className={classes.divider} />
        
        <Typography variant="h6" gutterBottom>
          Your Referrals ({referrals.length})
        </Typography>
        
        {referrals.length > 0 ? (
          <TableContainer>
            <Table className={classes.table}>
              <TableHead className={classes.tableHead}>
                <TableRow>
                  <TableCell className={classes.tableHeadCell}>Level</TableCell>
                  <TableCell className={classes.tableHeadCell}>Referee Address</TableCell>
                  <TableCell className={classes.tableHeadCell}>Investment</TableCell>
                  <TableCell className={classes.tableHeadCell}>Reward</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referrals.map((referral, index) => {
                  // Calculate reward based on level and investment
                  let rewardRate;
                  let levelClass;
                  
                  if (referral.level === 1) {
                    rewardRate = 0.1; // 10%
                    levelClass = classes.level1Badge;
                  } else if (referral.level === 2) {
                    rewardRate = 0.03; // 3%
                    levelClass = classes.level2Badge;
                  } else {
                    rewardRate = 0.02; // 2%
                    levelClass = classes.level3Badge;
                  }
                  
                  const reward = parseFloat(referral.investment) * rewardRate;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <span className={`${classes.levelBadge} ${levelClass}`}>
                          L{referral.level}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatAddress(referral.address)}
                        {referral.level > 1 && (
                          <Typography variant="caption" display="block">
                            via {formatAddress(referral.via)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>${formatCurrency(referral.investment)}</TableCell>
                      <TableCell>${formatCurrency(reward)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <div className={classes.noReferrals}>
            <Typography variant="body1">
              You don't have any referrals yet. Share your referral link to start earning rewards!
            </Typography>
          </div>
        )}
        
        {error && (
          <Typography variant="body2" className={classes.error}>
            {error}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default Referral;

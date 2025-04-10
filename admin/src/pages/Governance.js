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
  Chip
} from '@material-ui/core';
import { ethers } from 'ethers';
import { 
  formatAddress, 
  getMultiSigTransactionCount, 
  getMultiSigTransaction, 
  confirmMultiSigTransaction,
  revokeMultiSigConfirmation,
  executeMultiSigTransaction,
  isMultiSigOwner
} from '../utils/wallet';
import { MULTISIG_ADDRESS, MULTISIG_ABI } from '../utils/constants';

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
  confirmButton: {
    backgroundColor: '#4caf50',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#388e3c',
    },
    marginRight: theme.spacing(1),
  },
  revokeButton: {
    backgroundColor: '#ff9800',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#f57c00',
    },
    marginRight: theme.spacing(1),
  },
  executeButton: {
    backgroundColor: '#ffd700',
    color: '#000000',
    '&:hover': {
      backgroundColor: '#e6c200',
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
  chipPending: {
    backgroundColor: '#ff9800',
    color: '#000000',
  },
  chipExecuted: {
    backgroundColor: '#4caf50',
    color: '#ffffff',
  },
  chipConfirmed: {
    backgroundColor: '#2196f3',
    color: '#ffffff',
  },
  chipNotConfirmed: {
    backgroundColor: '#f44336',
    color: '#ffffff',
  },
  actionButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  }
}));

const Governance = ({ account, contract, refreshPlatformData }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [owners, setOwners] = useState([]);
  const [requiredConfirmations, setRequiredConfirmations] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  
  // Load multi-sig wallet data
  useEffect(() => {
    const loadMultiSigData = async () => {
      if (account) {
        try {
          setLoading(true);
          
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          
          // Get MultiSig contract
          const multiSigContract = new ethers.Contract(
            MULTISIG_ADDRESS,
            MULTISIG_ABI,
            signer
          );
          
          // Check if current account is an owner
          const ownerStatus = await isMultiSigOwner(multiSigContract, account);
          setIsOwner(ownerStatus);
          
          // Get required confirmations
          const required = await multiSigContract.required();
          setRequiredConfirmations(Number(required));
          
          // Get owners
          const ownersList = await multiSigContract.getOwners();
          setOwners(ownersList);
          
          // Get transaction count
          const count = await getMultiSigTransactionCount(multiSigContract);
          
          // Get transactions
          const txs = [];
          for (let i = 0; i < count; i++) {
            const tx = await getMultiSigTransaction(multiSigContract, i);
            const confirmationCount = await multiSigContract.getConfirmationCount(i);
            const isConfirmedByCurrentUser = await multiSigContract.confirmations(i, account);
            
            // Decode function data if possible
            let functionName = "Unknown Function";
            try {
              // This is a simplified approach - in a real app, you'd use the contract ABI to decode
              const functionSignature = tx.data.slice(0, 10);
              
              // Map common function signatures to names
              const functionMap = {
                "0x4bb278f3": "setWithdrawalCap",
                "0x6a1db1bf": "updateProfitRate",
                "0x8456cb59": "pause",
                "0x3f4ba83a": "unpause",
                "0x47e7ef24": "addLiquidity",
                "0x5c975abb": "paused",
                "0x8456cb59": "pause",
              };
              
              functionName = functionMap[functionSignature] || "Unknown Function";
            } catch (error) {
              console.error("Error decoding function:", error);
            }
            
            txs.push({
              id: i,
              destination: tx.destination,
              value: ethers.formatEther(tx.value),
              data: tx.data,
              executed: tx.executed,
              confirmations: Number(confirmationCount),
              isConfirmedByCurrentUser,
              functionName
            });
          }
          
          setTransactions(txs.reverse()); // Show newest first
          setLoading(false);
        } catch (error) {
          console.error('Error loading multi-sig data:', error);
          setError('Failed to load multi-sig wallet data');
          setLoading(false);
        }
      }
    };
    
    loadMultiSigData();
  }, [account]);
  
  // Handle confirm transaction
  const handleConfirmTransaction = async (txId) => {
    if (!account) {
      setError('Please connect your wallet first');
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
      
      // Confirm transaction
      const tx = await confirmMultiSigTransaction(multiSigContract, txId);
      
      await tx.wait();
      
      setSuccess(`Transaction ${txId} confirmed successfully`);
      
      // Refresh transactions
      const updatedTransactions = [...transactions];
      const index = updatedTransactions.findIndex(tx => tx.id === txId);
      if (index !== -1) {
        updatedTransactions[index].confirmations++;
        updatedTransactions[index].isConfirmedByCurrentUser = true;
        setTransactions(updatedTransactions);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Confirmation error:', error);
      setError('Failed to confirm transaction');
      setLoading(false);
    }
  };
  
  // Handle revoke confirmation
  const handleRevokeConfirmation = async (txId) => {
    if (!account) {
      setError('Please connect your wallet first');
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
      
      // Revoke confirmation
      const tx = await revokeMultiSigConfirmation(multiSigContract, txId);
      
      await tx.wait();
      
      setSuccess(`Confirmation for transaction ${txId} revoked successfully`);
      
      // Refresh transactions
      const updatedTransactions = [...transactions];
      const index = updatedTransactions.findIndex(tx => tx.id === txId);
      if (index !== -1) {
        updatedTransactions[index].confirmations--;
        updatedTransactions[index].isConfirmedByCurrentUser = false;
        setTransactions(updatedTransactions);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Revocation error:', error);
      setError('Failed to revoke confirmation');
      setLoading(false);
    }
  };
  
  // Handle execute transaction
  const handleExecuteTransaction = async (txId) => {
    if (!account) {
      setError('Please connect your wallet first');
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
      
      // Execute transaction
      const tx = await executeMultiSigTransaction(multiSigContract, txId);
      
      await tx.wait();
      
      setSuccess(`Transaction ${txId} executed successfully`);
      
      // Refresh transactions
      const updatedTransactions = [...transactions];
      const index = updatedTransactions.findIndex(tx => tx.id === txId);
      if (index !== -1) {
        updatedTransactions[index].executed = true;
        setTransactions(updatedTransactions);
      }
      
      // Refresh platform data
      refreshPlatformData();
      
      setLoading(false);
    } catch (error) {
      console.error('Execution error:', error);
      setError('Failed to execute transaction');
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
              Connect your wallet to access governance features
            </Typography>
            <Typography variant="body1" gutterBottom>
              You need to connect with a wallet that has admin privileges
            </Typography>
          </div>
        </Paper>
      </Container>
    );
  }
  
  // If loading
  if (loading && transactions.length === 0) {
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
          Governance & Security
        </Typography>
        
        {/* Multi-Sig Wallet Info */}
        <Card className={classes.card}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Multi-Signature Wallet
            </Typography>
            
            <Typography variant="body1" paragraph>
              <strong>Address:</strong> {formatAddress(MULTISIG_ADDRESS)}
            </Typography>
            
            <Typography variant="body1" paragraph>
              <strong>Required Confirmations:</strong> {requiredConfirmations} of {owners.length}
            </Typography>
            
            <Typography variant="body1" paragraph>
              <strong>Your Status:</strong> {isOwner ? 'Owner (can confirm/execute transactions)' : 'Not an owner'}
            </Typography>
            
            <Typography variant="h6" style={{ marginTop: '16px' }}>
              Owners:
            </Typography>
            
            <Grid container spacing={2} style={{ marginTop: '8px' }}>
              {owners.map((owner, index) => (
                <Grid item key={index}>
                  <Chip 
                    label={formatAddress(owner)} 
                    className={owner === account ? classes.chipConfirmed : ''}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
        
        <Divider className={classes.divider} />
        
        {/* Transactions */}
        <Typography variant="h5" gutterBottom>
          Pending Transactions
        </Typography>
        
        {transactions.filter(tx => !tx.executed).length === 0 ? (
          <Typography variant="body1" style={{ marginBottom: '20px' }}>
            No pending transactions
          </Typography>
        ) : (
          <TableContainer style={{ marginBottom: '20px' }}>
            <Table className={classes.table}>
              <TableHead className={classes.tableHead}>
                <TableRow>
                  <TableCell className={classes.tableHeadCell}>ID</TableCell>
                  <TableCell className={classes.tableHeadCell}>Function</TableCell>
                  <TableCell className={classes.tableHeadCell}>Confirmations</TableCell>
                  <TableCell className={classes.tableHeadCell}>Status</TableCell>
                  <TableCell className={classes.tableHeadCell}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.filter(tx => !tx.executed).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.id}</TableCell>
                    <TableCell>{tx.functionName}</TableCell>
                    <TableCell>{tx.confirmations} of {requiredConfirmations}</TableCell>
                    <TableCell>
                      <Chip 
                        label="Pending" 
                        className={classes.chipPending}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <div className={classes.actionButtons}>
                        {isOwner && !tx.isConfirmedByCurrentUser && (
                          <Button 
                            size="small" 
                            variant="contained" 
                            className={classes.confirmButton}
                            onClick={() => handleConfirmTransaction(tx.id)}
                            disabled={loading}
                          >
                            Confirm
                          </Button>
                        )}
                        
                        {isOwner && tx.isConfirmedByCurrentUser && (
                          <Button 
                            size="small" 
                            variant="contained" 
                            className={classes.revokeButton}
                            onClick={() => handleRevokeConfirmation(tx.id)}
                            disabled={loading}
                          >
                            Revoke
                          </Button>
                        )}
                        
                        {isOwner && tx.confirmations >= requiredConfirmations && (
                          <Button 
                            size="small" 
                            variant="contained" 
                            className={classes.executeButton}
                            onClick={() => handleExecuteTransaction(tx.id)}
                            disabled={loading}
                          >
                            Execute
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <Typography variant="h5" gutterBottom>
          Executed Transactions
        </Typography>
        
        {transactions.filter(tx => tx.executed).length === 0 ? (
          <Typography variant="body1">
            No executed transactions
          </Typography>
        ) : (
          <TableContainer>
            <Table className={classes.table}>
              <TableHead className={classes.tableHead}>
                <TableRow>
                  <TableCell className={classes.tableHeadCell}>ID</TableCell>
                  <TableCell className={classes.tableHeadCell}>Function</TableCell>
                  <TableCell className={classes.tableHeadCell}>Confirmations</TableCell>
                  <TableCell className={classes.tableHeadCell}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.filter(tx => tx.executed).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.id}</TableCell>
                    <TableCell>{tx.functionName}</TableCell>
                    <TableCell>{tx.confirmations} of {requiredConfirmations}</TableCell>
                    <TableCell>
                      <Chip 
                        label="Executed" 
                        className={classes.chipExecuted}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
        
        <Divider className={classes.divider} />
        
        <Typography variant="h6" gutterBottom>
          Multi-Signature Security
        </Typography>
        
        <Typography variant="body2" paragraph>
          • All critical contract operations require multi-signature approval
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Transactions must be confirmed by {requiredConfirmations} out of {owners.length} owners
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Owners can revoke their confirmations before a transaction is executed
        </Typography>
        
        <Typography variant="body2">
          • Once the required number of confirmations is reached, any owner can execute the transaction
        </Typography>
      </Paper>
    </Container>
  );
};

export default Governance;

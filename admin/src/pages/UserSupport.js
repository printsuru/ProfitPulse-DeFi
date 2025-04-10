import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@material-ui/core';
import { ethers } from 'ethers';
import { formatAddress, formatCurrency } from '../utils/wallet';

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
  resolveButton: {
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
  formControl: {
    marginBottom: theme.spacing(3),
    minWidth: 200,
  },
  chipOpen: {
    backgroundColor: '#ff9800',
    color: '#000000',
  },
  chipResolved: {
    backgroundColor: '#4caf50',
    color: '#ffffff',
  },
  messageField: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  userMessage: {
    backgroundColor: '#1e1e1e',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
  },
  adminMessage: {
    backgroundColor: '#2196f3',
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    color: '#ffffff',
  }
}));

const UserSupport = ({ account, contract }) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Mock data for support tickets
  useEffect(() => {
    if (account) {
      // In a real implementation, this would be fetched from a backend API
      const mockTickets = [
        {
          id: 1,
          user: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          subject: 'Withdrawal Issue',
          status: 'open',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          messages: [
            {
              sender: 'user',
              message: 'I tried to withdraw my profits but the transaction failed. Can you help?',
              timestamp: new Date(Date.now() - 86400000)
            }
          ]
        },
        {
          id: 2,
          user: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
          subject: 'Referral Not Working',
          status: 'open',
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          messages: [
            {
              sender: 'user',
              message: 'My referral link doesn\'t seem to be working. When my friend uses it, I don\'t get any rewards.',
              timestamp: new Date(Date.now() - 172800000)
            }
          ]
        },
        {
          id: 3,
          user: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
          subject: 'Investment Tier Question',
          status: 'resolved',
          createdAt: new Date(Date.now() - 259200000), // 3 days ago
          messages: [
            {
              sender: 'user',
              message: 'How do I upgrade my investment tier to get higher profits?',
              timestamp: new Date(Date.now() - 259200000)
            },
            {
              sender: 'admin',
              message: 'To upgrade your tier, simply deposit more BUSD to reach the next tier threshold. Tier 2 starts at $500, Tier 3 at $1000, and Tier 4 at $2000.',
              timestamp: new Date(Date.now() - 250200000)
            },
            {
              sender: 'user',
              message: 'Thank you! I\'ll deposit more to reach Tier 3.',
              timestamp: new Date(Date.now() - 240200000)
            }
          ]
        }
      ];
      
      setTickets(mockTickets);
    }
  }, [account]);
  
  // Handle ticket selection
  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
  };
  
  // Handle reply message change
  const handleReplyMessageChange = (event) => {
    setReplyMessage(event.target.value);
  };
  
  // Handle send reply
  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) {
      return;
    }
    
    // Add reply to ticket messages
    const updatedTickets = [...tickets];
    const ticketIndex = updatedTickets.findIndex(t => t.id === selectedTicket.id);
    
    if (ticketIndex !== -1) {
      updatedTickets[ticketIndex].messages.push({
        sender: 'admin',
        message: replyMessage,
        timestamp: new Date()
      });
      
      setTickets(updatedTickets);
      setSelectedTicket(updatedTickets[ticketIndex]);
      setReplyMessage('');
      setSuccess('Reply sent successfully');
    }
  };
  
  // Handle resolve ticket
  const handleResolveTicket = () => {
    if (!selectedTicket) {
      return;
    }
    
    // Update ticket status
    const updatedTickets = [...tickets];
    const ticketIndex = updatedTickets.findIndex(t => t.id === selectedTicket.id);
    
    if (ticketIndex !== -1) {
      updatedTickets[ticketIndex].status = 'resolved';
      
      setTickets(updatedTickets);
      setSelectedTicket(updatedTickets[ticketIndex]);
      setSuccess('Ticket marked as resolved');
    }
  };
  
  // Handle user address change
  const handleUserAddressChange = (event) => {
    setUserAddress(event.target.value);
  };
  
  // Handle search user
  const handleSearchUser = async () => {
    if (!account || !contract) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!userAddress || !ethers.isAddress(userAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }
    
    try {
      setSearchLoading(true);
      setError('');
      
      // In a real implementation, this would search for tickets by user address
      // For now, we'll just filter the mock data
      const userTickets = tickets.filter(ticket => 
        ticket.user.toLowerCase() === userAddress.toLowerCase()
      );
      
      if (userTickets.length > 0) {
        setSelectedTicket(userTickets[0]);
      } else {
        setError('No tickets found for this user');
      }
      
      setSearchLoading(false);
    } catch (error) {
      console.error('User search error:', error);
      setError('Failed to search for user tickets');
      setSearchLoading(false);
    }
  };
  
  // If no wallet is connected
  if (!account) {
    return (
      <Container className={classes.container}>
        <Paper className={classes.paper}>
          <div className={classes.noWallet}>
            <Typography variant="h5" gutterBottom>
              Connect your wallet to access user support
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
          User Support
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            {/* Ticket List */}
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Support Tickets
                </Typography>
                
                <FormControl variant="outlined" className={classes.formControl}>
                  <InputLabel id="status-filter-label">Filter by Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    label="Filter by Status"
                    defaultValue="all"
                  >
                    <MenuItem value="all">All Tickets</MenuItem>
                    <MenuItem value="open">Open Tickets</MenuItem>
                    <MenuItem value="resolved">Resolved Tickets</MenuItem>
                  </Select>
                </FormControl>
                
                <Divider className={classes.divider} />
                
                {/* User Search */}
                <Typography variant="subtitle1" gutterBottom>
                  Search by User Address
                </Typography>
                
                <TextField
                  label="User Address"
                  variant="outlined"
                  fullWidth
                  value={userAddress}
                  onChange={handleUserAddressChange}
                  placeholder="0x..."
                  size="small"
                />
                
                <Button
                  variant="contained"
                  className={classes.button}
                  onClick={handleSearchUser}
                  disabled={searchLoading || !userAddress || !ethers.isAddress(userAddress)}
                  size="small"
                >
                  {searchLoading ? <CircularProgress size={20} /> : 'Search'}
                </Button>
                
                <Divider className={classes.divider} />
                
                {/* Ticket List */}
                {tickets.length === 0 ? (
                  <Typography variant="body1">
                    No tickets found
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table className={classes.table} size="small">
                      <TableHead className={classes.tableHead}>
                        <TableRow>
                          <TableCell className={classes.tableHeadCell}>ID</TableCell>
                          <TableCell className={classes.tableHeadCell}>Subject</TableCell>
                          <TableCell className={classes.tableHeadCell}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tickets.map((ticket) => (
                          <TableRow 
                            key={ticket.id}
                            onClick={() => handleSelectTicket(ticket)}
                            style={{ 
                              cursor: 'pointer',
                              backgroundColor: selectedTicket && selectedTicket.id === ticket.id ? '#3d3d3d' : 'inherit'
                            }}
                          >
                            <TableCell>{ticket.id}</TableCell>
                            <TableCell>{ticket.subject}</TableCell>
                            <TableCell>
                              <Chip 
                                label={ticket.status === 'open' ? 'Open' : 'Resolved'} 
                                className={ticket.status === 'open' ? classes.chipOpen : classes.chipResolved}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            {/* Ticket Details */}
            {selectedTicket ? (
              <Card className={classes.card}>
                <CardContent>
                  <Grid container justifyContent="space-between" alignItems="center">
                    <Grid item>
                      <Typography variant="h6" gutterBottom>
                        Ticket #{selectedTicket.id}: {selectedTicket.subject}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Chip 
                        label={selectedTicket.status === 'open' ? 'Open' : 'Resolved'} 
                        className={selectedTicket.status === 'open' ? classes.chipOpen : classes.chipResolved}
                      />
                    </Grid>
                  </Grid>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>User:</strong> {formatAddress(selectedTicket.user)}
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Created:</strong> {selectedTicket.createdAt.toLocaleString()}
                  </Typography>
                  
                  <Divider className={classes.divider} />
                  
                  {/* Messages */}
                  <Typography variant="subtitle1" gutterBottom>
                    Conversation
                  </Typography>
                  
                  {selectedTicket.messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={message.sender === 'user' ? classes.userMessage : classes.adminMessage}
                    >
                      <Typography variant="body2" gutterBottom>
                        <strong>{message.sender === 'user' ? 'User' : 'Admin'}</strong> - {message.timestamp.toLocaleString()}
                      </Typography>
                      <Typography variant="body1">
                        {message.message}
                      </Typography>
                    </div>
                  ))}
                  
                  {/* Reply Form */}
                  {selectedTicket.status === 'open' && (
                    <>
                      <TextField
                        label="Reply"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={4}
                        value={replyMessage}
                        onChange={handleReplyMessageChange}
                        className={classes.messageField}
                      />
                      
                      <Button
                        variant="contained"
                        className={classes.button}
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim()}
                      >
                        Send Reply
                      </Button>
                      
                      <Button
                        variant="contained"
                        className={classes.resolveButton}
                        onClick={handleResolveTicket}
                        style={{ marginLeft: '8px' }}
                      >
                        Mark as Resolved
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className={classes.card}>
                <CardContent>
                  <Typography variant="body1" align="center">
                    Select a ticket to view details
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
        
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
          User Support Guidelines
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Respond to all tickets within 24 hours
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Be professional and courteous in all communications
        </Typography>
        
        <Typography variant="body2" paragraph>
          • For technical issues, verify user details before providing assistance
        </Typography>
        
        <Typography variant="body2">
          • Mark tickets as resolved only when the issue is completely fixed
        </Typography>
      </Paper>
    </Container>
  );
};

export default UserSupport;

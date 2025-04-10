import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  makeStyles,
  Card,
  CardContent,
  Divider
} from '@material-ui/core';
import { Line } from 'react-chartjs-2';
import { formatCurrency, getTierName } from '../utils/wallet';

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
    marginBottom: theme.spacing(2),
  },
  cardTitle: {
    color: '#b3b3b3',
  },
  cardValue: {
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: '1.5rem',
  },
  profitValue: {
    color: '#4caf50',
    fontWeight: 'bold',
    fontSize: '1.5rem',
  },
  tierValue: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
  button: {
    marginTop: theme.spacing(2),
    backgroundColor: '#4caf50',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#388e3c',
    },
  },
  chartContainer: {
    marginTop: theme.spacing(4),
    height: 300,
  },
  divider: {
    margin: theme.spacing(3, 0),
    backgroundColor: '#444444',
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
}));

const Dashboard = ({ account, userDetails, loading, refreshUserData }) => {
  const classes = useStyles();
  const [profitHistory, setProfitHistory] = useState([]);
  
  // Generate mock profit history data for chart
  useEffect(() => {
    if (account && userDetails.investment > 0) {
      const mockData = [];
      const today = new Date();
      
      // Generate data for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Calculate daily profit based on investment and tier
        let dailyProfit;
        if (userDetails.tier === 1) {
          dailyProfit = userDetails.investment * 0.02;
        } else if (userDetails.tier === 2) {
          dailyProfit = userDetails.investment * 0.03;
        } else if (userDetails.tier === 3) {
          dailyProfit = userDetails.investment * 0.035;
        } else {
          dailyProfit = userDetails.investment * 0.04;
        }
        
        // Add some randomness to make it look realistic
        const randomFactor = 0.9 + Math.random() * 0.2; // Between 0.9 and 1.1
        
        mockData.push({
          date: date.toLocaleDateString(),
          profit: dailyProfit * randomFactor,
        });
      }
      
      setProfitHistory(mockData);
    }
  }, [account, userDetails]);
  
  // Chart data
  const chartData = {
    labels: profitHistory.map(item => item.date),
    datasets: [
      {
        label: 'Daily Profit (BUSD)',
        data: profitHistory.map(item => item.profit),
        fill: false,
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#b3b3b3',
        },
        grid: {
          color: '#444444',
        },
      },
      x: {
        ticks: {
          color: '#b3b3b3',
        },
        grid: {
          color: '#444444',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    refreshUserData();
  };
  
  // If no wallet is connected
  if (!account) {
    return (
      <Container className={classes.container}>
        <Paper className={classes.paper}>
          <div className={classes.noWallet}>
            <Typography variant="h5" gutterBottom>
              Connect your wallet to view your dashboard
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
          Your Investment Dashboard
        </Typography>
        
        <Grid container spacing={3}>
          {/* Investment Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Total Investment
                </Typography>
                <Typography variant="h5" className={classes.cardValue}>
                  ${formatCurrency(userDetails.investment)} BUSD
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Profits Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Available Profits
                </Typography>
                <Typography variant="h5" className={classes.profitValue}>
                  ${formatCurrency(userDetails.profits)} BUSD
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Tier Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Your Tier
                </Typography>
                <Typography variant="h5" className={classes.tierValue}>
                  {getTierName(userDetails.tier)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Referral Rewards Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Referral Rewards
                </Typography>
                <Typography variant="h5" className={classes.cardValue}>
                  ${formatCurrency(userDetails.referralRewards)} BUSD
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Button 
          variant="contained" 
          className={classes.button}
          onClick={handleRefresh}
        >
          Refresh Data
        </Button>
        
        <Divider className={classes.divider} />
        
        {/* Profit Chart */}
        {userDetails.investment > 0 && (
          <div>
            <Typography variant="h5" gutterBottom>
              Profit History (Last 7 Days)
            </Typography>
            <div className={classes.chartContainer}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}
        
        {/* No Investment Message */}
        {userDetails.investment <= 0 && (
          <div>
            <Typography variant="h6" align="center" gutterBottom>
              You don't have any active investments yet.
            </Typography>
            <Typography variant="body1" align="center">
              Make your first deposit to start earning daily profits!
            </Typography>
          </div>
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;

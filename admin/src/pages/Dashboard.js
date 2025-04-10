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
import { 
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon
} from '@material-ui/icons';
import { Line } from 'react-chartjs-2';
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
    marginBottom: theme.spacing(2),
    height: '100%',
  },
  cardTitle: {
    color: '#b3b3b3',
  },
  cardValue: {
    color: '#ffd700',
    fontWeight: 'bold',
    fontSize: '1.5rem',
  },
  cardIcon: {
    float: 'right',
    color: '#ffd700',
  },
  button: {
    marginTop: theme.spacing(2),
    backgroundColor: '#2196f3',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#1976d2',
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
  warningCard: {
    backgroundColor: '#ff9800',
    color: '#000000',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: theme.spacing(2),
  },
  liquidityRatio: {
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: props => props.ratio < 0.1 ? '#f44336' : props.ratio < 0.3 ? '#ff9800' : '#4caf50',
  }
}));

const Dashboard = ({ account, platformData, loading, refreshPlatformData }) => {
  const [activityData, setActivityData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  
  // Calculate liquidity ratio
  const liquidityRatio = platformData.totalDeposits > 0 
    ? platformData.contractBalance / platformData.totalDeposits 
    : 1;
  
  const classes = useStyles({ ratio: liquidityRatio });
  
  // Generate mock activity data for chart
  useEffect(() => {
    if (account) {
      const mockActivityData = [];
      const mockUserGrowthData = [];
      const today = new Date();
      
      // Generate data for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString();
        
        // Mock deposit/withdrawal data
        const deposits = Math.floor(Math.random() * 5000) + 1000;
        const withdrawals = Math.floor(Math.random() * 3000) + 500;
        
        mockActivityData.push({
          date: dateStr,
          deposits,
          withdrawals
        });
        
        // Mock user growth data
        const newUsers = Math.floor(Math.random() * 20) + 5;
        const totalUsers = platformData.userCount - (6 - i) * newUsers; // Approximate past user count
        
        mockUserGrowthData.push({
          date: dateStr,
          newUsers,
          totalUsers: totalUsers > 0 ? totalUsers : 10
        });
      }
      
      setActivityData(mockActivityData);
      setUserGrowthData(mockUserGrowthData);
    }
  }, [account, platformData.userCount]);
  
  // Activity chart data
  const activityChartData = {
    labels: activityData.map(item => item.date),
    datasets: [
      {
        label: 'Deposits (BUSD)',
        data: activityData.map(item => item.deposits),
        fill: false,
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
      },
      {
        label: 'Withdrawals (BUSD)',
        data: activityData.map(item => item.withdrawals),
        fill: false,
        backgroundColor: '#f44336',
        borderColor: '#f44336',
      }
    ],
  };
  
  // User growth chart data
  const userGrowthChartData = {
    labels: userGrowthData.map(item => item.date),
    datasets: [
      {
        label: 'Total Users',
        data: userGrowthData.map(item => item.totalUsers),
        fill: false,
        backgroundColor: '#2196f3',
        borderColor: '#2196f3',
      },
      {
        label: 'New Users',
        data: userGrowthData.map(item => item.newUsers),
        fill: false,
        backgroundColor: '#ffd700',
        borderColor: '#ffd700',
      }
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
    refreshPlatformData();
  };
  
  // If no wallet is connected
  if (!account) {
    return (
      <Container className={classes.container}>
        <Paper className={classes.paper}>
          <div className={classes.noWallet}>
            <Typography variant="h5" gutterBottom>
              Connect your wallet to access the admin dashboard
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
          Admin Dashboard
        </Typography>
        
        {/* Liquidity Warning */}
        {liquidityRatio < 0.1 && (
          <div className={classes.warningCard}>
            <WarningIcon className={classes.warningIcon} />
            <Typography variant="body1">
              <strong>Low Liquidity Warning:</strong> Contract balance is below 10% of total deposits. Consider adding liquidity.
            </Typography>
          </div>
        )}
        
        <Grid container spacing={3}>
          {/* TVL Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.card}>
              <CardContent>
                <TrendingUpIcon className={classes.cardIcon} />
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Total Value Locked
                </Typography>
                <Typography variant="h5" className={classes.cardValue}>
                  ${formatCurrency(platformData.totalDeposits)} BUSD
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Users Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.card}>
              <CardContent>
                <PeopleIcon className={classes.cardIcon} />
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Total Users
                </Typography>
                <Typography variant="h5" className={classes.cardValue}>
                  {platformData.userCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Contract Balance Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.card}>
              <CardContent>
                <AccountBalanceIcon className={classes.cardIcon} />
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Contract Balance
                </Typography>
                <Typography variant="h5" className={classes.cardValue}>
                  ${formatCurrency(platformData.contractBalance)} BUSD
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Liquidity Ratio Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Liquidity Ratio
                </Typography>
                <Typography variant="h5" className={classes.liquidityRatio}>
                  {(liquidityRatio * 100).toFixed(2)}%
                </Typography>
                <Typography variant="caption">
                  {liquidityRatio < 0.1 ? 'Critical' : liquidityRatio < 0.3 ? 'Warning' : 'Healthy'}
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
        
        {/* Activity Chart */}
        <Typography variant="h5" gutterBottom>
          Daily Activity (Last 7 Days)
        </Typography>
        <div className={classes.chartContainer}>
          <Line data={activityChartData} options={chartOptions} />
        </div>
        
        <Divider className={classes.divider} />
        
        {/* User Growth Chart */}
        <Typography variant="h5" gutterBottom>
          User Growth (Last 7 Days)
        </Typography>
        <div className={classes.chartContainer}>
          <Line data={userGrowthChartData} options={chartOptions} />
        </div>
        
        <Divider className={classes.divider} />
        
        {/* Platform Status */}
        <Typography variant="h5" gutterBottom>
          Platform Status
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Contract Status
                </Typography>
                <Typography variant="h6" style={{ color: platformData.paused ? '#f44336' : '#4caf50' }}>
                  {platformData.paused ? 'PAUSED' : 'ACTIVE'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="subtitle1" className={classes.cardTitle}>
                  Withdrawal Cap
                </Typography>
                <Typography variant="h6" style={{ color: '#ffd700' }}>
                  {platformData.withdrawalCap > 0 
                    ? `$${formatCurrency(platformData.withdrawalCap)} BUSD` 
                    : 'No Cap'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard;

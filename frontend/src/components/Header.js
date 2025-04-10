import React from 'react';
import { AppBar, Toolbar, Typography, Button, makeStyles } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { formatAddress } from '../utils/wallet';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  appBar: {
    backgroundColor: '#1e1e1e',
  },
  title: {
    flexGrow: 1,
    color: '#ffd700',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  navLink: {
    margin: theme.spacing(0, 1),
    color: '#ffffff',
    textDecoration: 'none',
  },
  connectButton: {
    backgroundColor: '#4caf50',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#388e3c',
    },
  },
  accountInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  address: {
    marginRight: theme.spacing(2),
  },
  balance: {
    color: '#ffd700',
  },
}));

const Header = ({ account, balance, onConnectWallet }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" className={classes.title} component={Link} to="/">
            ProfitPulse DeFi
          </Typography>
          
          {account ? (
            <>
              <Button color="inherit" component={Link} to="/" className={classes.navLink}>
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/deposit" className={classes.navLink}>
                Deposit
              </Button>
              <Button color="inherit" component={Link} to="/withdraw" className={classes.navLink}>
                Withdraw
              </Button>
              <Button color="inherit" component={Link} to="/referral" className={classes.navLink}>
                Referral
              </Button>
              
              <div className={classes.accountInfo}>
                <Typography variant="body2" className={classes.address}>
                  {formatAddress(account)}
                </Typography>
                <Typography variant="body2" className={classes.balance}>
                  Balance: {parseFloat(balance).toFixed(2)} BUSD
                </Typography>
              </div>
            </>
          ) : (
            <Button 
              variant="contained" 
              className={classes.connectButton}
              onClick={onConnectWallet}
            >
              Connect Wallet
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Header;

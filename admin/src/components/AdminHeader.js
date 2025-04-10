import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, makeStyles } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { formatAddress } from '../utils/wallet';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  appBar: {
    backgroundColor: '#1e1e1e',
    zIndex: theme.zIndex.drawer + 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
    color: '#ffd700',
    fontWeight: 'bold',
  },
  connectButton: {
    backgroundColor: '#2196f3',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#1976d2',
    },
  },
  accountInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  address: {
    marginRight: theme.spacing(2),
  },
}));

const AdminHeader = ({ account, onConnectWallet, onToggleSidebar }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.appBar}>
        <Toolbar>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
            onClick={onToggleSidebar}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            ProfitPulse DeFi Admin
          </Typography>
          
          {account ? (
            <div className={classes.accountInfo}>
              <Typography variant="body2" className={classes.address}>
                {formatAddress(account)}
              </Typography>
            </div>
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

export default AdminHeader;

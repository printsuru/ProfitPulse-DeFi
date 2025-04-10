import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  makeStyles 
} from '@material-ui/core';
import { 
  Dashboard as DashboardIcon,
  AccountBalance as LiquidityIcon,
  Settings as ControlIcon,
  MonetizationOn as EarningsIcon,
  Security as GovernanceIcon,
  People as SupportIcon
} from '@material-ui/icons';
import { Link } from 'react-router-dom';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: '#1e1e1e',
  },
  toolbar: theme.mixins.toolbar,
  listItem: {
    '&.active': {
      backgroundColor: '#2d2d2d',
    },
  },
  listItemIcon: {
    color: '#ffd700',
  },
  divider: {
    backgroundColor: '#444444',
  }
}));

const AdminSidebar = ({ open, onClose }) => {
  const classes = useStyles();
  const currentPath = window.location.pathname;

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Liquidity Management', icon: <LiquidityIcon />, path: '/liquidity' },
    { text: 'Contract Control', icon: <ControlIcon />, path: '/contract-control' },
    { text: 'Earnings Distribution', icon: <EarningsIcon />, path: '/earnings' },
    { text: 'Governance & Security', icon: <GovernanceIcon />, path: '/governance' },
    { text: 'User Support', icon: <SupportIcon />, path: '/user-support' },
  ];

  return (
    <Drawer
      className={classes.drawer}
      variant="persistent"
      anchor="left"
      open={open}
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <div className={classes.toolbar} />
      <Divider className={classes.divider} />
      <List>
        {menuItems.map((item, index) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            className={`${classes.listItem} ${currentPath === item.path ? 'active' : ''}`}
          >
            <ListItemIcon className={classes.listItemIcon}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default AdminSidebar;

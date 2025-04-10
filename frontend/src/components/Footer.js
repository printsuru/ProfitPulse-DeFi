import React from 'react';
import { Typography, Link, makeStyles, Container } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  footer: {
    backgroundColor: '#1e1e1e',
    padding: theme.spacing(3, 0),
    marginTop: 'auto',
    width: '100%',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  contractInfo: {
    marginBottom: theme.spacing(1),
  },
  link: {
    color: '#ffd700',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  copyright: {
    marginTop: theme.spacing(1),
  },
}));

const Footer = () => {
  const classes = useStyles();
  const contractAddress = "0x0000000000000000000000000000000000000000"; // Replace with actual contract address after deployment

  return (
    <footer className={classes.footer}>
      <Container className={classes.container}>
        <Typography variant="body2" className={classes.contractInfo}>
          Contract: <Link 
            href={`https://bscscan.com/address/${contractAddress}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className={classes.link}
          >
            {contractAddress.substring(0, 6)}...{contractAddress.substring(contractAddress.length - 4)}
          </Link> (View on BscScan)
        </Typography>
        <Typography variant="body2">
          <Link href="/terms" className={classes.link}>Terms of Service</Link> | 
          <Link href="/faq" className={classes.link}> FAQ</Link>
        </Typography>
        <Typography variant="body2" className={classes.copyright}>
          &copy; {new Date().getFullYear()} ProfitPulse DeFi. All rights reserved.
        </Typography>
      </Container>
    </footer>
  );
};

export default Footer;

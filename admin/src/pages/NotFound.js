import React from 'react';
import { Typography, Container, Paper, makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
  },
  title: {
    marginBottom: theme.spacing(3),
    color: '#f44336',
  },
  message: {
    textAlign: 'center',
  }
}));

const NotFound = () => {
  const classes = useStyles();

  return (
    <Container className={classes.container}>
      <Paper className={classes.paper}>
        <Typography variant="h4" className={classes.title}>
          404 - Page Not Found
        </Typography>
        <Typography variant="body1" className={classes.message}>
          The page you are looking for does not exist.
        </Typography>
        <Typography variant="body1" className={classes.message}>
          Please check the URL or navigate back to the dashboard.
        </Typography>
      </Paper>
    </Container>
  );
};

export default NotFound;

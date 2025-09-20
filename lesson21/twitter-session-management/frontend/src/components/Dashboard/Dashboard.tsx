import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  AppBar,
  Toolbar,
  Chip
} from '@mui/material';
import { useAuth } from '../Auth/AuthProvider';

const Dashboard: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Twitter Session Demo
          </Typography>
          <Chip
            label={`Region: ${user?.region}`}
            color="secondary"
            sx={{ mr: 2 }}
          />
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.email}!
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Global Session Management Features:
          </Typography>
          <ul>
            <li>✅ Distributed Redis session storage</li>
            <li>✅ JWT-based authentication with refresh tokens</li>
            <li>✅ Cross-region session replication</li>
            <li>✅ Session affinity and failover</li>
            <li>✅ Real-time session monitoring</li>
          </ul>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            href="/sessions"
            sx={{ mr: 2 }}
          >
            View Session Dashboard
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default Dashboard;

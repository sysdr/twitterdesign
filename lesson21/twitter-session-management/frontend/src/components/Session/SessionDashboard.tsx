import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Box
} from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../Auth/AuthProvider';
import { sessionService } from '../../services/sessionService';

const SessionDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      const [info, stats] = await Promise.all([
        sessionService.getSessionInfo(),
        sessionService.getSessionStats()
      ]);
      setSessionInfo(info);
      setSessionStats(stats);
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
  };

  const handleRevokeSession = async () => {
    try {
      await sessionService.revokeSession();
      await logout();
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const regionData = sessionStats ? Object.entries(sessionStats.regions).map(([region, count]) => ({
    region,
    count
  })) : [];

  const activityData = sessionStats ? [
    { activity: 'Logins', count: sessionStats.lastHour.logins },
    { activity: 'Logouts', count: sessionStats.lastHour.logouts },
    { activity: 'Refreshes', count: sessionStats.lastHour.refreshes }
  ] : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Session Management Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Session Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Session
              </Typography>
              {sessionInfo && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    User ID: {sessionInfo.userId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {sessionInfo.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Region: <Chip label={sessionInfo.region} size="small" color="primary" />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(sessionInfo.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Last Activity: {new Date(sessionInfo.lastActivity).toLocaleString()}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleRevokeSession}
                    size="small"
                  >
                    Revoke Session
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Global Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Global Session Stats
              </Typography>
              {sessionStats && (
                <Box>
                  <Typography variant="h3" color="primary">
                    {sessionStats.activeSessions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Active Sessions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Hour Activity:
                  </Typography>
                  <Typography variant="body2">
                    {sessionStats.lastHour.logins} logins, {sessionStats.lastHour.logouts} logouts
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Regional Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sessions by Region
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ region, count }) => `${region}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Last Hour Activity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="activity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SessionDashboard;

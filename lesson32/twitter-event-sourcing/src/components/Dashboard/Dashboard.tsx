import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import io from 'socket.io-client';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tweets, setTweets] = useState<any[]>([]);
  const [eventStats, setEventStats] = useState<any[]>([]);
  
  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tweetContent, setTweetContent] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    const socket = io('http://localhost:3001');
    
    socket.on('userCreated', (data) => {
      fetchUsers();
      fetchEvents();
    });
    
    socket.on('tweetCreated', (data) => {
      fetchTweets();
      fetchEvents();
    });

    fetchEvents();
    fetchUsers();
    fetchTweets();
    
    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/events?limit=100');
      setEvents(response.data);
      
      // Process event stats
      const stats = response.data.reduce((acc: any, event: any) => {
        const date = new Date(event.createdAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      
      setEventStats(Object.entries(stats).map(([date, count]) => ({ date, count })));
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchTweets = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/tweets');
      setTweets(response.data);
    } catch (error) {
      console.error('Failed to fetch tweets:', error);
    }
  };

  const createUser = async () => {
    try {
      const userId = `user_${Date.now()}`;
      await axios.post('http://localhost:3001/api/commands/users', {
        userId,
        username,
        email,
        displayName
      });
      
      setUsername('');
      setEmail('');
      setDisplayName('');
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const createTweet = async () => {
    try {
      await axios.post('http://localhost:3001/api/commands/tweets', {
        userId: selectedUserId,
        content: tweetContent
      });
      
      setTweetContent('');
    } catch (error) {
      console.error('Failed to create tweet:', error);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          🎯 Twitter Event Sourcing Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Real-time Event Store with CQRS Architecture
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="📊 Analytics" />
          <Tab label="⚡ Commands" />
          <Tab label="📝 Events" />
          <Tab label="👥 Read Models" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Event Activity Over Time</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={eventStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h4">{events.length}</Typography>
                    <Typography color="text.secondary">Total Events</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h4">{users.length}</Typography>
                    <Typography color="text.secondary">Users Created</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h4">{tweets.length}</Typography>
                    <Typography color="text.secondary">Tweets Posted</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Create User Command</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  fullWidth
                />
                <Button 
                  variant="contained" 
                  onClick={createUser}
                  disabled={!username || !email}
                >
                  Create User
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Create Tweet Command</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Select User"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  SelectProps={{ native: true }}
                  fullWidth
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.username} ({user.display_name})
                    </option>
                  ))}
                </TextField>
                <TextField
                  label="Tweet Content"
                  multiline
                  rows={4}
                  value={tweetContent}
                  onChange={(e) => setTweetContent(e.target.value)}
                  fullWidth
                  inputProps={{ maxLength: 280 }}
                  helperText={`${tweetContent.length}/280 characters`}
                />
                <Button 
                  variant="contained" 
                  onClick={createTweet}
                  disabled={!selectedUserId || !tweetContent}
                >
                  Post Tweet
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Event Stream</Typography>
          <List>
            {events.slice(0, 20).map((event) => (
              <ListItem key={event.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={event.event_type} size="small" color="primary" />
                      <Typography variant="body2">
                        {new Date(event.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        Stream: {event.stream_id} | Version: {event.version}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                        {JSON.stringify(event.event_data, null, 2)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>User Profiles (Read Model)</Typography>
              <List>
                {users.map((user) => (
                  <ListItem key={user.user_id} divider>
                    <ListItemText
                      primary={user.display_name || user.username}
                      secondary={
                        <>
                          <Typography variant="body2">@{user.username}</Typography>
                          <Typography variant="body2">
                            Followers: {user.followers_count} | Following: {user.following_count}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Tweets (Read Model)</Typography>
              <List>
                {tweets.map((tweet) => (
                  <ListItem key={tweet.tweet_id} divider>
                    <ListItemText
                      primary={tweet.content}
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          By: {tweet.user_id} | {new Date(tweet.created_at).toLocaleString()}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  TextField,
  Button,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';

const EventStore: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [streamId, setStreamId] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const eventsPerPage = 10;

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, streamId, eventTypeFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/events?limit=1000');
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreamEvents = async () => {
    if (!streamId) {
      fetchEvents();
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/events/${streamId}`);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch stream events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];
    
    if (eventTypeFilter) {
      filtered = filtered.filter(event => event.eventType === eventTypeFilter);
    }
    
    setFilteredEvents(filtered);
    setPage(1);
  };

  const getEventTypes = () => {
    const types = new Set(events.map(e => e.eventType));
    return Array.from(types).sort();
  };

  const paginatedEvents = filteredEvents.slice(
    (page - 1) * eventsPerPage,
    page * eventsPerPage
  );

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          📚 Event Store Browser
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Complete audit trail of all domain events
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Stream ID"
            value={streamId}
            onChange={(e) => setStreamId(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <Button
            variant="contained"
            onClick={fetchStreamEvents}
            disabled={loading}
          >
            Load Stream
          </Button>
          <Button
            variant="outlined"
            onClick={fetchEvents}
            disabled={loading}
          >
            Load All Events
          </Button>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={eventTypeFilter}
              label="Event Type"
              onChange={(e) => setEventTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {getEventTypes().map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Total Events: {events.length} | Filtered: {filteredEvents.length}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event Stream
        </Typography>
        
        {loading ? (
          <Typography>Loading events...</Typography>
        ) : paginatedEvents.length === 0 ? (
          <Typography color="text.secondary">No events found</Typography>
        ) : (
          <>
            <List>
              {paginatedEvents.map((event) => (
                <ListItem key={event.id} divider sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={event.eventType} size="small" color="primary" />
                    <Chip label={`v${event.version}`} size="small" variant="outlined" />
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(event.createdAt), 'PPpp')}
                    </Typography>
                  </Box>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        Stream: {event.streamId} | Type: {event.streamType}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {JSON.stringify(event.eventData, null, 2)}
                        </Typography>
                        {event.correlationId && (
                          <Typography variant="caption" color="text.secondary">
                            Correlation: {event.correlationId}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default EventStore;

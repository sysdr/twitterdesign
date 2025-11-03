import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Pool } from 'pg';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { EventStore } from './services/EventStore';
import { UserCommandHandler, TweetCommandHandler } from './handlers/CommandHandlers';
import { UserProjection } from './projections/UserProjection';
import { TweetProjection } from './projections/TweetProjection';
import { ProjectionRunner } from './services/ProjectionRunner';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Database connection
const db = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://twitter_user:twitter_pass@localhost:5433/twitter_events'
});

// Services
const eventStore = new EventStore(db);
const userCommandHandler = new UserCommandHandler(eventStore);
const tweetCommandHandler = new TweetCommandHandler(eventStore);
const userProjection = new UserProjection(db);
const tweetProjection = new TweetProjection(db);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.post('/api/commands/users', async (req, res) => {
    try {
        const command = {
            id: uuidv4(),
            type: 'CreateUser',
            data: req.body,
            metadata: {
                timestamp: new Date(),
                userId: req.body.userId,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        };
        
        await userCommandHandler.handleCreateUser(command);
        io.emit('userCreated', command.data);
        res.status(201).json({ success: true, commandId: command.id });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/commands/tweets', async (req, res) => {
    try {
        const command = {
            id: uuidv4(),
            type: 'CreateTweet',
            data: { ...req.body, tweetId: uuidv4() },
            metadata: {
                timestamp: new Date(),
                userId: req.body.userId,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        };
        
        await tweetCommandHandler.handleCreateTweet(command);
        io.emit('tweetCreated', command.data);
        res.status(201).json({ success: true, commandId: command.id, tweetId: command.data.tweetId });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/events/:streamId', async (req, res) => {
    try {
        const events = await eventStore.getEvents(req.params.streamId);
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/events', async (req, res) => {
    try {
        const fromPosition = parseInt(req.query.from as string) || 0;
        const limit = parseInt(req.query.limit as string) || 100;
        const events = await eventStore.getAllEvents(fromPosition, limit);
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM user_profiles ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tweets', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM tweets ORDER BY created_at DESC LIMIT 50');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start projection runner
const projectionRunner = new ProjectionRunner(eventStore, [userProjection, tweetProjection], db);
projectionRunner.start();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Event Sourcing API server running on port ${PORT}`);
});

export default app;

import express from 'express';
import cors from 'cors';
import searchRoutes from './routes/search.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Twitter Search API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      search: '/api/search',
      suggestions: '/api/search/suggestions',
      trending: '/api/trending'
    }
  });
});

app.use('/api', searchRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'twitter-search-api' });
});

app.listen(PORT, () => {
  console.log(`🚀 Search API server running on port ${PORT}`);
});

export default app;

import { Router } from 'express';
import { CacheManager } from '../cache/CacheManager';

const router = Router();
const cacheManager = CacheManager.getInstance();

// Get value from cache
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await cacheManager.get(key);
    
    if (value !== null) {
      res.json({ 
        success: true, 
        key, 
        value: JSON.parse(value),
        hit: true
      });
    } else {
      res.json({ 
        success: true, 
        key, 
        value: null,
        hit: false
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Set value in cache
router.post('/', async (req, res) => {
  try {
    const { key, value, ttl = 3600 } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Key and value are required' 
      });
    }

    await cacheManager.set(key, JSON.stringify(value), ttl);
    
    res.json({ 
      success: true, 
      message: `Key ${key} set successfully`,
      ttl 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Delete from cache
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await cacheManager.delete(key);
    
    res.json({ 
      success: true, 
      key,
      deleted: result > 0
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Multi-get from cache
router.post('/mget', async (req, res) => {
  try {
    const { keys } = req.body;
    
    if (!Array.isArray(keys)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Keys must be an array' 
      });
    }

    const values = await cacheManager.mget(keys);
    const results = keys.map((key, index) => ({
      key,
      value: values[index] ? JSON.parse(values[index]!) : null,
      hit: values[index] !== null
    }));
    
    res.json({ 
      success: true, 
      results,
      hitRate: results.filter(r => r.hit).length / results.length * 100
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Get cache statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = cacheManager.getStats();
    const health = await cacheManager.getHealthStatus();
    
    res.json({ 
      success: true,
      stats: Object.fromEntries(stats),
      health
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Flush all caches
router.delete('/flush/all', async (req, res) => {
  try {
    await cacheManager.flushAll();
    res.json({ 
      success: true, 
      message: 'All caches flushed successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

export default router;

import { Router } from 'express';
import { PostsService } from '../services/postsService';
import { ModerationService } from '../services/moderationService';
import { logger } from '../utils/logger';

const router = Router();
const postsService = new PostsService();
const moderationService = new ModerationService();

// Create new post
router.post('/', async (req, res) => {
  try {
    const { content, userId, mediaUrls } = req.body;
    
    // Create post
    const post = await postsService.createPost({
      content,
      userId,
      mediaUrls: mediaUrls || []
    });
    
    // Queue for moderation
    await moderationService.queueForModeration(post.id);
    
    res.status(201).json(post);
  } catch (error) {
    logger.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get posts with moderation status
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const posts = await postsService.getPosts({
      status: status as string,
      page: Number(page),
      limit: Number(limit)
    });
    
    res.json(posts);
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postsService.getPostById(id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    logger.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

export { router as postsController };

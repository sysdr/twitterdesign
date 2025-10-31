import { Router } from 'express';
import { TweetController } from '../controllers/TweetController';

const router = Router();
const tweetController = new TweetController();

router.post('/', tweetController.createTweet);
router.get('/:id', tweetController.getTweet);
router.delete('/:id', tweetController.deleteTweet);
router.post('/:id/like', tweetController.likeTweet);
router.post('/:id/retweet', tweetController.retweetTweet);
router.get('/user/:userId', tweetController.getUserTweets);

export { router as TweetRoutes };

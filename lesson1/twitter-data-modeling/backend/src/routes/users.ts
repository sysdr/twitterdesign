import { Router } from 'express';
import { createUser, getUser, followUser, unfollowUser, getFollowers, getFollowing } from '../controllers/userController';

const router = Router();

router.post('/', createUser);
router.get('/:id', getUser);
router.post('/:id/follow', followUser);
router.delete('/:id/follow', unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

export default router;

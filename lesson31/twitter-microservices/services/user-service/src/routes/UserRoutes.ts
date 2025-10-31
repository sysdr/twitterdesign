import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

router.get('/profile/:id', userController.getProfile);
router.put('/profile/:id', userController.updateProfile);
router.get('/:id/followers', userController.getFollowers);
router.post('/:id/follow', userController.followUser);

export { router as UserRoutes };

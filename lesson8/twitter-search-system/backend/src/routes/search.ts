import { Router } from 'express';
import { SearchController } from '../controllers/SearchController.js';

const router = Router();
const searchController = new SearchController();

router.get('/search', searchController.search);
router.get('/search/suggestions', searchController.suggestions);
router.get('/trending', searchController.trending);

export default router;

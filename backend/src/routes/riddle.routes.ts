import { Router } from 'express';
import { riddleController } from '../controllers/riddle.controller';
import { authenticate } from '../middleware/auth';
import { validate, riddleSchemas } from '../middleware/validation';
import { riddleLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', authenticate, riddleLimiter, riddleController.getRiddle);
router.post('/submit', authenticate, validate(riddleSchemas.submit), riddleController.submitAnswer);
router.get('/:riddleId/hint', authenticate, validate(riddleSchemas.getHint), riddleController.getHint);
router.get('/stats', authenticate, riddleController.getStats);

export default router;

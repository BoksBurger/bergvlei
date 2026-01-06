import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validate(authSchemas.register), authController.register);
router.post('/login', authLimiter, validate(authSchemas.login), authController.login);
router.get('/profile', authenticate, authController.getProfile);

export default router;

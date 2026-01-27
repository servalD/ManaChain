import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import brandRoutes from './brand.routes';
import tokenRoutes from './token.routes';
import likeRoutes from './like.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/brands', brandRoutes);
router.use('/tokens', tokenRoutes);
router.use('/likes', likeRoutes);

export default router;

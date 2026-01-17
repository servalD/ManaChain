import { Router } from 'express';
import { requireAuth, optionalAuth, requireVerified, requireBrand } from '../middleware/auth.middleware';
import * as tokenController from '../controllers/token.controller';

const router = Router();

// POST /tokens - Create a token
router.post('/', requireAuth, requireBrand, requireVerified, tokenController.createTokenController);

// GET /tokens/:id - Get token by ID
router.get('/:id', optionalAuth, tokenController.getTokenByIdController);

// GET /tokens/brand/:brandId - Get token by brand ID
router.get('/brand/:brandId', optionalAuth, tokenController.getTokenByBrandIdController);

// PUT /tokens/:id/price - Update token price
router.put('/:id/price', requireAuth, requireBrand, tokenController.updateTokenPriceController);

// GET /tokens/:id/holders - Get token holders
router.get('/:id/holders', optionalAuth, tokenController.getTokenHoldersController);

// GET /tokens/:id/balance - Get my balance for this token
router.get('/:id/balance', requireAuth, tokenController.getMyTokenBalanceController);

// POST /tokens/:id/transfer - Transfer tokens
router.post('/:id/transfer', requireAuth, requireVerified, tokenController.transferTokensController);

// POST /tokens/:id/purchase - Purchase tokens
router.post('/:id/purchase', requireAuth, requireVerified, tokenController.purchaseTokensController);

// GET /tokens/:id/transactions - Get token transactions
router.get('/:id/transactions', optionalAuth, tokenController.getTokenTransactionsController);

// GET /tokens/my/transactions - Get my transactions
router.get('/my/transactions', requireAuth, tokenController.getMyTransactionsController);

// GET /tokens/my/portfolio - Get my portfolio
router.get('/my/portfolio', requireAuth, tokenController.getMyPortfolioController);

export default router;

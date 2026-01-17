import { Request, Response } from 'express';
import supabase from '../config/supabase.config';
import {
  createToken,
  getTokenByBrandId,
  getTokenById,
  updateTokenPrice,
  getTokenHolders,
  getUserTokenBalance,
  transferTokens,
  purchaseTokens,
  getTokenTransactions,
  getUserTransactions,
  getUserTokens,
} from '../services/token.service';
import {
  CreateTokenRequest,
  UpdateTokenPriceRequest,
  PurchaseTokenRequest,
  TransferTokenRequest,
  GetTokenHoldersRequest,
  GetTransactionsRequest,
} from '../interfaces/token.interface';

/**
 * POST /tokens
 * Create a token for the authenticated user's brand
 */
export const createTokenController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { symbol, total_supply, current_price } = req.body;

    // Validation
    if (!symbol) {
      res.status(400).json({
        error: 'Token symbol is required',
      });
      return;
    }

    // Get user's brand
    const { data: brand } = await supabase
      .from('brand')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!brand) {
      res.status(404).json({
        error: 'You must have a brand to create a token',
      });
      return;
    }

    const request: CreateTokenRequest = {
      brandId: brand.id,
      symbol: symbol.toUpperCase(),
      total_supply: total_supply || 0,
      current_price: current_price || '0',
    };

    const result = await createToken(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: 'Token created successfully',
      token: result.data,
    });
  } catch (error) {
    console.error('createTokenController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /tokens/:id
 * Get token by ID
 */
export const getTokenByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await getTokenById(id);

    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json({ token: result.data });
  } catch (error) {
    console.error('getTokenByIdController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /tokens/brand/:brandId
 * Get token by brand ID
 */
export const getTokenByBrandIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { brandId } = req.params;

    const result = await getTokenByBrandId(brandId);

    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json({ token: result.data });
  } catch (error) {
    console.error('getTokenByBrandIdController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /tokens/:id/price
 * Update token price
 */
export const updateTokenPriceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { price } = req.body;

    if (!price) {
      res.status(400).json({
        error: 'Price is required',
      });
      return;
    }

    // Check if token belongs to user
    const { data: token } = await supabase
      .from('brand_token')
      .select('brand:brand_id(user_id)')
      .eq('id', id)
      .single();

    if (!token || (token.brand as any)?.user_id !== userId) {
      res.status(403).json({
        error: 'You do not have permission to modify this token',
      });
      return;
    }

    const request: UpdateTokenPriceRequest = {
      tokenId: id,
      price,
    };

    const result = await updateTokenPrice(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Price updated successfully',
      token: result.data,
    });
  } catch (error) {
    console.error('updateTokenPriceController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /tokens/:id/holders
 * Get token holders
 */
export const getTokenHoldersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const request: GetTokenHoldersRequest = {
      tokenId: id,
      limit,
      offset,
    };

    const result = await getTokenHolders(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      holders: result.data!.holders,
      total: result.data!.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('getTokenHoldersController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /tokens/:id/balance
 * Get authenticated user's balance for a token
 */
export const getMyTokenBalanceController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const result = await getUserTokenBalance(userId, id);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ balance: result.data });
  } catch (error) {
    console.error('getMyTokenBalanceController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /tokens/:id/transfer
 * Transfer tokens to another user
 */
export const transferTokensController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { to_user_id, amount } = req.body;

    if (!to_user_id || !amount) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['to_user_id', 'amount'],
      });
      return;
    }

    const request: TransferTokenRequest = {
      fromUserId: userId,
      toUserId: to_user_id,
      tokenId: id,
      amount: parseInt(amount),
    };

    const result = await transferTokens(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ message: 'Transfer successful' });
  } catch (error) {
    console.error('transferTokensController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /tokens/:id/purchase
 * Purchase tokens
 */
export const purchaseTokensController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { amount, price_per_token } = req.body;

    if (!amount || !price_per_token) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['amount', 'price_per_token'],
      });
      return;
    }

    const request: PurchaseTokenRequest = {
      userId,
      tokenId: id,
      amount: parseInt(amount),
      pricePerToken: price_per_token,
    };

    const result = await purchaseTokens(request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ message: 'Purchase successful' });
  } catch (error) {
    console.error('purchaseTokensController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /tokens/:id/transactions
 * Get token transaction history
 */
export const getTokenTransactionsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const request: GetTransactionsRequest = {
      limit,
      offset,
    };

    const result = await getTokenTransactions(id, request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      transactions: result.data!.transactions,
      total: result.data!.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('getTokenTransactionsController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /tokens/my/transactions
 * Get authenticated user's transaction history
 */
export const getMyTransactionsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const request: GetTransactionsRequest = {
      limit,
      offset,
    };

    const result = await getUserTransactions(userId, request);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      transactions: result.data!.transactions,
      total: result.data!.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('getMyTransactionsController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /tokens/my/portfolio
 * Get authenticated user's token portfolio
 */
export const getMyPortfolioController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const result = await getUserTokens(userId);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ portfolio: result.data });
  } catch (error) {
    console.error('getMyPortfolioController error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

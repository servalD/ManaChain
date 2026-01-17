import supabase from '../config/supabase.config';
import { ServiceResponse, success, failure } from './service.result';
import {
  BrandToken,
  TokenHolder,
  TokenTransaction,
  TokenTransactionInsert,
} from '../types/database.types';
import {
  CreateTokenRequest,
  UpdateTokenPriceRequest,
  PurchaseTokenRequest,
  TransferTokenRequest,
  GetTokenHoldersRequest,
  GetTransactionsRequest,
} from '../interfaces/token.interface';

/**
 * Create a token for a brand
 */
export const createToken = async (
  request: CreateTokenRequest
): Promise<ServiceResponse<BrandToken>> => {
  try {
    const { brandId, ...tokenData } = request;

    // Check if brand exists
    const { data: brand } = await supabase
      .from('brand')
      .select('id')
      .eq('id', brandId)
      .single();

    if (!brand) {
      return failure('Brand not found');
    }

    // Check if brand doesn't already have a token
    const { data: existingToken } = await supabase
      .from('brand_token')
      .select('id')
      .eq('brand_id', brandId)
      .single();

    if (existingToken) {
      return failure('This brand already has a token');
    }

    // Check if symbol is not already taken
    const { data: symbolCheck } = await supabase
      .from('brand_token')
      .select('id')
      .eq('symbol', tokenData.symbol)
      .single();

    if (symbolCheck) {
      return failure('This token symbol is already in use');
    }

    // Create token
    const { data, error } = await supabase
      .from('brand_token')
      .insert({
        ...tokenData,
        brand_id: brandId,
      })
      .select()
      .single();

    if (error) {
      console.error('Token creation error:', error);
      return failure('Error creating token');
    }

    return success(data);
  } catch (error) {
    console.error('createToken error:', error);
    return failure('Server error creating token');
  }
};

/**
 * Get token by brand ID
 */
export const getTokenByBrandId = async (brandId: string): Promise<ServiceResponse<BrandToken>> => {
  try {
    const { data, error } = await supabase
      .from('brand_token')
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (error || !data) {
      return failure('Token not found for this brand');
    }

    return success(data);
  } catch (error) {
    console.error('getTokenByBrandId error:', error);
    return failure('Server error retrieving token');
  }
};

/**
 * Get token by ID
 */
export const getTokenById = async (tokenId: string): Promise<ServiceResponse<BrandToken>> => {
  try {
    const { data, error } = await supabase
      .from('brand_token')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (error || !data) {
      return failure('Token not found');
    }

    return success(data);
  } catch (error) {
    console.error('getTokenById error:', error);
    return failure('Server error retrieving token');
  }
};

/**
 * Update token price
 */
export const updateTokenPrice = async (
  request: UpdateTokenPriceRequest
): Promise<ServiceResponse<BrandToken>> => {
  try {
    const { tokenId, price } = request;
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return failure('Invalid price');
    }

    const { data, error } = await supabase
      .from('brand_token')
      .update({ current_price: price })
      .eq('id', tokenId)
      .select()
      .single();

    if (error) {
      console.error('updateTokenPrice error:', error);
      return failure('Error updating price');
    }

    return success(data);
  } catch (error) {
    console.error('updateTokenPrice error:', error);
    return failure('Server error updating price');
  }
};

/**
 * Get token holders
 */
export const getTokenHolders = async (
  request: GetTokenHoldersRequest
): Promise<ServiceResponse<{ holders: TokenHolder[]; total: number }>> => {
  try {
    const { tokenId, limit, offset } = request;
    const { data, error, count } = await supabase
      .from('token_holder')
      .select('*', { count: 'exact' })
      .eq('token_id', tokenId)
      .gt('balance', 0)
      .order('balance', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('getTokenHolders error:', error);
      return failure('Error retrieving holders');
    }

    return success({
      holders: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('getTokenHolders error:', error);
    return failure('Server error retrieving holders');
  }
};

/**
 * Get user's token balance
 */
export const getUserTokenBalance = async (
  userId: string,
  tokenId: string
): Promise<ServiceResponse<number>> => {
  try {
    const { data, error } = await supabase
      .from('token_holder')
      .select('balance')
      .eq('user_id', userId)
      .eq('token_id', tokenId)
      .single();

    if (error || !data) {
      return success(0);
    }

    return success(data.balance);
  } catch (error) {
    console.error('getUserTokenBalance error:', error);
    return failure('Server error retrieving balance');
  }
};

/**
 * Transfer tokens between users
 */
export const transferTokens = async (
  request: TransferTokenRequest
): Promise<ServiceResponse<void>> => {
  try {
    const { fromUserId, toUserId, tokenId, amount } = request;

    if (amount <= 0) {
      return failure('Amount must be positive');
    }

    if (fromUserId === toUserId) {
      return failure('Cannot transfer to yourself');
    }

    // Check sender's balance
    const { data: senderHolder } = await supabase
      .from('token_holder')
      .select('balance')
      .eq('user_id', fromUserId)
      .eq('token_id', tokenId)
      .single();

    if (!senderHolder || senderHolder.balance < amount) {
      return failure('Insufficient balance');
    }

    // Debit sender
    const { error: debitError } = await supabase
      .from('token_holder')
      .update({ balance: senderHolder.balance - amount })
      .eq('user_id', fromUserId)
      .eq('token_id', tokenId);

    if (debitError) {
      console.error('Debit error:', debitError);
      return failure('Error debiting amount');
    }

    // Credit receiver (or create entry if doesn't exist)
    const { data: receiverHolder } = await supabase
      .from('token_holder')
      .select('balance')
      .eq('user_id', toUserId)
      .eq('token_id', tokenId)
      .single();

    if (receiverHolder) {
      // Update existing balance
      const { error: creditError } = await supabase
        .from('token_holder')
        .update({ balance: receiverHolder.balance + amount })
        .eq('user_id', toUserId)
        .eq('token_id', tokenId);

      if (creditError) {
        console.error('Credit error:', creditError);
        return failure('Error crediting amount');
      }
    } else {
      // Create new entry
      const { error: createError } = await supabase
        .from('token_holder')
        .insert({
          user_id: toUserId,
          token_id: tokenId,
          balance: amount,
        });

      if (createError) {
        console.error('Holder creation error:', createError);
        return failure('Error creating holder');
      }
    }

    // Record transaction
    await createTransaction({
      token_id: tokenId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount,
      transaction_type: 'transfer',
    });

    return success(undefined);
  } catch (error) {
    console.error('transferTokens error:', error);
    return failure('Server error during transfer');
  }
};

/**
 * Purchase tokens (emission or secondary purchase)
 */
export const purchaseTokens = async (
  request: PurchaseTokenRequest
): Promise<ServiceResponse<void>> => {
  try {
    const { userId, tokenId, amount, pricePerToken } = request;

    if (amount <= 0) {
      return failure('Amount must be positive');
    }

    const price = parseFloat(pricePerToken);
    if (isNaN(price) || price < 0) {
      return failure('Invalid price');
    }

    // Check if token exists
    const { data: token } = await supabase
      .from('brand_token')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (!token) {
      return failure('Token not found');
    }

    // Get or create token_holder entry
    const { data: holder } = await supabase
      .from('token_holder')
      .select('balance')
      .eq('user_id', userId)
      .eq('token_id', tokenId)
      .single();

    if (holder) {
      // Update balance
      const { error: updateError } = await supabase
        .from('token_holder')
        .update({ balance: holder.balance + amount })
        .eq('user_id', userId)
        .eq('token_id', tokenId);

      if (updateError) {
        console.error('Holder update error:', updateError);
        return failure('Error updating balance');
      }
    } else {
      // Create new entry
      const { error: createError } = await supabase
        .from('token_holder')
        .insert({
          user_id: userId,
          token_id: tokenId,
          balance: amount,
        });

      if (createError) {
        console.error('Holder creation error:', createError);
        return failure('Error creating holder');
      }
    }

    // Update token total_supply
    const { error: supplyError } = await supabase
      .from('brand_token')
      .update({ total_supply: token.total_supply + amount })
      .eq('id', tokenId);

    if (supplyError) {
      console.error('Supply update error:', supplyError);
    }

    // Record transaction
    await createTransaction({
      token_id: tokenId,
      from_user_id: null, // null for purchases (emission)
      to_user_id: userId,
      amount,
      price_per_token: pricePerToken,
      transaction_type: 'purchase',
    });

    return success(undefined);
  } catch (error) {
    console.error('purchaseTokens error:', error);
    return failure('Server error during purchase');
  }
};

/**
 * Create transaction (internal helper)
 */
const createTransaction = async (
  transactionData: TokenTransactionInsert
): Promise<void> => {
  try {
    await supabase.from('token_transaction').insert(transactionData);
  } catch (error) {
    console.error('Transaction creation error:', error);
  }
};

/**
 * Get token transaction history
 */
export const getTokenTransactions = async (
  tokenId: string,
  request: GetTransactionsRequest
): Promise<ServiceResponse<{ transactions: TokenTransaction[]; total: number }>> => {
  try {
    const { limit, offset } = request;
    const { data, error, count } = await supabase
      .from('token_transaction')
      .select('*', { count: 'exact' })
      .eq('token_id', tokenId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('getTokenTransactions error:', error);
      return failure('Error retrieving transactions');
    }

    return success({
      transactions: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('getTokenTransactions error:', error);
    return failure('Server error retrieving transactions');
  }
};

/**
 * Get user transaction history
 */
export const getUserTransactions = async (
  userId: string,
  request: GetTransactionsRequest
): Promise<ServiceResponse<{ transactions: TokenTransaction[]; total: number }>> => {
  try {
    const { limit, offset } = request;
    const { data, error, count } = await supabase
      .from('token_transaction')
      .select('*', { count: 'exact' })
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('getUserTransactions error:', error);
      return failure('Error retrieving transactions');
    }

    return success({
      transactions: data || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('getUserTransactions error:', error);
    return failure('Server error retrieving transactions');
  }
};

/**
 * Get all user tokens
 */
export const getUserTokens = async (
  userId: string
): Promise<ServiceResponse<Array<TokenHolder & { token: BrandToken }>>> => {
  try {
    const { data, error } = await supabase
      .from('token_holder')
      .select(`
        *,
        token:brand_token(*)
      `)
      .eq('user_id', userId)
      .gt('balance', 0)
      .order('balance', { ascending: false });

    if (error) {
      console.error('getUserTokens error:', error);
      return failure('Error retrieving tokens');
    }

    return success(data as any || []);
  } catch (error) {
    console.error('getUserTokens error:', error);
    return failure('Server error retrieving tokens');
  }
};

export interface CreateTokenRequest {
  brandId: string;
  symbol: string;
  total_supply?: number;
  current_price?: string;
}

export interface UpdateTokenPriceRequest {
  tokenId: string;
  price: string;
}

export interface PurchaseTokenRequest {
  userId: string;
  tokenId: string;
  amount: number;
  pricePerToken: string;
}

export interface TransferTokenRequest {
  fromUserId: string;
  toUserId: string;
  tokenId: string;
  amount: number;
}

export interface GetTokenHoldersRequest {
  tokenId: string;
  limit: number;
  offset: number;
}

export interface GetTransactionsRequest {
  limit: number;
  offset: number;
}

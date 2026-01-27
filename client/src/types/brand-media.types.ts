export interface BrandMedia {
  id: string;
  brand_id: string;
  image_url: string;
  ipfs_hash: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ConfirmBrandMediaRequest {
  ipfsHash: string;
  ipfsUrl: string;
}

export interface GetBrandMediaResponse {
  media: BrandMedia[];
}

export interface DeleteBrandMediaResponse {
  message: string;
}

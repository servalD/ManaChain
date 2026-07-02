export interface BrandMedia {
  id: string;
  brandId: string;
  imageUrl: string;
  ipfsHash: string;
  displayOrder: number;
  createdAt: string;
}

export interface ConfirmBrandMediaRequest {
  ipfsHash: string;
  imageUrl: string;
}

export type GetBrandMediaResponse = BrandMedia[];

export interface DeleteBrandMediaResponse {
  message: string;
}

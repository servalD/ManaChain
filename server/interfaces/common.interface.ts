export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

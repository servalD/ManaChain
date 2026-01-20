export class ApiService {
  static readonly baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // External APIs
  static readonly NOMINATIM_GEOCODING_URL = 'https://nominatim.openstreetmap.org';
  
  // Pinata IPFS APIs
  static readonly PINATA_API_URL = 'https://api.pinata.cloud';
  static readonly PINATA_GATEWAY_URL = process.env.NEXT_PUBLIC_PINATA_GATEWAY || '';
}
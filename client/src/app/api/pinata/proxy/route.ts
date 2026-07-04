import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { asAxiosError } from '@/lib/api-error';

/**
 * Proxy route to serve Pinata IPFS files
 * Uses the public Pinata gateway which works without authentication
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ipfsHash = searchParams.get('hash');

    if (!ipfsHash) {
      return NextResponse.json(
        { error: 'IPFS hash is required' },
        { status: 400 }
      );
    }

    // Use public Pinata gateway (works without authentication)
    const publicGatewayUrl = 'https://gateway.pinata.cloud';
    const pinataUrl = `${publicGatewayUrl}/ipfs/${ipfsHash}`;

    // Fetch from public gateway (no authentication needed)
    const response = await axios.get(pinataUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    // Determine content type from response or default to image
    // (String() : axios ≥1.16 type la valeur d'en-tête plus largement que string)
    const contentType = String(response.headers['content-type'] ?? 'image/jpeg');

    // Return the file with appropriate headers
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    const axiosErr = asAxiosError(error);
    console.error('Pinata proxy error:', error);
    console.error('Error response:', axiosErr?.response?.data);
    console.error('Error status:', axiosErr?.response?.status);


    if (axiosErr?.response?.status === 404) {
      return NextResponse.json(
        { error: 'File not found on Pinata' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: axiosErr?.message || 'Failed to fetch file from Pinata',
        status: axiosErr?.response?.status,
        details: axiosErr?.response?.data
      },
      { status: axiosErr?.response?.status || 500 }
    );
  }
}
